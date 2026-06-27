# Claude — Suggested Changes: Indara Price Scraper

Status: IMPLEMENTED IN SCRAPER CORE - this document began as Claude proposal. The scraper-side architecture and safety changes have now been implemented; production database/admin UI work remains a separate workstream.

Author: Claude (Opus 4.8)
Date: 2026-06-19
Revision: **v3** — v2 revised after review by Codex; v3 corrects stale current-state
facts (the live smoke grid is now 8 Roojai scenarios and Roojai live reaches premiums).
The v2 over-claim — that Roojai exposes multiple coverage-tier cards in one DOM — is
gated behind a verification spike. See the changelog in section 8.

---

## 1. Context and goal

The ultimate goal is a **complete, trustworthy database of indicative car-insurance
premiums across many brands and models**, which the Indara AI agent reads to quote
customers. The scraper is the worker that populates those bands offline; the chat
app never scrapes live.

The current `Scraper/` is a well-engineered scaffold with strong compliance
hygiene, a clean typed contract (`PricingBand` / `RawQuote` / `GridInput`), sensible
banding statistics, and real knowledge of the Roojai quote funnel. However, the
part that matters most for the goal — **breadth across brands/models and correct,
high-yield data capture** — is barely started. This document plans the changes to
close that gap.

### Current state summary

What works well:

- Shared contract in `src/types.ts` matches the web app (already integrated).
- `bander.ts`: groups by band key, trims 10/90 outliers, median, confidence by
  sample count, respects manual overrides.
- Compliance: `ALLOW_LIVE_QUOTE_FORMS` gate, `detectAutomationBlock()`, refuses to
  bypass CAPTCHA/anti-bot/login/rate limits, captures diagnostics, degrades to
  "handled non-price observation" rather than crashing.
- Roojai live adapter answers a realistic battery of funnel questions and reaches
  **annual premiums for an 8-scenario Type 1 smoke grid** (one premium per scenario).

What blocks the goal today:

- Only a small hand-written smoke grid (currently 8 Roojai scenarios across 4 brands),
  single-valued on every non-vehicle dimension (one scenario varies only the year band).
- Coverage type is asserted (`type_1` only), never observed. Whether Roojai shows
  multiple tiers on one page is **unverified** (see Change 0.1).
- Form answers are hardcoded, so band keys can describe inputs that were not entered.
- `bander.ts` does not filter on `premiumBasis`, so a non-annual premium could enter
  a band.
- Confidence model is stuck "low" under deterministic re-scraping.
- Premium extraction is body-text regex with risky fallbacks.
- Throughput (fixed sleeps) will not scale to a real grid.
- Public-page adapters yield nothing. Roojai live reaches annual premiums for the smoke
  grid; MrKumka does not yet reliably reach trim/premium. The grid is still tiny, so the
  manual CSV seed remains the main breadth source for now.

---

## 2. Guiding principles for the changes

1. **Never invent or mislabel a premium.** A wrong band is worse than a missing band.
2. **Verify the DOM before designing around it.** No acceptance criterion may assume
   site structure we have not captured in diagnostics.
3. **Maximise correct yield per page load — once the structure is proven.**
4. **Truthful band keys.** A band must describe the inputs that were actually entered.
5. **Stay inside the compliance boundary.** Low volume, gated, no bypassing controls,
   no live scraping during chat. Any automated interaction with live forms — including
   catalog enumeration — gets the same controls as quote scraping.
6. **Extend, don't rewrite.** The architecture is sound; these are additive changes.

---

## 3. Planned changes

Ordered by value-per-effort and by dependency. Phase 0 verifies a key assumption.
Phase 1 makes the runs that already work correct and approvable now. Phase 1b is the
gated multi-tier work. Phase 2 adds breadth. Phase 3 hardens for scale.

### Phase 0 — Verify before building (prerequisite)

#### Change 0.1 — Roojai results-page diagnostics spike

Problem: the original plan assumed Roojai "typically shows multiple plan tiers at
once." This is unverified. Our successful Roojai runs prove **one** annual premium
per scenario for the Type 1 flow, not separate Type 1 / 2+ / 3+ cards on the same
result page.

