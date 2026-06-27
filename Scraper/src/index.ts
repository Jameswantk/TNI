import { program } from "commander";
import { buildPricingBands } from "./bander.js";
import { liveQuoteFlowAdapters, publicPageAdapters } from "./adapters/index.js";
import { crawlVehicleCatalog } from "./catalog/catalogCrawler.js";
import { DEFAULT_CATALOG_PATH, mergeVehicleCatalog, readVehicleCatalog, writeVehicleCatalog } from "./catalog/vehicleCatalog.js";
import { generateLiveQuoteScenarios } from "./grid/gridGenerator.js";
import { importPricingBandsFromCsv } from "./manualImport.js";
import { buildCoverageReport } from "./reports/coverageReport.js";
import { planIncrementalRefresh } from "./scheduler/incrementalPlan.js";
import { FileStore } from "./storage/fileStore.js";
import { saveManualAuthState } from "./live/liveBrowser.js";
import type { ScrapeRun, SiteAdapter } from "./types.js";
import { createRunId } from "./utils/ids.js";

const store = new FileStore();

program
  .name("indara-price-scraper")
  .description("Offline pricing-band worker for the Indara AI insurance advisor.")
  .version("0.1.0");

program.command("validate").description("Validate local scraper storage.").action(async () => {
  await store.ensure();
  const [rawQuotes, pricingBands, scrapeRuns] = await Promise.all([
    store.readRawQuotes(),
    store.readPricingBands(),
    store.readScrapeRuns(),
  ]);

  console.log("Scraper storage OK");
  console.log(`raw_quotes: ${rawQuotes.length}`);
  console.log(`pricing_bands: ${pricingBands.length}`);
  console.log(`scrape_runs: ${scrapeRuns.length}`);
});

program.command("import-csv").argument("<path>", "CSV file path").description("Import manual pricing bands.").action(
  async (path: string) => {
    const imported = await importPricingBandsFromCsv(path);
    const existing = await store.readPricingBands();
    const merged = mergePricingBands(existing, imported);
    await store.writePricingBands(merged);
    console.log(`Imported ${imported.length} manual pricing band(s).`);
    console.log(`Total pricing bands: ${merged.length}`);
  },
);

program.command("scrape-public").description("Collect public-page market calibration observations.").action(async () => {
  await runAdapters(publicPageAdapters());
});

program.command("scrape-live").description("Collect approved live quote-form observations.").action(async () => {
  if (process.env.ALLOW_LIVE_QUOTE_FORMS !== "true") {
    throw new Error("Refusing to run live quote forms. Set ALLOW_LIVE_QUOTE_FORMS=true after approval.");
  }
  await runAdapters(liveQuoteFlowAdapters());
});

program
  .command("catalog")
  .description("Crawl approved live-form vehicle dropdowns into data/vehicle_catalog.json.")
  .option("--path <path>", "Catalog output path", DEFAULT_CATALOG_PATH)
  .option("--max-brands <count>", "Maximum brands per run", "5")
  .option("--max-models <count>", "Maximum models per brand per run", "10")
  .action(async (options: { path: string; maxBrands: string; maxModels: string }) => {
    if (process.env.ALLOW_CATALOG_CRAWL !== "true") {
      throw new Error("Refusing to crawl live dropdowns. Set ALLOW_CATALOG_CRAWL=true after approval.");
    }
    const sites = parseCsvEnv("CATALOG_SITES");
    if (sites.length === 0) throw new Error("Set CATALOG_SITES to an approved comma-separated site list, e.g. roojai_live.");
    const maxBrands = parsePositiveInt(options.maxBrands, "--max-brands");
    const maxModelsPerBrand = parsePositiveInt(options.maxModels, "--max-models");
    const runId = createRunId();
    const existing = await readVehicleCatalog(options.path);
    const incoming = await crawlVehicleCatalog({ runId, sites, maxBrands, maxModelsPerBrand });
    const merged = mergeVehicleCatalog(existing, incoming);
    await writeVehicleCatalog(merged, options.path);
    console.log(`Catalog crawl ${runId} wrote ${merged.length} total catalog entrie(s), ${incoming.length} new observation(s).`);
  });

program.command("grid").description("Print the bounded default live quote grid.").action(() => {
  const scenarios = generateLiveQuoteScenarios();
  console.log(`Generated ${scenarios.length} scenario(s).`);
  console.log(JSON.stringify(scenarios, null, 2));
});

