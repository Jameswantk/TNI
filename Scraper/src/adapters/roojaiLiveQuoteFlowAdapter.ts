import type { Page } from "playwright";
import type { LiveQuoteScenario, RawQuote, SiteAdapter } from "../types.js";
import {
  acceptCookies,
  clickDataSeleniumValue,
  clickFirstVisible,
  clickVisibleText,
  clickVisibleTextContaining,
  detectAutomationBlock,
  getVisibleBodyText,
  selectDropdownDataSeleniumValue,
  summarizeError,
} from "../live/browserQuoteTools.js";
import { formAnswersFromGridInput, actualDefaultsFromAnswers, type FormAnswers } from "../live/gridInputToFormAnswers.js";
import { captureDiagnostics, closeLiveBrowser, launchLiveBrowser } from "../live/liveBrowser.js";
import { extractAnnualPlanPremiumsFromPage } from "../live/planCardExtractor.js";
import { toLiveFailureQuote, toLiveRawQuotes } from "../live/liveQuoteResult.js";

const START_URL = "https://insure.roojai.com/#/car";

export class RoojaiLiveQuoteFlowAdapter implements SiteAdapter {
  readonly site = "roojai_live";
  readonly sourceMethod = "public_quote_flow" as const;

  constructor(private readonly scenarios: LiveQuoteScenario[]) {}