Change: run the existing Roojai adapter through to the results page with
`LIVE_FORM_DIAGNOSTICS_DIR` set, and capture DOM HTML + screenshot using the existing
`captureDiagnostics()`. Inspect whether multiple coverage-tier cards exist in a single
DOM, or whether tiers require switching tabs/options or separate flows.

Files: none changed (uses the existing adapter + diagnostics). Findings recorded back
into this document.

Acceptance: saved diagnostics that conclusively show EITHER (a) multiple tier cards
present in one DOM, OR (b) tiers gated behind tabs/separate runs. This single result
decides Change 1.4 vs. separate per-coverage runs, and corrects Phase 2's volume math.

### Phase 1 — Make every successful scrape correct (approvable now)

#### Change 1.1 — Observed coverage typing + schema cleanup

Problem: `liveQuoteResult.ts` tags every premium with `args.scenario.coverageType`
(always `type_1`) — asserted, not observed. Separately, `GridInput` also carries an
optional `coverageType`, and scenarios set both `scenario.coverageType` and
`input.coverageType`; if observed coverage ever differs from target, the raw row
becomes internally contradictory.

Change:
- `RawQuote.coverageType` becomes **observed** — read from the plan card the premium
  came from, normalised via `normalizeCoverageType()`. If coverage cannot be observed,
  leave it undefined (such rows are excluded from banding, as today).
- Rename `scenario.coverageType` -> `targetCoverageType` (an expectation used only for
  validation). Remove `GridInput.coverageType`, or rename it `requestedCoverageType`
  and document it clearly as "requested, not observed".
- Record both requested and observed coverage in `rawPayload` for audit. Never emit a
  band whose key coverage contradicts the observed premium.

Files: `src/types.ts`, `src/live/liveQuoteScenarios.ts`, `src/live/liveQuoteResult.ts`,
`src/adapters/roojaiLiveQuoteFlowAdapter.ts`, `src/adapters/mrKumkaLiveQuoteFlowAdapter.ts`.

Acceptance: no raw row contains contradictory requested-vs-observed coverage; band
keys use observed coverage; unit test covers the observed!=requested case.

#### Change 1.2 — Parametrize form-filling from `GridInput`

Problem: the Roojai flow hardcodes DOB `1996`, postcode `10230`, personal use, etc.
If scenarios are expanded to other ages/provinces, the form will not reflect them, so
the band key (`driverAgeBand`, `provinceRegion`) would lie.

Change:
- Derive form answers from the scenario `GridInput`:
  - `driverAgeBand` -> representative DOB (midpoint, recorded in `defaultsUsed`).
  - `provinceRegion` -> representative postcode (small region->postcode lookup).
  - `repairPref` -> the matching repair option where the site exposes it.
- Where a dimension cannot be honestly set on the site, **record the actual value
  used** and either narrow the band key or mark the dimension as `any`.

Files: `src/adapters/roojaiLiveQuoteFlowAdapter.ts`, new
`src/live/gridInputToFormAnswers.ts`, `src/live/liveQuoteScenarios.ts`.

Acceptance: changing a scenario's `driverAgeBand`/`provinceRegion` measurably changes
the form inputs entered; band keys reflect real inputs.

#### Change 1.3 — DOM-scoped extraction + non-annual rejection (extractor AND bander)

Problem: `extractPremiumsFromText()` falls back to "any THB number >= 1000" from body
text, which can capture sum-insured, deductibles, or installment figures. And
critically, even if the extractor sets `premiumBasis`, `bander.ts` groups any
`parseOk` quote with a `premiumThb` and `coverageType` — it does **not** filter on
`premiumBasis`, so a monthly/unknown-basis premium could still enter a band.

Change:
- Prefer **DOM-scoped extraction** within each plan-card element over whole-body
  regex. Keep the body-text path only as a last-resort, low-confidence fallback.
- In the extractor: accept only annual premiums; reject monthly/installment/sum-insured;
  set `premiumBasis` reliably.
