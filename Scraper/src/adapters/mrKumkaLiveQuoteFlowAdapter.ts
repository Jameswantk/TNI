import type { Page } from "playwright";
import type { LiveQuoteScenario, RawQuote, SiteAdapter } from "../types.js";
import {
  acceptCookies,
  clickFirstVisible,
  clickVisibleText,
  clickVisibleTextContaining,
  detectAutomationBlock,
  getVisibleBodyText,
  summarizeError,
} from "../live/browserQuoteTools.js";
import { captureDiagnostics, closeLiveBrowser, launchLiveBrowser } from "../live/liveBrowser.js";
import { extractAnnualPlanPremiumsFromPage } from "../live/planCardExtractor.js";
import { toLiveFailureQuote, toLiveRawQuotes } from "../live/liveQuoteResult.js";

const START_URL = "https://compare.mrkumka.com/#/";

export class MrKumkaLiveQuoteFlowAdapter implements SiteAdapter {
  readonly site = "mrkumka_live";
  readonly sourceMethod = "public_quote_flow" as const;

  constructor(private readonly scenarios: LiveQuoteScenario[]) {}

  async collect(runId: string): Promise<RawQuote[]> {
    const session = await launchLiveBrowser();
    const quotes: RawQuote[] = [];

    try {
      for (const originalScenario of this.scenarios) {
        const scenario = cloneScenario(originalScenario);
        const page = await session.context.newPage();
        try {
          await page.goto(START_URL, { waitUntil: "domcontentloaded", timeout: 45000 });
          await page.waitForTimeout(4000);
          await acceptCookies(page);

          const steps: string[] = [];
          const brandOpened = (await clickFirstVisible(page, ["#makeButton"])) || (await forceClickSelector(page, "#makeButton"));
          steps.push(brandOpened ? "opened brand dropdown" : "brand dropdown not visible");
          steps.push((await clickVisibleText(page, scenario.brand)) ? `selected brand ${scenario.brand}` : `brand ${scenario.brand} not visible`);
          let modelClicked = await clickVisibleText(page, scenario.model);
          if (!modelClicked) {
            steps.push((await clickFirstVisible(page, ["#modelButton"])) ? "opened model dropdown" : "model dropdown not visible");
            modelClicked = await clickVisibleText(page, scenario.model);
          }
          steps.push(modelClicked ? `selected model ${scenario.model}` : `model ${scenario.model} not visible`);
          let yearClicked = await clickVisibleTextContaining(page, scenario.year);
          if (!yearClicked) {
            steps.push((await clickFirstVisible(page, ["#yearButton"])) ? "opened year dropdown" : "year dropdown not visible");
            yearClicked = await clickVisibleTextContaining(page, scenario.year);
          }
          steps.push(yearClicked ? `selected year ${scenario.year}` : `year ${scenario.year} not visible`);
          await chooseSubModel(page, scenario.subModel, steps);
          await chooseFirstVisibleDropdownOption(page, "selected first visible province option", steps);
          await attemptForwardProgress(page, steps);

          const text = await getVisibleBodyText(page);
          const blockReason = detectAutomationBlock(text);
          const premiums = blockReason ? [] : await extractAnnualPlanPremiumsFromPage(page, text);
          const diagnosticsPaths =
            premiums.length === 0
              ? await captureDiagnostics(page, this.site, runId, `${scenario.input.vehicleGroup}_non_price_observation`)
              : [];

          quotes.push(
            ...toLiveRawQuotes({
              site: this.site,
              runId,
              scenario,
              scrapedAt: new Date().toISOString(),
              finalUrl: page.url(),
              steps,
              text,
              premiums,
              diagnosticsPaths,
              notes:
                blockReason ??
                (premiums.length > 0
                  ? "Live quote-form annual premium extracted with observed coverage."
                  : "No premium found before flow required additional inputs."),
            }),
          );
        } catch (error) {
          const diagnosticsPaths = await captureDiagnostics(page, this.site, runId, `${scenario.input.vehicleGroup}_flow_failure`).catch(() => []);
          quotes.push(
            toLiveFailureQuote({
              site: this.site,
              runId,
              scenario,
              error: summarizeError(error),
              finalUrl: page.url(),
              diagnosticsPaths,
            }),
          );
        } finally {
          await page.close().catch(() => undefined);
        }
      }
    } finally {
      await closeLiveBrowser(session);
    }

    return quotes;
  }
}

async function forceClickSelector(page: Page, selector: string): Promise<boolean> {
  const locator = page.locator(selector).first();
  if ((await locator.count()) === 0) return false;
  await locator.click({ timeout: 10000, force: true }).catch(() => undefined);
  await page.waitForTimeout(800);
  return true;
}

async function chooseFirstVisibleDropdownOption(page: Page, stepLabel: string, steps: string[]): Promise<void> {
  const firstOption = page.locator("a.dropdown-item:visible").first();
  if (await firstOption.isVisible().catch(() => false)) {
    const text = (await firstOption.innerText()).trim();
    await firstOption.click({ timeout: 10000 });
    steps.push(`${stepLabel}: ${text}`);
  }
}

async function chooseSubModel(page: Page, preferred: string | undefined, steps: string[]): Promise<void> {
  if (preferred && (await clickVisibleText(page, preferred))) {
    steps.push(`selected sub-model ${preferred}`);
    return;
  }
  const firstOption = page.locator("a.dropdown-item:visible").first();
  if (await firstOption.isVisible().catch(() => false)) {
    const text = (await firstOption.innerText()).trim();
    await firstOption.click({ timeout: 10000 });
    steps.push(`selected first visible sub-model ${text}`);
    return;
  }
  const opened = await clickFirstVisible(page, ["#subModelButton"]);
  if (!opened) return;
  steps.push("opened sub-model dropdown");
  const optionAfterOpen = page.locator("a.dropdown-item:visible").first();
  if (await optionAfterOpen.isVisible().catch(() => false)) {
    const text = (await optionAfterOpen.innerText()).trim();
    await optionAfterOpen.click({ timeout: 10000 });
    steps.push(`selected first visible sub-model ${text}`);
  }
}

async function attemptForwardProgress(page: Page, steps: string[]): Promise<void> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const clicked = await clickFirstVisible(page, [
      "button:has-text('Next')",
      "button:has-text('Continue')",
      "button:has-text('Search')",
      "button:has-text('Compare')",
      "button[type='submit']",
    ]);
    if (!clicked) return;
    steps.push(`clicked forward button ${attempt + 1}`);
    await page.waitForTimeout(2000);
  }
}

function cloneScenario(scenario: LiveQuoteScenario): LiveQuoteScenario {
  return {
    ...scenario,
    input: {
      ...scenario.input,
      defaultsUsed: { ...scenario.input.defaultsUsed },
    },
  };
}
