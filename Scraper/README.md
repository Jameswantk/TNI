# TNI Price Scraper

This worker populates indicative pricing bands for the TNI AI Insurance Advisor. The chat app should read from pricing bands; it should not scrape external sites during a customer conversation.

## Current Build

The scraper now includes:

- A TypeScript worker package.
- Public-page source adapters for Roojai and MrKumka.
- Gated Playwright live quote-form adapters for Roojai and MrKumka.
- A bounded, config-driven live quote grid.
- Explicit form-factor modeling for vehicle, year, location/postcode, requested coverage, age band, repair preference, dashcam, mileage, use, commute, claims, financing, NCB, driver profile, license tenure, policy start, and alcohol-free settings.
- Observed coverage typing for raw quote rows; requested coverage is recorded separately for audit.
- Annual-only premium extraction, with DOM-scoped plan-card extraction preferred over body-text fallback.
- Bander-level rejection of non-annual or unobserved-coverage rows.
- Manual CSV import for starter pricing bands.
- Raw quote storage as JSONL.
- Pricing band storage as JSON.
- Coverage-completeness reporting.
- Incremental refresh planning.
- Source run logging.
- Validation and unit-check commands.

Live quote-form scraping and catalog crawling are available only through explicit runtime gates. The worker still refuses to bypass CAPTCHA, login walls, anti-bot systems, access controls, or rate limits.

## Why This Exists

The TNI chat needs structured pricing ranges such as:

```text
Toyota Vios, 2020-2024, Bangkok, Type 1, age 25-35, garage repair
THB 13,000 - 17,000 / year
```

The LLM should never invent these prices. It should read them from controlled pricing bands.

## Data Flow

```text
Manual CSV / public pages / approved gated live quote-form adapters / partner APIs
  -> raw_quotes.jsonl
  -> annual-only bander
  -> pricing_bands.json
  -> chat recommendation engine
```

## Commands

Install dependencies:

```bash
npm install
```

Build:

```bash
npm run build
```

Validate local data files:

```bash
npm run validate
```

Run lightweight unit checks:

```bash
npm run test:unit
```

Print the bounded default live quote grid:

```bash
npm run grid
```

Import the sample manual pricing bands:

```bash
npm run import:sample
```

Scrape public reference pages:

```bash
npm run scrape:public
```

Scrape approved live quote forms:

```bash
ALLOW_LIVE_QUOTE_FORMS=true npm run scrape:live
```

On Windows PowerShell:

```powershell
$env:ALLOW_LIVE_QUOTE_FORMS="true"; npm run scrape:live
```

Run only approved sites/scenarios:

```powershell
$env:ALLOW_LIVE_QUOTE_FORMS="true"
$env:LIVE_FORM_SITES="roojai_live"
$env:LIVE_FORM_SCENARIOS="toyota_vios,honda_city"
npm run scrape:live
```

Capture success diagnostics for the Roojai tier-structure spike:

```powershell
$env:ALLOW_LIVE_QUOTE_FORMS="true"
$env:LIVE_FORM_SITES="roojai_live"
$env:LIVE_FORM_SCENARIOS="toyota_vios"
$env:LIVE_FORM_CAPTURE_SUCCESS_DIAGNOSTICS="true"
npm run scrape:live
```

Crawl approved vehicle dropdown catalogs:

```powershell
$env:ALLOW_CATALOG_CRAWL="true"
$env:CATALOG_SITES="roojai_live"
npm run catalog -- --max-brands 5 --max-models 10
```

Authorized test login / browser state capture:

```powershell
npm run auth:save -- "https://example-authorized-site.test" "data/auth/example-state.json" --wait-ms 120000
```

Then reuse that state:

```powershell
$env:ALLOW_LIVE_QUOTE_FORMS="true"
$env:LIVE_FORM_STORAGE_STATE="data/auth/example-state.json"
npm run scrape:live
```

Recompute generated pricing bands from annual raw quotes:

```bash
npm run band
```

Show missing coverage tiers by vehicle group:

```bash
npm run report:coverage
```

Plan a bounded incremental refresh slice:

```bash
npm run plan:incremental -- --limit 20
```

Run the basic smoke test:

```bash
npm run smoke
```

## Important Compliance Boundary

Live quote-form scraping and catalog crawling must be run only after TNI confirms approval. The worker must not:

- Bypass CAPTCHA, anti-bot systems, login walls, or access controls.
- Create fake accounts.
- Evade rate limits.
- Present competitor prices as exact TNI quotes.
- Scrape live during a customer chat session.

Supported authorized-testing controls:

- `ALLOW_LIVE_QUOTE_FORMS=true`: required for live quote-form runs.
- `ALLOW_CATALOG_CRAWL=true`: required for catalog dropdown crawls.
- `LIVE_FORM_SITES=roojai_live`: restrict quote runs to approved sites.
- `LIVE_FORM_SCENARIOS=toyota_vios,honda_city`: restrict quote runs to approved scenarios.
- `CATALOG_SITES=roojai_live`: restrict catalog crawls to approved sites.
- `LIVE_FORM_HEADLESS=false`: run in a visible browser.
- `LIVE_FORM_SLOW_MO_MS=250`: slow browser actions for review.
- `LIVE_FORM_STORAGE_STATE=data/auth/site.json`: reuse tester-provided cookies/session state.
- `LIVE_FORM_SAVE_STORAGE_STATE=data/auth/site.json`: save updated browser state after a run.
- `LIVE_FORM_DIAGNOSTICS_DIR=data/live-diagnostics`: save screenshots and HTML for handled failures.
- `LIVE_FORM_CAPTURE_SUCCESS_DIAGNOSTICS=true`: save diagnostics even when a premium is found, useful for coverage-tier verification.

These controls are for sites and sessions TNI is authorized to test. They are not intended to bypass CAPTCHA, anti-bot systems, login walls, access controls, or rate limits.

## Current Live-Form Status

- Roojai: reaches annual Type 1 premiums for the current 8-scenario smoke grid. Coverage is now stored as observed when the result text/DOM exposes it, and requested coverage is stored separately.
- MrKumka: adapter is wired to the same annual/observed extraction contract, but selector tuning is still required before it reliably reaches premiums.

## Storage Files

By default the worker writes generated files to `Scraper/data/`:

- `raw_quotes.jsonl`: append-only raw quote observations.
- `pricing_bands.json`: current pricing bands read by the chat app.
- `scrape_runs.jsonl`: run logs and source health.
- `vehicle_catalog.json`: approved catalog-crawl output.
- `live-diagnostics/`: screenshots and HTML for QA.

`Scraper/data/` is intentionally gitignored.

Versioned sample inputs live under `Scraper/examples/`.

## Production Notes

The implemented scraper now accounts for the major pricing factors in its data contract and live grid. Full production comprehensiveness still depends on approved data volume: expanding the grid, filling coverage-tier gaps, adding partner APIs or insurer rate tables where available, and bringing MrKumka to reliable premium capture for cross-source confidence.
