import type { Page } from "playwright";
import type { CoverageType } from "../types.js";
import { normalizeCoverageType } from "../utils/normalize.js";
import { extractPremiumsFromText, type ExtractedPremium } from "./browserQuoteTools.js";

const PLAN_CARD_SELECTORS = [
  "[data-selenium-name*='package' i]",
  "[data-selenium-name*='plan' i]",
  "[class*='package' i]",
  "[class*='plan' i]",
  "[class*='quote' i]",
  ".card",
  "section",
];

export async function extractAnnualPlanPremiumsFromPage(page: Page, fallbackText: string): Promise<ExtractedPremium[]> {
  const automation = await extractFromAutomationSummary(page);
  if (automation.length > 0) return automation;

  const scoped = await extractFromPlanLikeElements(page);
  if (scoped.length > 0) return scoped;

  return extractPremiumsFromText(fallbackText, "body_text_annual");
}

async function extractFromAutomationSummary(page: Page): Promise<ExtractedPremium[]> {
  const summaryPrice = page.locator('[data-selenium-name="SummaryPrice"]').first();
  const coverType = page.locator('[data-selenium-name="CoverType"]').first();
  const paymentFrequency = page.locator('[data-selenium-name="PaymentFrequency"]').first();
  const rawPrice = await summaryPrice.getAttribute("data-selenium-value").catch(() => null);
  if (!rawPrice) return [];

  const frequency = await paymentFrequency.getAttribute("data-selenium-value").catch(() => "");
  if (frequency && !/year|annual/i.test(frequency)) return [];

  const premiumThb = Number(rawPrice.replace(/,/g, ""));
  if (!Number.isFinite(premiumThb) || premiumThb < 1000) return [];

  const rawCoverageLabel = (await coverType.getAttribute("data-selenium-value").catch(() => undefined)) ?? undefined;
  return [{
    premiumThb,
    premiumBasis: "annual",
    matchedText: `SummaryPrice=${rawPrice}; PaymentFrequency=${frequency || "Yearly"}`,
    rawCoverageLabel,
    coverageType: rawCoverageLabel ? normalizeCoverageType(rawCoverageLabel) : undefined,
    extractionMethod: "dom_plan_card",
  }];
}

async function extractFromPlanLikeElements(page: Page): Promise<ExtractedPremium[]> {
  const extracted: ExtractedPremium[] = [];
  const seenTexts = new Set<string>();

  for (const selector of PLAN_CARD_SELECTORS) {
    const elements = page.locator(selector);
    const count = Math.min(await elements.count().catch(() => 0), 40);
    for (let index = 0; index < count; index += 1) {
      const element = elements.nth(index);
      const box = await element.boundingBox().catch(() => null);
      if (!box || box.width === 0 || box.height === 0) continue;
      const text = (await element.innerText().catch(() => "")).replace(/\s+/g, " ").trim();
      if (!text || seenTexts.has(text) || !/annual/i.test(text)) continue;
      seenTexts.add(text);
      extracted.push(...extractPremiumsFromText(text, "dom_plan_card"));
    }
    if (extracted.length > 0) break;
  }

  return dedupeByPremiumAndCoverage(extracted);
}

function dedupeByPremiumAndCoverage(premiums: ExtractedPremium[]): ExtractedPremium[] {
  const byKey = new Map<string, ExtractedPremium>();
  for (const premium of premiums) {
    byKey.set(`${premium.premiumThb}|${premium.coverageType ?? "unknown"}`, premium);
  }
  return Array.from(byKey.values()).sort((a, b) => a.premiumThb - b.premiumThb);
}