- In `bander.ts`: add a defense-in-depth filter that **excludes any RawQuote whose
  `premiumBasis` is not `annual`** before grouping (alongside the existing `parseOk` /
  `premiumThb` / `coverageType` checks).

Files: `src/live/browserQuoteTools.ts`, new `src/live/planCardExtractor.ts`,
`src/live/liveQuoteResult.ts`, **`src/bander.ts`**.

Acceptance: (a) extracted values match the displayed annual premiums in saved
diagnostics; (b) a monthly or unknown-basis `RawQuote` never produces or contributes
to a band — covered by a `bander.ts` unit test.

### Phase 1b — Multi-tier yield (GATED on Change 0.1)

#### Change 1.4 — Multi-tier capture, or separate per-coverage runs

Problem: yield strategy depends on Roojai's actual DOM, which Change 0.1 determines.

Change (branch on 0.1's result):
- If 0.1 proves **multiple tier cards in one DOM**: emit one correctly-typed
  `RawQuote` per tier from a single run (the high-yield path).
- If 0.1 proves **tiers are gated** (tabs / separate flows): make coverage a grid
  dimension and run **separate per-coverage scrapes**. This multiplies run volume by
  the number of tiers — Phase 2 and throughput planning (3.x) must account for it.

Files: `src/adapters/roojaiLiveQuoteFlowAdapter.ts`, `src/live/planCardExtractor.ts`,
and (separate-runs path) `src/grid/gridGenerator.ts`.

Acceptance: the chosen path is justified by the 0.1 diagnostics, not assumed. No
"3-4x yield" target is committed until/unless 0.1 demonstrates multiple tiers in one
DOM. The default expectation is separate per-coverage runs unless proven otherwise.

### Phase 2 — Breadth across brands and models

Note: Phase 2 no longer assumes "coverage tiers come for free." Coverage breadth is
delivered by Change 1.4 (single-DOM multi-tier OR separate per-coverage runs), and the
grid is sized accordingly.

#### Change 2.1 — Vehicle catalog from the site's own dropdowns (gated + capped)

Problem: there is no enumeration of the brand/model universe; scenarios are a
hand-written list of four cars. Enumerating site dropdowns is still automated
interaction with live forms and needs the same controls as quote scraping.

Change:
- Add a one-off **catalog crawl** that enumerates brands (and models/years for a
  chosen brand) from each site's dropdowns; persist to
  `Scraper/data/vehicle_catalog.json`.
- Safety controls (required before approval):
  - **`ALLOW_CATALOG_CRAWL=true`** gate, mirroring `ALLOW_LIVE_QUOTE_FORMS`.
  - **Per-site allowlist** (`CATALOG_SITES`) so a crawl targets only approved sites.
  - **Max brands/models per run** caps, with the count logged.
  - **Persisted cache** so unchanged catalogs are not re-crawled; reuse existing
    `detectAutomationBlock()` and diagnostics.
- Curate a **representative target set** (e.g. top-N by Thai market share), not the
  full long tail, to control volume and respect ToS.

Files: new `src/catalog/catalogCrawler.ts`, new `src/catalog/vehicleCatalog.ts`,
new `catalog` command in `src/index.ts`.

Acceptance: `catalog` refuses to run without `ALLOW_CATALOG_CRAWL=true`; respects the
site allowlist and per-run caps; writes a cached catalog file; the curated set is
config-driven.

#### Change 2.2 — Grid generator (bounded, config-driven)

Problem: no machinery to cross vehicles with the other pricing dimensions.

Change:
- Add a **grid generator** crossing the curated vehicle set with configured value
  sets for year-band, province-region, driver-age-band, repair-pref, and — per Change
  1.4 — coverage tier where separate runs are required.
- Make the grid **config-driven and bounded** (start small), with an explicit cap on
  total combinations per run and the count logged.
- Replace `defaultLiveQuoteScenarios()` with grid output; keep a tiny default grid for
  smoke tests.

Files: new `src/grid/gridGenerator.ts`, new `src/grid/gridConfig.ts`,
`src/live/liveQuoteScenarios.ts`, `src/index.ts`.

Acceptance: a documented config yields a deterministic, bounded scenario list;
combination count is logged and capped.

#### Change 2.3 — Coverage-completeness report

Problem: the app needs `type_3_plus` (Best Budget) and `type_1`; today only `type_1`
is produced.

Change: add a **coverage-completeness report** per vehicle group showing which tiers
have grounded bands and which are missing, so gaps are visible.

Files: new `src/reports/coverageReport.ts`, `src/index.ts`.

Acceptance: a `report:coverage` command lists missing tiers per vehicle group.

### Phase 3 — Quality, scale, and operability

#### Change 3.1 — Single-source confidence (do this first; not blocked)

Problem: `getConfidence()` keys off raw sample count; deterministic re-scrapes never
exceed "low". The original plan jumped straight to cross-source agreement, which
depends on MrKumka working (it does not yet).

Change: enrich confidence/`confidenceReason` using **single-source signals available
now** — extraction quality (DOM-scoped vs body-text fallback), price spread, and
freshness (`lastScrapedAt`). Add explicit **staleness** flagging (bands older than N
days). The app already downgrades / hands off on low confidence.

Files: `src/bander.ts`, `src/types.ts`.

Acceptance: a fresh DOM-scoped single-source band reads higher than a stale
body-text-fallback band; unit tests cover the matrix. No dependency on MrKumka.

#### Change 3.2 — MrKumka live adapter selector fix

Problem: per the README, MrKumka loads but does not reliably reach vehicle trim.

Change: tune the opening brand-control selectors and the trim path to reach a premium
for the smoke-test vehicles, at parity with Roojai.

Files: `src/adapters/mrKumkaLiveQuoteFlowAdapter.ts`.

Acceptance: MrKumka reaches a premium for the smoke-test vehicles.

#### Change 3.3 — Cross-source confidence (gated on 3.2)

Problem: cross-source agreement is the right long-term confidence signal but is only
meaningful once a second source works.

Change: once 3.2 lands, upgrade confidence to factor **cross-source agreement** (e.g.
Roojai and MrKumka within a configured tolerance) on top of the single-source signals.

Files: `src/bander.ts`, `src/types.ts`.

Acceptance: two agreeing sources raise confidence above either alone; disagreement
beyond tolerance lowers it and is flagged.

#### Change 3.4 — Throughput, caching, and scheduling

Problem: fixed `waitForTimeout` sleeps make each scenario ~1-2 min; a real grid is
infeasible and would be a volume/ToS problem — especially if Change 1.4 requires
separate per-coverage runs.

Change:
- Replace fixed sleeps with **state-based waits** (wait for the next control).
- Add **bounded concurrency** and **change-caching** (skip combinations whose inputs
  and site version are unchanged since the last successful run).
- Add **incremental scheduling** (e.g. weekly) that refreshes the oldest/most-uncertain
  bands first, keeping per-run volume low.

Files: `src/live/browserQuoteTools.ts`, `src/live/liveBrowser.ts`, new
`src/scheduler/incrementalPlan.ts`, `src/index.ts`.

Acceptance: per-scenario time drops materially; reruns skip unchanged combinations; a
scheduled command refreshes a bounded slice.

#### Change 3.5 — Production storage and admin override (already on roadmap)

Problem: file storage (`FileStore`) and no admin UI for bands/overrides.

Change: replace `FileStore` with the production database behind the same interface;
add an admin screen to view bands, confidence, freshness, and set manual overrides
(`manualOverride` is already honoured by `bander.ts`). Add source-health alerts.

Files: new `src/storage/dbStore.ts` (same interface as `FileStore`), admin app
(separate workstream), `src/index.ts`.

Acceptance: bands persist in the DB; admins can override/freeze bands; alerts fire on
source-health drops.

---

## 4. Sequencing and rationale

1. **Change 0.1 (spike) first** — cheap, and it decides the entire yield strategy.
2. **Phase 1 (1.1 -> 1.2 -> 1.3)** — observed coverage, truthful inputs, and clean
   extraction with banding-level non-annual rejection. Approvable now, independent of
   the spike result. (This is the corrected, smaller "1.1" Codex approved, split out.)
3. **Phase 1b (1.4)** — only after 0.1; high-yield single-DOM path or separate
   per-coverage runs, evidence-led.
4. **Phase 2 (2.1 -> 2.2 -> 2.3)** — breadth, with catalog safety controls and a grid
   sized to 1.4's outcome.
5. **Phase 3 (3.1 -> 3.2 -> 3.3 -> 3.4 -> 3.5)** — single-source confidence now,
   cross-source after MrKumka, then scale and operability.

Recommended first implementation tasks (per review): **Change 1.2 and 1.3**, plus the
corrected **Change 1.1 (observed coverage + DOM-scoped extraction)** — and run the
**0.1 spike** before committing to any multi-tier yield.

---

## 5. Risks and mitigations

- Site redesigns break selectors. Mitigation: per-site adapters isolate breakage;
  diagnostics on failure; source-health alerts (3.5); manual override as the safety
  valve.
- Volume/ToS exposure grows with breadth — and more so if 1.4 needs separate
  per-coverage runs. Mitigation: curated representative set; bounded grid with logged
  caps; caching; low-volume incremental schedule; gates on both live scraping and
  catalog crawling; block detection retained.
- Coverage-label mismatch across sites. Mitigation: normalise via
  `normalizeCoverageType()`; record raw label in `rawPayload`; never label a band with
  unobserved coverage (1.1).
- Installment vs annual confusion. Mitigation: reject non-annual in the extractor AND
  in `bander.ts` (1.3); store `premiumBasis`.

## 6. Explicitly out of scope (for this plan)

- Live scraping during a customer chat session (prohibited).
- Bypassing CAPTCHA, anti-bot, login walls, access controls, or rate limits.
- Presenting competitor prices as exact Indara quotes.
- Final production database choice and admin UI build (tracked in 3.5, separate
  workstream).

## 7. Open questions for Indara / the team

- Which brands/models are the priority "representative set" for first breadth?
- Is low-volume live quote-form scraping (and catalog crawling) approved, or should
  first breadth come from partner APIs / insurer rate tables / approved data instead?
- What is the acceptable refresh cadence and per-run volume?
- Cross-source agreement tolerance (e.g. within 10%) once MrKumka works?

## 8. Changelog

v3 (2026-06-19) — corrected stale current-state facts after Codex review:
- Live smoke grid is now 8 Roojai scenarios across 4 brands (not ~4), per
  `src/live/liveQuoteScenarios.ts` on `main`.
- Roojai live reaches annual premiums for that smoke grid; MrKumka is the source that
  does not yet reliably reach trim/premium. Corrected the "only the CSV seed works" line.

v2 (2026-06-19) — revised after Codex review:
- Added Phase 0 (Change 0.1): a diagnostics spike must prove Roojai exposes multiple
  tier cards in one DOM before any multi-tier yield target is committed. Removed the
  unverified "typically shows multiple tiers" claim and the "3-4x yield" acceptance.
- Split the old Change 1.1 into: 1.1 observed-coverage + schema cleanup, and a gated
  1.4 multi-tier/separate-runs decision. Phase 2 no longer claims "tiers come for free."
- Change 1.3 now adds non-annual rejection in `src/bander.ts` (not just the extractor),
  with a banding-level unit-test acceptance criterion.
- Change 1.1 adds schema cleanup: `scenario.coverageType` -> `targetCoverageType`, and
  `GridInput.coverageType` removed or clarified as "requested, not observed."
- Change 2.1 (catalog crawl) now requires `ALLOW_CATALOG_CRAWL=true`, a per-site
  allowlist, per-run caps, and a persisted cache.
- Confidence work split: 3.1 single-source (now), 3.3 cross-source (gated on the
  MrKumka fix in 3.2).

v1 (2026-06-19) — initial proposal.

---

This plan is additive to the existing architecture and preserves all current
compliance guardrails. Awaiting approval before implementation.
