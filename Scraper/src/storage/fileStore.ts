import { mkdir, readFile, writeFile, appendFile, access } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { PricingBand, RawQuote, ScrapeRun } from "../types.js";

export class FileStore {
  readonly rootDir: string;
  readonly rawQuotesPath: string;
  readonly pricingBandsPath: string;
  readonly scrapeRunsPath: string;

  constructor(rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "../../data")) {
    this.rootDir = rootDir;
    this.rawQuotesPath = join(rootDir, "raw_quotes.jsonl");
    this.pricingBandsPath = join(rootDir, "pricing_bands.json");
    this.scrapeRunsPath = join(rootDir, "scrape_runs.jsonl");
  }

  async ensure(): Promise<void> {
    await mkdir(this.rootDir, { recursive: true });
  }

  async appendRawQuotes(quotes: RawQuote[]): Promise<void> {
    if (quotes.length === 0) return;
    await this.ensureParent(this.rawQuotesPath);
    const payload = quotes.map((quote) => JSON.stringify(quote)).join("\n") + "\n";
    await appendFile(this.rawQuotesPath, payload, "utf8");
  }

  async readRawQuotes(): Promise<RawQuote[]> {
    return this.readJsonl<RawQuote>(this.rawQuotesPath);
  }

  async writePricingBands(bands: PricingBand[]): Promise<void> {
    await this.ensureParent(this.pricingBandsPath);
    await writeFile(this.pricingBandsPath, `${JSON.stringify(bands, null, 2)}\n`, "utf8");
  }

  async readPricingBands(): Promise<PricingBand[]> {
    if (!(await exists(this.pricingBandsPath))) return [];
    return JSON.parse(await readFile(this.pricingBandsPath, "utf8")) as PricingBand[];
  }

  async appendScrapeRun(run: ScrapeRun): Promise<void> {
    await this.ensureParent(this.scrapeRunsPath);
    await appendFile(this.scrapeRunsPath, `${JSON.stringify(run)}\n`, "utf8");
  }

  async readScrapeRuns(): Promise<ScrapeRun[]> {
    return this.readJsonl<ScrapeRun>(this.scrapeRunsPath);
  }

  private async readJsonl<T>(path: string): Promise<T[]> {
    if (!(await exists(path))) return [];
    const content = await readFile(path, "utf8");
    return content
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line) as T);
  }

  private async ensureParent(path: string): Promise<void> {
    await mkdir(dirname(path), { recursive: true });
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
