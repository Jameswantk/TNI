# Scraper Memory

Last updated: 2026-06-19

This file is for future LLMs and developers working specifically on the Indara price scraper.

## Implementation Update — 2026-06-19

This section is additive and does not delete the earlier scaffold notes below. Treat it as the current source of truth where it conflicts with older "first scaffold" wording.

Latest pushed commit for this implementation: `89af829 Implement comprehensive scraper controls`.

Current scraper core status:

- The scraper is now structurally comprehensive for the major pricing factors discussed: vehicle brand/model/year/sub-model, province/postcode, requested coverage, observed coverage, driver age band, repair preference, dashcam, mileage, car use, commute use, claims history, financing, NCB, gender/marital driver profile, license tenure, policy start timing, and alcohol-free policy setting.
- The default live grid is config-driven and bounded, currently an 8-scenario smoke set: Toyota Vios/Yaris, Honda City/Civic, BMW 320i/X1, Mercedes-Benz C200/E220.
- The live quote contract now separates `requestedCoverageType` / `targetCoverageType` from observed `coverageType`. Pricing bands must use observed coverage only.
- `RawQuote` now records `premiumBasis`, `requestedCoverageType`, `extractionMethod`, and the full `GridInput` factors used for the run.
- Roojai premium extraction now prefers DOM-scoped data, including Roojai hidden automation summary fields: `SummaryPrice`, `CoverType`, and `PaymentFrequency`. The verified live run captured `premiumBasis=annual`, `coverageType=type_1`, and `extractionMethod=dom_plan_card`.
- `buildPricingBands` now rejects any quote that is not `premiumBasis === "annual"` or lacks observed `coverageType`. This prevents monthly/installment/public-page calibration prices from entering customer quote bands.
- Confidence now considers stale data, extraction method, source count, and spread. Single-source DOM-scoped annual rows can reach medium confidence; cross-source confidence is still a future improvement once MrKumka reliably captures premiums.
- Coverage completeness reporting exists via `npm run report:coverage`.
- Incremental refresh planning exists via `npm run plan:incremental -- --limit <n>`.
- Vehicle catalog crawling is gated behind `ALLOW_CATALOG_CRAWL=true`, requires `CATALOG_SITES`, and has per-run caps.
- Lightweight unit checks exist via `npm run test:unit`.

Verified during implementation:

- `npm run build` passed.
- `npm run test:unit` passed.
- `npm run validate` passed.
- Focused Roojai live verification succeeded with run `run_20260619145018_908520ea`.
- Latest verified row captured Toyota Vios 2021 at `6790 THB/year`, observed `type_1`, annual basis, and `dom_plan_card` extraction.

Important current limitations:

- The scraper core now models the right factors, but the pricing database becomes comprehensive only after approved broader runs populate the grid and missing coverage tiers.
- Roojai is the verified premium-producing live source. MrKumka is wired into the safer annual/observed extraction contract, but selector QA is still needed before it is a reliable second source.
- Coverage types beyond Type 1 are still mostly missing in generated live data. Use `report:coverage` to track gaps.
- Do not treat competitor-sampled prices as exact Indara offers. They remain indicative inputs for offline pricing bands.
- Do not run live scraping during customer chat. The chat must read `pricing_bands.json` or the future production DB.

## Current Status

The `Scraper/` folder is a first implementation scaffold for an offline pricing-band worker. It is not a live customer quote scraper and should not be wired directly into the chat request path.

Current capabilities:

- TypeScript worker package.
- Manual pricing-band CSV import.
- Public-page adapters for Roojai and MrKumka.
- Gated Playwright live quote-form adapters for Roojai and MrKumka.
- Authorized-testing controls for headed mode, slow motion, browser storage state, and diagnostics.
- Raw quote append-only JSONL storage.
- Pricing band JSON storage.
- Bander that computes generated bands from raw observations.
- Manual override preservation.
- Scrape run logging.
- Validation and smoke-test commands.

Generated data is written to `Scraper/data/`, which is gitignored.

## Key Product Rule

The chat app must read from pricing bands. It must not scrape Roojai, MrKumka, or any other external site during a user conversation.

The scraper exists to populate and refresh indicative bands offline.

## Legal / Compliance Boundary

Browser-driven competitor quote-flow automation exists behind `ALLOW_LIVE_QUOTE_FORMS=true`. Run it only after Indara explicitly signs off on legal/ToS risk and operating limits.

The scraper must not:

