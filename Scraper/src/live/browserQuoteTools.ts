import type { Page } from "playwright";
import type { CoverageType, ExtractionMethod } from "../types.js";
import { normalizeCoverageType } from "../utils/normalize.js";

export interface ExtractedPremium {
  premiumThb: number;
  matchedText: string;
  premiumBasis: "annual";
  coverageType?: CoverageType;
  rawCoverageLabel?: string;
  extractionMethod: ExtractionMethod;
}

export async function acceptCookies(page: Page): Promise<void> {
  for (const selector of ["#pdpa_accept_all", "button:has-text('Accept')", "button:has-text('OK')"]) {
    const locator = page.locator(selector).first();
    if (await locator.isVisible().catch(() => false)) {
      await locator.click({ timeout: 3000 }).catch(() => undefined);
      await page.waitForTimeout(500);
      return;
    }
  }
}

export async function clickVisibleText(page: Page, text: string): Promise<boolean> {
  const locator = page.locator("a:visible,button:visible,[role='button']:visible").filter({
    hasText: new RegExp(`^${escapeRegExp(text)}$`, "i"),
  });
  if (await locator.first().isVisible().catch(() => false)) {
    await locator.first().click({ timeout: 10000 });
    await page.waitForTimeout(800);
    return true;
  }
  return domClickVisibleText(page, text, "exact");
}

export async function clickVisibleTextContaining(page: Page, text: string): Promise<boolean> {
  const locator = page.locator("a:visible,button:visible,[role='button']:visible").filter({
    hasText: new RegExp(escapeRegExp(text), "i"),
  });
  if (await locator.first().isVisible().catch(() => false)) {
    await locator.first().click({ timeout: 10000 });
    await page.waitForTimeout(800);
    return true;
  }
  return domClickVisibleText(page, text, "contains");
}

export async function clickFirstVisible(page: Page, selectors: string[]): Promise<boolean> {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if (await locator.isVisible().catch(() => false)) {
      await locator.click({ timeout: 10000 });
      await page.waitForTimeout(800);
      return true;
    }
  }
  return false;
}

export async function clickDataSeleniumValue(page: Page, name: string, value: string): Promise<boolean> {
  const locator = page.locator(`[data-selenium-name="${cssEscape(name)}"][data-selenium-value="${cssEscape(value)}"]`).first();
  if (await locator.isVisible().catch(() => false)) {
    await locator.click({ timeout: 10000 });
    await page.waitForTimeout(800);
    return true;
  }
  return false;
}

export async function selectDropdownDataSeleniumValue(
  page: Page,
  dropdownSelector: string,
  optionName: string,
  optionValue: string,
): Promise<boolean> {
  const dropdown = page.locator(dropdownSelector).first();
  if (!(await dropdown.isVisible().catch(() => false))) return false;

  await dropdown.click({ timeout: 10000 });
  await page.waitForTimeout(500);
  return clickDataSeleniumValue(page, optionName, optionValue);
}

export async function getVisibleBodyText(page: Page, maxLength = 6000): Promise<string> {
  return (await page.locator("body").innerText({ timeout: 5000 }).catch(() => ""))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function extractPremiumsFromText(text: string, extractionMethod: ExtractionMethod = "body_text_annual"): ExtractedPremium[] {
  const normalizedText = text.replace(/\s+/g, " ").trim();
  const mainAnnualPremiumMatch = normalizedText.match(
    /(?:Monthly\s+)?Annual\s+(?:THB|฿|บาท|à¸¿|à¸šà¸²à¸—|Ã Â¸Â¿)\s*([\d,]+(?:\.\d+)?)\s*\/\s*(?:year|yr|annum)/i,
  );
  if (mainAnnualPremiumMatch) {
    return [toExtractedPremium(mainAnnualPremiumMatch, normalizedText, extractionMethod)];
  }

  const annualPremiumMatches = Array.from(
    normalizedText.matchAll(/(?:THB|฿|บาท|à¸¿|à¸šà¸²à¸—|Ã Â¸Â¿)\s*([\d,]+(?:\.\d+)?)\s*\/\s*(?:year|yr|annum)/gi),
  ).map((match) => toExtractedPremium(match, normalizedText, extractionMethod));

  return dedupePremiums(annualPremiumMatches.filter((premium) => premium.premiumThb >= 1000));
}

export function detectAutomationBlock(text: string): string | undefined {
  if (/captcha|verify you are human|unusual traffic|access denied|blocked|forbidden|too many requests/i.test(text)) {
    return "Automation block or CAPTCHA-like challenge detected.";
  }
  return undefined;
}

export function summarizeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function toExtractedPremium(match: RegExpMatchArray, sourceText: string, extractionMethod: ExtractionMethod): ExtractedPremium {
  const matchedText = match[0];
  const rawCoverageLabel = inferCoverageLabel(sourceText, match.index ?? sourceText.indexOf(matchedText));
  return {
    premiumThb: Number(match[1].replace(/,/g, "")),
    premiumBasis: "annual",
    matchedText,
    rawCoverageLabel,
    coverageType: rawCoverageLabel ? normalizeCoverageType(rawCoverageLabel) : undefined,
    extractionMethod,
  };
}

function inferCoverageLabel(text: string, matchIndex: number): string | undefined {
  const start = Math.max(0, matchIndex - 160);
  const end = Math.min(text.length, matchIndex + 240);
  const window = text.slice(start, end);
  const matches = Array.from(window.matchAll(/\b(?:Type|ชั้น)\s*(1|2\+|2|3\+|3)\b/gi));
  const label = matches.at(-1)?.[0];
  return label?.replace(/\s+/g, " ").trim();
}

function dedupePremiums(premiums: ExtractedPremium[]): ExtractedPremium[] {
  const byValueAndCoverage = new Map<string, ExtractedPremium>();
  for (const premium of premiums) {
    byValueAndCoverage.set(`${premium.premiumThb}|${premium.coverageType ?? "unknown"}|${premium.extractionMethod}`, premium);
  }
  return Array.from(byValueAndCoverage.values()).sort((a, b) => a.premiumThb - b.premiumThb);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cssEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

async function domClickVisibleText(page: Page, text: string, mode: "exact" | "contains"): Promise<boolean> {
  const candidates = page.locator("a,button,[role='button']");
  const target = normalizeText(valueForMatch(text));
  const count = await candidates.count();
  for (let index = 0; index < count; index += 1) {
    const candidate = candidates.nth(index);
    const box = await candidate.boundingBox().catch(() => null);
    if (!box || box.width === 0 || box.height === 0) continue;
    const rawText = await candidate.innerText().catch(async () => (await candidate.getAttribute("aria-label")) ?? "");
    const candidateText = normalizeText(rawText);
    const matched = mode === "exact" ? candidateText === target : candidateText.includes(target);
    if (!matched) continue;
    await candidate.click({ timeout: 10000 });
    await page.waitForTimeout(800);
    return true;
  }
  return false;
}

function valueForMatch(value: string): string {
  return value;
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}
