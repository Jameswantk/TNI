import type { Page } from "playwright";
import type { VehicleCatalogEntry } from "../types.js";
import { acceptCookies, clickFirstVisible, detectAutomationBlock, getVisibleBodyText } from "../live/browserQuoteTools.js";
import { captureDiagnostics, closeLiveBrowser, launchLiveBrowser } from "../live/liveBrowser.js";

const ROOJAI_START_URL = "https://insure.roojai.com/#/car";

export interface CatalogCrawlOptions {
  runId: string;
  sites: string[];
  maxBrands: number;
  maxModelsPerBrand: number;
}

export async function crawlVehicleCatalog(options: CatalogCrawlOptions): Promise<VehicleCatalogEntry[]> {
  const entries: VehicleCatalogEntry[] = [];
  if (options.sites.includes("roojai_live")) {
    entries.push(...await crawlRoojaiCatalog(options));
  }
  return entries;
}

async function crawlRoojaiCatalog(options: CatalogCrawlOptions): Promise<VehicleCatalogEntry[]> {
  const session = await launchLiveBrowser();
  const page = await session.context.newPage();
  const scrapedAt = new Date().toISOString();

  try {
    await page.goto(ROOJAI_START_URL, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(4000);
    await acceptCookies(page);
    await clickFirstVisible(page, ["#btn-select-language"]);
    await clickFirstVisible(page, ["button:has-text('Eng')", "a:has-text('Eng')"]);
    await clickFirstVisible(page, ["#btn-select-brand"]);
    await page.waitForTimeout(1000);

    const text = await getVisibleBodyText(page);
    const blockReason = detectAutomationBlock(text);
    if (blockReason) {
      await captureDiagnostics(page, "roojai_live", options.runId, "catalog_blocked");
      throw new Error(blockReason);
    }

    const brands = await visibleOptionTexts(page, '[data-selenium-name="carBrand-item"], a.dropdown-item, button');
    const selectedBrands = brands.filter((brand) => !/other brands|select|automation/i.test(brand)).slice(0, options.maxBrands);
    const entries: VehicleCatalogEntry[] = selectedBrands.map((brand) => ({
      site: "roojai_live",
      brand,
      scrapedAt,
      source: "live_dropdown",
    }));

    for (const brand of selectedBrands) {
      if (options.maxModelsPerBrand <= 0) continue;
      await resetToBrandSelection(page);
      if (!(await clickBrand(page, brand))) continue;
      await page.waitForTimeout(1000);
      const models = (await visibleOptionTexts(page, '[data-selenium-name="carModel-item"], [data-selenium-name="carModel-item-hit"], a.dropdown-item'))
        .filter((model) => !/select|automation/i.test(model))
        .slice(0, options.maxModelsPerBrand);
      entries.push(...models.map((model) => ({
        site: "roojai_live",
        brand,
        model,
        scrapedAt,
        source: "live_dropdown" as const,
      })));
    }

    return entries;
  } finally {
    await page.close().catch(() => undefined);
    await closeLiveBrowser(session);
  }
}

async function visibleOptionTexts(page: Page, selector: string): Promise<string[]> {
  const values = new Set<string>();
  const locators = page.locator(selector);
  const count = Math.min(await locators.count().catch(() => 0), 200);
  for (let index = 0; index < count; index += 1) {
    const locator = locators.nth(index);
    const box = await locator.boundingBox().catch(() => null);
    if (!box || box.width === 0 || box.height === 0) continue;
    const text = (await locator.innerText().catch(() => "")).replace(/\s+/g, " ").trim();
    if (text) values.add(text);
  }
  return Array.from(values);
}

async function resetToBrandSelection(page: Page): Promise<void> {
  await clickFirstVisible(page, ["#btn-select-brand"]);
  await page.waitForTimeout(500);
}

async function clickBrand(page: Page, brand: string): Promise<boolean> {
  const option = page.locator('[data-selenium-name="carBrand-item"], a.dropdown-item, button').filter({ hasText: brand }).first();
  if (!(await option.isVisible().catch(() => false))) return false;
  await option.click({ timeout: 10000 });
  return true;
}