- Bypass CAPTCHA.
- Bypass anti-bot systems.
- Create fake accounts.
- Use login-only data.
- Evade access controls.
- Run high-volume requests.
- Present competitor quotes as exact Indara prices.

Safe authorized-testing support:

- `npm run auth:save -- <url> <path> --wait-ms <ms>` opens a headed browser for a human tester to sign in or complete normal manual verification, then saves Playwright storage state.
- `LIVE_FORM_STORAGE_STATE=<path>` reuses an authorized tester's saved browser state.
- `LIVE_FORM_HEADLESS=false` and `LIVE_FORM_SLOW_MO_MS=<ms>` make runs observable and slower.
- `LIVE_FORM_DIAGNOSTICS_DIR=<path>` saves screenshots and HTML for non-price observations or failures.

These settings are not a permission to bypass CAPTCHA, anti-bot systems, login walls, access controls, or rate limits.

Allowed first-phase sources:

- Manual CSV imports from Indara-approved price data.
- Public pages used for broad market calibration.
- Future partner APIs.
- Future insurer rate tables.
- Approved low-volume quote-flow technical spikes.
- Approved live quote-form sampling runs.

## Source Strategy

Preferred data-source order:

1. Indara historical quotes.
2. Insurer rate tables.
3. Partner APIs or approved data-sharing.
4. Manual admin imports.
5. Public page calibration.
6. Approved low-volume competitor quote-flow sampling.

Avoid making competitor scraping the foundation of the product.

## Current File Structure

- `README.md`: setup, commands, and compliance boundary.
- `package.json`: worker scripts and dependencies.
- `examples/sample-pricing-bands.csv`: starter manual import data.
- `src/types.ts`: canonical data types.
- `src/index.ts`: CLI entrypoint.
- `src/manualImport.ts`: CSV import.
- `src/bander.ts`: raw quote to pricing band aggregation.
- `src/storage/fileStore.ts`: file-backed storage.
- `src/adapters/mrKumkaPublicPageAdapter.ts`: parses public starting prices.
- `src/adapters/roojaiPublicPageAdapter.ts`: public page health check / future hook.
- `src/adapters/mrKumkaLiveQuoteFlowAdapter.ts`: gated Playwright live-form adapter.
- `src/adapters/roojaiLiveQuoteFlowAdapter.ts`: gated Playwright live-form adapter.
- `src/live/liveQuoteScenarios.ts`: small default live-form scenario grid.
- `src/live/browserQuoteTools.ts`: shared browser helpers and premium extraction.
- `src/live/liveBrowser.ts`: authorized browser-state, headed/slow mode, diagnostics, and manual auth-state capture helpers.

## Important Implementation Details

`MrKumkaPublicPageAdapter` currently parses public "Starting from THB X / month" values and converts them to ten-month-installment estimates because the public page states those premiums are for 10-month installments. These are market calibration observations only, not vehicle-specific quote bands.

`RoojaiPublicPageAdapter` currently validates that the public page exposes quote-input guidance but does not manufacture quote observations from broad marketing copy. Keep this conservative unless a reliable and approved public price signal is found.

`buildPricingBands` preserves `manualOverride=true` bands. Generated bands should not overwrite manually frozen pricing.

Current live-form verification:

- Roojai live adapter reaches Toyota Vios 2021 trim selection, answers the visible dashcam question as `No`, and records the mileage prompt as a handled non-price observation. It does not yet reach premiums.
- MrKumka live adapter loads the app and visible brand-list state, but still needs selector tuning around the opening brand control before it reaches trim selection consistently. It does not yet reach premiums.
- These non-price observations are expected to be ignored by banding because `parseOk=false` and `premiumThb=null`.

## Commands

From `Scraper/`:

```bash
npm install
npm run build
npm run import:sample
npm run scrape:public
$env:ALLOW_LIVE_QUOTE_FORMS="true"; npm run scrape:live
npm run band
npm run validate
```

## Next Best Steps

1. Add a production database adapter while keeping the same type contracts.
2. Add admin UI support for viewing and freezing bands.
3. Add source health alerting.
4. Add a richer curated vehicle grid.
5. Expand live quote scenarios after legal signoff and adapter QA.
6. Add unit tests for CSV parsing, banding, and adapter parsing fixtures.

## Do Not Forget

The goal is broad indicative pricing ranges for the Indara AI advisor. The goal is not to clone Roojai or MrKumka, mirror their prices, or sell competitor-derived quotes as exact Indara offers.