program
  .command("save-auth-state")
  .argument("<url>", "Authorized site URL to open")
  .argument("<path>", "Where to save Playwright storage state JSON")
  .option("--wait-ms <ms>", "How long to wait for manual login/verification", "60000")
  .description("Open a headed browser so an authorized tester can manually sign in and save browser state.")
  .action(async (url: string, path: string, options: { waitMs: string }) => {
    const waitMs = Number(options.waitMs);
    if (!Number.isFinite(waitMs) || waitMs < 1000) {
      throw new Error("--wait-ms must be a number >= 1000");
    }
    await saveManualAuthState(url, path, waitMs);
    console.log(`Saved browser state to ${path}`);
  });

program.command("band").description("Recompute pricing bands from annual raw quote observations.").action(async () => {
  const [rawQuotes, existingBands] = await Promise.all([store.readRawQuotes(), store.readPricingBands()]);
  const bands = buildPricingBands(rawQuotes, existingBands);
  await store.writePricingBands(bands);
  console.log(`Wrote ${bands.length} pricing band(s).`);
});

program.command("report:coverage").description("List missing coverage tiers by vehicle group.").action(async () => {
  const bands = await store.readPricingBands();
  const rows = buildCoverageReport(bands);
  for (const row of rows) {
    console.log(`${row.vehicleGroup}: present=${row.present.join("|") || "none"}; missing=${row.missing.join("|") || "none"}`);
  }
  if (rows.length === 0) console.log("No pricing bands available.");
});

program
  .command("plan:incremental")
  .option("--limit <count>", "Maximum bands to refresh", "20")
  .description("Plan a bounded refresh slice prioritizing stale and low-confidence bands.")
  .action(async (options: { limit: string }) => {
    const limit = parsePositiveInt(options.limit, "--limit");
    const bands = await store.readPricingBands();
    console.log(JSON.stringify(planIncrementalRefresh(bands, limit), null, 2));
  });

program.command("test:unit").description("Run lightweight unit checks.").action(async () => {
  const { runUnitChecks } = await import("./tests/unitChecks.js");
  runUnitChecks();
  console.log("Unit checks passed.");
});

await program.parseAsync();

function mergePricingBands(existing: Awaited<ReturnType<FileStore["readPricingBands"]>>, incoming: typeof existing) {
  const byKey = new Map(existing.map((band) => [band.bandKey, band]));
  for (const band of incoming) {
    byKey.set(band.bandKey, band);
  }
  return Array.from(byKey.values()).sort((a, b) => a.bandKey.localeCompare(b.bandKey));
}

async function runAdapters(adapters: SiteAdapter[]): Promise<void> {
  const runId = createRunId();
  const startedAt = new Date().toISOString();
  const perSiteSuccessCount: Record<string, number> = {};
  const perSiteFailCount: Record<string, number> = {};
  const notes: string[] = [];
  const quotes = [];

  for (const adapter of adapters) {
    try {
      const siteQuotes = await adapter.collect(runId);
      quotes.push(...siteQuotes);
      const usableQuotes = siteQuotes.filter((quote) => quote.parseOk && quote.premiumThb !== null && quote.premiumBasis === "annual" && quote.coverageType).length;
      const handledFailures = siteQuotes.length - usableQuotes;
      perSiteSuccessCount[adapter.site] = usableQuotes;
      perSiteFailCount[adapter.site] = handledFailures;
      notes.push(`${adapter.site}: collected ${usableQuotes} usable annual quote observation(s), ${handledFailures} handled failure/non-price/non-annual observation(s).`);
    } catch (error) {
      perSiteSuccessCount[adapter.site] = 0;
      perSiteFailCount[adapter.site] = 1;
      notes.push(`${adapter.site}: ${(error as Error).message}`);
    }
  }

  await store.appendRawQuotes(quotes);
  const failedSites = Object.values(perSiteFailCount).reduce((sum, count) => sum + count, 0);
  const usableTotal = quotes.filter((quote) => quote.parseOk && quote.premiumThb !== null && quote.premiumBasis === "annual" && quote.coverageType).length;
  const run: ScrapeRun = {
    runId,
    startedAt,
    finishedAt: new Date().toISOString(),
    status: failedSites === 0 ? "success" : quotes.length > 0 ? "partial" : "failed",
    perSiteSuccessCount,
    perSiteFailCount,
    totalQuotes: quotes.length,
    notes: notes.join(" "),
  };
  await store.appendScrapeRun(run);

  console.log(`Run ${runId} finished with status ${run.status}.`);
  console.log(`Collected ${usableTotal} usable annual quote observation(s), ${quotes.length - usableTotal} handled failure/non-price/non-annual observation(s).`);
  console.log(run.notes);
}

function parseCsvEnv(name: string): string[] {
  return (process.env[name] ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function parsePositiveInt(value: string, label: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) throw new Error(`${label} must be a non-negative integer.`);
  return parsed;
}