  async collect(runId: string): Promise<RawQuote[]> {
    const session = await launchLiveBrowser();
    const quotes: RawQuote[] = [];

    try {
      for (const originalScenario of this.scenarios) {
        const scenario = cloneScenario(originalScenario);
        const answers = formAnswersFromGridInput(scenario.input);
        scenario.input.defaultsUsed = {
          ...scenario.input.defaultsUsed,
          ...actualDefaultsFromAnswers(answers),
        };
        const page = await session.context.newPage();
        try {
          await page.goto(START_URL, { waitUntil: "domcontentloaded", timeout: 45000 });
          await page.waitForTimeout(5000);
          await acceptCookies(page);
          await clickFirstVisible(page, ["#btn-select-language"]);
          await clickVisibleText(page, "Eng");
          await page.waitForTimeout(1000);

          const steps: string[] = [];
          steps.push("selected English language when available");
          steps.push((await clickFirstVisible(page, ["#btn-select-brand"])) ? "opened brand dropdown" : "brand dropdown not visible");
          steps.push((await selectBrand(page, scenario.brand)) ? `selected brand ${scenario.brand}` : `brand ${scenario.brand} not visible`);
          steps.push((await selectModel(page, scenario.model)) ? `selected model ${scenario.model}` : `model ${scenario.model} not visible`);
          steps.push((await selectYear(page, scenario.year)) ? `selected year ${scenario.year}` : `year ${scenario.year} not visible`);
          await chooseFirstSubModel(page, steps);
          await page.waitForTimeout(5000);
          await answerVisibleRoojaiDefaults(page, steps, answers, scenario);
          await attemptForwardProgress(page, steps);

          const text = await getVisibleBodyText(page);
          const blockReason = detectAutomationBlock(text);
          const premiums = blockReason ? [] : await extractAnnualPlanPremiumsFromPage(page, text);
          const diagnosticsPaths =
            premiums.length === 0 || process.env.LIVE_FORM_CAPTURE_SUCCESS_DIAGNOSTICS === "true"
              ? await captureDiagnostics(page, this.site, runId, `${scenario.input.vehicleGroup}_${premiums.length > 0 ? "price_observation" : "non_price_observation"}`)
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
                  : "No annual premium with observed coverage found before flow required additional inputs."),
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

function cloneScenario(scenario: LiveQuoteScenario): LiveQuoteScenario {
  return {
    ...scenario,
    input: {
      ...scenario.input,
      defaultsUsed: { ...scenario.input.defaultsUsed },
    },
  };
}

async function selectBrand(page: Page, brand: string): Promise<boolean> {
  const directId = `#btn-${brand.toLowerCase()}`;
  if (await clickFirstVisible(page, [directId])) return true;
  if (await clickDataSeleniumValue(page, "carBrand-item", brand)) return true;
  if (await clickVisibleText(page, brand)) return true;
  await clickVisibleText(page, "Other brands");
  if (await clickDataSeleniumValue(page, "carBrand-item", brand)) return true;
  return clickVisibleText(page, brand);
}

async function selectModel(page: Page, model: string): Promise<boolean> {
  if (await clickDataSeleniumValue(page, "carModel-item-hit", model)) return true;
  if (await clickDataSeleniumValue(page, "carModel-item", model)) return true;
  return clickVisibleText(page, model);
}

async function selectYear(page: Page, year: string): Promise<boolean> {
  if (await clickDataSeleniumValue(page, "carYear-item", year)) return true;
  return clickVisibleTextContaining(page, year);
}

async function chooseFirstSubModel(page: Page, steps: string[]): Promise<void> {
  const seleniumOption = page.locator('[data-selenium-name="carDesc-item"]:visible').first();
  if (await seleniumOption.isVisible().catch(() => false)) {
    const text = (await seleniumOption.innerText()).trim();
    await seleniumOption.click({ timeout: 10000 });
    steps.push(`selected first visible sub-model ${text}`);
    await page.waitForTimeout(800);
    return;
  }

  const option = page.locator("a:visible,button:visible,[role='button']:visible").filter({
    hasText: /\/|Entry|High|Mid|Low|Manual/i,
  }).first();
  if (await option.isVisible().catch(() => false)) {
    const text = (await option.innerText()).trim();
    if (/automation/i.test(text)) return;
    await option.click({ timeout: 10000 });
    steps.push(`selected first visible sub-model ${text}`);
  }
}

async function answerVisibleRoojaiDefaults(page: Page, steps: string[], answers: FormAnswers, scenario: LiveQuoteScenario): Promise<void> {
  for (let attempt = 0; attempt < 24; attempt += 1) {
    if (await answerMileage(page, steps, answers, scenario)) continue;
    if (await answerClaims(page, steps, answers)) continue;
    if (await answerFinancing(page, steps, answers)) continue;
    if (await answerNoClaimBonus(page, steps, answers)) continue;
    if (await answerPolicyStartDate(page, steps, answers)) continue;
    if (await answerNoAlcoholPolicy(page, steps, answers)) continue;
    if (await answerDriverDateOfBirth(page, steps, answers)) continue;
    if (await answerDrivingExperience(page, steps, answers)) continue;
    if (await answerPostalCode(page, steps, answers)) continue;
    if (await answerGenderAndMaritalStatus(page, steps, answers)) continue;
    if (await answerCommuteToWork(page, steps, answers)) continue;
    if (await answerCarUse(page, steps, answers)) continue;
    if (await answerDashboardCamera(page, steps, answers)) continue;
    if (await clickActiveNext(page, steps)) continue;
    break;
  }
}

async function answerMileage(page: Page, steps: string[], answers: FormAnswers, scenario: LiveQuoteScenario): Promise<boolean> {
  const dropdown = page.locator("#btn-odometer-dropdown").first();
  if (!(await dropdown.isVisible().catch(() => false))) return false;

  const selectedValue = await dropdown.getAttribute("data-selenium-value").catch(() => null);
  const currentText = (await dropdown.innerText().catch(() => "")).trim();
  if ((selectedValue && selectedValue !== "0") || (currentText && !/select your mileage/i.test(currentText))) return false;

  const selected = await selectDropdownDataSeleniumValue(page, "#btn-odometer-dropdown", "ODOmeter-item", answers.mileageValue);
  if (selected) {
    steps.push(`answered mileage: ${answers.mileageLabel}`);
    await page.waitForTimeout(2500);
    return true;
  }

  await dropdown.click({ timeout: 10000 });
  await page.waitForTimeout(500);
  const firstOption = page.locator('[data-selenium-name="ODOmeter-item"]').first();
  if ((await firstOption.count()) === 0) return false;

  const optionText = (await firstOption.innerText().catch(() => "first available mileage option")).trim();
  const optionValue = await firstOption.getAttribute("data-selenium-value").catch(() => undefined);
  await firstOption.click({ timeout: 10000 }).catch(async () => {
    await firstOption.evaluate((element) => (element as HTMLElement).click());
  });
  if (optionValue) {
    scenario.input.mileageBand = optionValue;
    scenario.input.defaultsUsed.mileage_value_actual = optionValue;
  }
  steps.push(`answered mileage: ${optionText}`);
  await page.waitForTimeout(2500);
  return true;
}

async function answerClaims(page: Page, steps: string[], answers: FormAnswers): Promise<boolean> {
  const alreadySelected = await page.locator('#acc2answer4zero.choosed, [data-selenium-name="claim"][data-selenium-value="0"].choosed').isVisible().catch(() => false);
  if (alreadySelected) return false;

  const clicked = answers.claimsPast12Months === "0" && ((await clickFirstVisible(page, ["#acc2answer4zero"])) || (await clickDataSeleniumValue(page, "claim", "0")));
  if (!clicked) return false;

  steps.push("answered claims in past 12 months: 0");
  await page.waitForTimeout(2500);
  return true;
}

async function answerFinancing(page: Page, steps: string[], answers: FormAnswers): Promise<boolean> {
  const alreadySelected = await page.locator('#CarFinancing-no.choosed, [data-selenium-name="CarFinancing"][data-selenium-value="No"].choosed').isVisible().catch(() => false);
  if (alreadySelected) return false;

  const clicked = answers.financing === "no" && ((await clickFirstVisible(page, ["#CarFinancing-no"])) || (await clickDataSeleniumValue(page, "CarFinancing", "No")));
  if (!clicked) return false;

  steps.push("answered financing: No");
  await page.waitForTimeout(2500);
  return true;
}

async function answerNoClaimBonus(page: Page, steps: string[], answers: FormAnswers): Promise<boolean> {
  const alreadySelected = await page.locator('#ncb2answer4na.choosed, [data-selenium-name="hdDeclareNCB"][data-selenium-value="5"].choosed').isVisible().catch(() => false);
  if (alreadySelected) return false;

  const clicked = answers.noClaimBonus === "unknown" && ((await clickFirstVisible(page, ["#ncb2answer4na"])) || (await clickDataSeleniumValue(page, "hdDeclareNCB", "5")));
  if (!clicked) return false;

  steps.push("answered NCB: I don't know");
  await page.waitForTimeout(2500);
  return true;
}

async function answerPolicyStartDate(page: Page, steps: string[], answers: FormAnswers): Promise<boolean> {
  const alreadySelected = await page.locator('#date2cover4buy1.choosed, [data-selenium-name="policyStartDate"][data-selenium-value="Today"].choosed').isVisible().catch(() => false);
  if (alreadySelected) return false;

  const clicked = answers.policyStart === "Today" && ((await clickFirstVisible(page, ["#date2cover4buy1"])) || (await clickDataSeleniumValue(page, "policyStartDate", "Today")));
  if (!clicked) return false;

  steps.push("answered policy start date: Today");
  await page.waitForTimeout(2500);
  return true;
}

async function answerNoAlcoholPolicy(page: Page, steps: string[], answers: FormAnswers): Promise<boolean> {
  const alreadySelected = await page.locator('#alcohol-free-no.choosed, [data-selenium-name="alcohol-free"][data-selenium-value="No"].choosed').isVisible().catch(() => false);
  if (alreadySelected) return false;

  const clicked = answers.alcoholFree === "no" && ((await clickFirstVisible(page, ["#alcohol-free-no"])) || (await clickDataSeleniumValue(page, "alcohol-free", "No")));
  if (!clicked) return false;

  steps.push("answered no-alcohol policy: No");
  await page.waitForTimeout(2500);
  return true;
}

async function answerGenderAndMaritalStatus(page: Page, steps: string[], answers: FormAnswers): Promise<boolean> {
  const alreadySelected = await page.locator('#sex2d2ms.choosed, [data-selenium-name="GenderMD"][data-selenium-value="Male-Single"].choosed').isVisible().catch(() => false);
  if (alreadySelected) return false;

  const clicked = answers.driverGenderMaritalStatus === "Male-Single" && ((await clickFirstVisible(page, ["#sex2d2ms"])) || (await clickDataSeleniumValue(page, "GenderMD", "Male-Single")));
  if (!clicked) return false;

  steps.push("answered driver gender/marital status: Male-Single");
  await page.waitForTimeout(2500);
  return true;
}

async function answerDriverDateOfBirth(page: Page, steps: string[], answers: FormAnswers): Promise<boolean> {
  const day = page.locator("#dd-dob").first();
  if (!(await day.isVisible().catch(() => false))) return false;

  const currentValue = await day.inputValue().catch(() => "");
  if (currentValue === answers.dob.day) return false;

  await day.fill(answers.dob.day);
  await page.locator("#mm-dob").first().fill(answers.dob.month);
  await page.locator("#yyyy-dob").first().fill(answers.dob.year);
  await page.waitForTimeout(800);
  await clickFirstVisible(page, ["#DOBMDNext:not([disabled])"]);
  steps.push(`answered driver DOB: ${answers.dob.day}/${answers.dob.month}/${answers.dob.year}`);
  await page.waitForTimeout(2500);
  return true;
}

async function answerDrivingExperience(page: Page, steps: string[], answers: FormAnswers): Promise<boolean> {
  const alreadySelected = await page.locator('#exp2answer4v6.choosed, [data-selenium-name="drivingExperience"][data-selenium-value="6"].choosed').isVisible().catch(() => false);
  if (alreadySelected) return false;

  const clicked = answers.licenseTenure === "6" && ((await clickFirstVisible(page, ["#exp2answer4v6"])) || (await clickDataSeleniumValue(page, "drivingExperience", "6")));
  if (!clicked) return false;

  steps.push("answered driving license tenure: 6 or more years");
  await page.waitForTimeout(2500);
  return true;
}

async function answerPostalCode(page: Page, steps: string[], answers: FormAnswers): Promise<boolean> {
  const postalCode = page.locator("#post4code").first();
  if (!(await postalCode.isVisible().catch(() => false))) return false;

  const currentValue = await postalCode.inputValue().catch(() => "");
  if (currentValue === answers.postcode) return false;

  await postalCode.fill(answers.postcode);
  await page.waitForTimeout(800);
  await clickFirstVisible(page, ["#post4code2next:not([disabled])"]);
  steps.push(`answered postal code: ${answers.postcode}`);
  await page.waitForTimeout(2500);
  return true;
}

async function answerCarUse(page: Page, steps: string[], answers: FormAnswers): Promise<boolean> {
  const alreadySelected = await page
    .locator('#pk2drive2shop1.choosed, [data-selenium-name="carUsage"][data-selenium-value="SPT"].choosed')
    .first()
    .isVisible()
    .catch(() => false);
  if (alreadySelected) return false;
  if (answers.carUse !== "personal") return false;

  const clicked =
    (await clickDataSeleniumValue(page, "carUsage", "SPT")) ||
    (await clickDataSeleniumValue(page, "carUsage", "PrivateCar")) ||
    (await clickDataSeleniumValue(page, "carUsage", "Personal use")) ||
    (await clickVisibleText(page, "Personal use"));
  if (!clicked) return false;

  steps.push("answered car use: Personal use");
  await page.waitForTimeout(2500);
  return true;
}

async function answerCommuteToWork(page: Page, steps: string[], answers: FormAnswers): Promise<boolean> {
  const option = page.locator("#personalUse").first();
  if (!(await option.isVisible().catch(() => false))) return false;
  if (await option.evaluate((element) => element.classList.contains("choosed")).catch(() => false)) return false;
  if (answers.commuteUse !== "never") return false;

  const clicked = (await clickFirstVisible(page, ["#personalUse"])) || (await clickDataSeleniumValue(page, "personalUse", "SPT"));
  if (!clicked) return false;

  steps.push("answered commute to work: Never");
  await page.waitForTimeout(2500);
  return true;
}

async function answerDashboardCamera(page: Page, steps: string[], answers: FormAnswers): Promise<boolean> {
  const alreadySelected = await page.locator("#camera02.choosed, #camera01.choosed").isVisible().catch(() => false);
  if (alreadySelected) return false;

  const clicked = answers.dashcam === "yes"
    ? ((await clickFirstVisible(page, ["#camera01"])) || (await clickDataSeleniumValue(page, "carcam", "Yes")))
    : ((await clickFirstVisible(page, ["#camera02"])) || (await clickDataSeleniumValue(page, "carcam", "No")));
  if (!clicked) return false;

  steps.push(`answered dashboard camera: ${answers.dashcam === "yes" ? "Yes" : "No"}`);
  await page.waitForTimeout(2500);
  return true;
}

async function clickActiveNext(page: Page, steps: string[]): Promise<boolean> {
  const clicked = await clickFirstVisible(page, [
    "button.next2btn.active:visible",
    "[data-selenium-name='next']:visible",
    "button:has-text('Get your price'):visible",
    "button:has-text('Next'):visible",
    "button:has-text('Continue'):visible",
  ]);
  if (!clicked) return false;
  steps.push("clicked active Roojai next button");
  await page.waitForTimeout(2500);
  return true;
}

async function attemptForwardProgress(page: Page, steps: string[]): Promise<void> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const clicked = await clickFirstVisible(page, [
      "button:has-text('Next')",
      "button:has-text('Continue')",
      "button:has-text('Search')",
      "button:has-text('Compare')",
      "button:has-text('View')",
      "button:has-text('Get your price')",
      "button[type='submit']",
    ]);
    if (!clicked) return;
    steps.push(`clicked forward button ${attempt + 1}`);
    await page.waitForTimeout(2000);
  }
}
