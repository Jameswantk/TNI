# Implementation plan — TNI price rail, remaining §30 work

> Status: the core two-group rail is **already implemented and live on `main`**
> (commit `4d65ec3`). This plan covers the **remaining and refinement work** only.
> See memory §30 (decisions) and §20.3 (what's already built). Written to be
> self-contained for a cold start.

> Visual targets for the P1 items: `design/price-rail-v2-mockups.html` (open in a browser).

## 0. Baseline already on `main` — DO NOT rebuild

Already implemented and verified:
- Two-group rail: `Lower my price` (NCB, named-driver, repair, dashcam, excess, mileage tier) + `Sharpen this estimate` (area, usage, insured value, at-fault).
- Named-driver modifier + "only listed drivers covered" tradeoff; "up to -X%" advertised vs exact applied %.
- Sum insured as a **flat ±10% modifier** (lower/balanced/higher) with write-off warning — **not yet backed by a real insured-value figure** (item 1).
- Usage eligibility gate (commercial withdraws the number, routes to advisor).
- Mileage tiers, at-fault claims, progressive disclosure (static), sticky CTA, trim "coming soon" note.
- Compositional confidence (`assessConfidence` in `lib/pricing.ts`), calibrated medium-first.
- Bilingual TH/EN. `tsc` + build clean.

## 1. File & pattern map (read before touching anything)
- `src/types.ts` — `PriceControls`, confidence types (`ConfidenceFlag`, `ConfidenceAssessment`), `defaultControls`.
- `src/lib/pricing.ts` — modifier coefficients, `buildModifiers`, `computeQuote`, `assessConfidence`, `recommendPlans`.
- `src/data/pricingData.ts` — band lookup (`findBaseBand`), `vehicleGroupFromAnswers`, `yearBandFromAnswers`.
- `src/data/pricingBands.json` — seeded bands (regenerate via `npm run seed`).
- `src/components/PriceRail.tsx` — the rail UI.
- `src/components/ResultsPanel.tsx` / `PlanCard.tsx` — recommendation cards.
- `src/data/i18n.ts` — every visible string needs an `en` AND `th` key.
- Pattern: new price levers are *modifier coefficients* in `pricing.ts` (cheap), never new band-key dimensions (memory §30.1). Each modifier = `{ key, labelKey, kind, factor, deltaPct }` pushed in `buildModifiers`, shown as a "Why this price?" line.

---

## P1 — finish §30 properly

> **Status: DONE (2026-06-23, Codex — commits b072b35 / 9b7d441).** Items 1-5 all
> implemented: market-value-backed sum insured, adaptive disclosure, mobile
> reflow + sticky bar, plan-card insured value + commercial caveat, and the
> handoff payload (lead `quoteContext`). See memory §20.5. Remaining work is P2/P3.

### 1. Sum insured backed by a real market-value reference
Goal: §30.5 wants the insured value as an actual THB figure, not a bare ±10%. Show "Estimated insured value: ฿620,000" that moves with lower/balanced/higher.
- New data `src/data/marketValues.ts`: `Record<vehicleGroup, Record<yearBand, number>>` of representative market values (THB) + a `default`. ~18 vehicles × 2 year bands. Eco ~500-650k, sedan ~700-900k, SUV/pickup ~900k-1.3M, EV ~1.1-1.8M; 2015_2019 ≈ 0.7× the 2020_2024 value.
- Engine: `marketValue(answers)` and `insuredValue(answers, controls)` in `pricing.ts`: balanced = market value, lower = ×0.9, higher = ×1.1, rounded to nearest 10,000. Keep existing `SUM_INSURED_FACTOR` (premium effect unchanged).
- UI: in the insured-value block show the live THB figure (replace the static `sum.aboutMarket`). Keep the write-off warning on `lower`.
- i18n: `sum.valueLabel` = "฿{v} insured" / "คุ้มครอง ฿{v}".
- Acceptance: lower/balanced/higher changes both the THB figure and the premium; unknown vehicle falls back to `default` value and rough confidence.

### 2. Adaptive progressive disclosure
Goal: §30.2 — default-expanded controls should be the ones that resolve the current confidence gaps, not a fixed set.
- `PriceRail.tsx`: drive default expansion from `assessConfidence(...).flags`. A Sharpen control auto-expands while its flag is `assumed`/`open` and collapses to "More accuracy" once `confirmed`. Keep NCB + named-driver always visible in Lower.
- Keep a manual override (user can expand/collapse).
- Acceptance: first estimate shows area/usage/insured; once all three are set they collapse, leaving a tidy "edit accuracy" affordance.

### 3. Mobile reflow + sticky bar for the new rail
Goal: the mobile sticky bar (`App.tsx`, `.mobile-price-bar`) predates the rebuild and still uses `rail.whyLower`.
- Update it to: (a) show "advisor will confirm" instead of a number when `assessConfidence(...).commercial`; (b) button label -> `rail.sharpenOrLower` ("Why · Sharpen · Lower"); (c) tap scrolls to the rail.
- Verify the two-group rail reflows cleanly at ≤820px (groups stack, "more" toggles work, sticky bar doesn't overlap the CTA).
- Acceptance: on a 375px viewport the live number (or advisor message) stays pinned; both groups and all controls are reachable.

### 4. Recommendation cards: insured value + commercial caveat
Goal: §9 wants an estimated insured value on cards; commercial use must carry through.
- `PlanCard.tsx`: add an "Insured value ฿X" line (from item 1). When `assessConfidence(...).commercial`, replace each card's price with the advisor-confirm message + a caveat chip.
- Acceptance: cards show insured value; with commercial use, cards show "advisor will confirm", not a number.

### 5. Handoff payload carries the confidence state
Goal: §11 — the advisor needs to know what's assumed vs confirmed.
- `App.tsx` `onSubmitLead`: include the `ConfidenceAssessment` flags, the `commercial` flag, and the full `controls`/`answers` in the lead object (logged is fine for now — wire the shape).
- Acceptance: the lead/confirmation object contains `confidence.level`, per-flag statuses, and `commercial`.

---

## P2 — polish / next levers

### 6. Trim / variant optional modifier (§30.6 priority 6)
- Replace the "coming soon" note with a real optional control: `trim?: 'standard' | 'hybrid' | 'performance' | 'import'` (undefined = assumed standard).
- Modifier ONLY, never new bands, never a plate lookup (§27.5). Coefficients: hybrid ×1.06, performance ×1.12, import ×1.15, standard ×1.0.
- Adds a `trim` confidence flag (confirmed when set) so it can lift confidence.
- Acceptance: selecting hybrid/performance/import adds a "Why this price?" line and confirms the trim flag.

### 7. At-fault 2+ as an eligibility cap
- §30.5 / Roojai Type 3+ caps at 2 at-fault claims/12mo. When `atFault === '2plus'`, in addition to +25%, set an eligibility flag -> confidence drops + an "advisor check" note (same treatment as commercial, lighter).
- Acceptance: `2+` shows the advisor-check note and lowers confidence.

### 8. EV battery / charger as price + confidence inputs (§28.2 / §30.4)
- For `answers.isEv`, evolve the educational `EvNotice` into two toggles: "Battery covered?" / "Wall-charger covered?" Each a small modifier (e.g. +4% / +3%) and a confidence flag. Keep the battery-exclusion warning.
- Acceptance: EV vehicles get the two toggles affecting price + confidence; ICE unchanged.

---

## P3 — later roadmap (spec only)
9. License tenure — conditional question only when `driverAge === '18-24'` or on exact-quote request; modifier (≥2 yrs -, <2 yrs +).
10. Optional benefit limits in compare — included/optional/not-included rows (roadside, PA, medical, flood, car replacement) in the compare table in `ResultsPanel.tsx`.

---

## Global guardrails — do NOT violate
- No new band-key dimensions unless the pricing benefit clearly justifies scraper cost — prefer modifier layers (§30.1).
- No plate / registration-NUMBER lookup (§27.5). "Registration province" only.
- Sum insured stays bounded around market value — never a free slider to zero (§30.5).
- Mileage stays honest — never imply pay-as-you-drive / telematics (§28.3).
- Indicative framing + advisor-confirms gate stay prominent; nothing reads as a bindable quote (§14).
- Every string bilingual (en + th) and rounded for display.

## Global acceptance / verification
- `npx tsc -b` and `npm run build` clean; `npm audit` stays at 0.
- Drive the full flow (intake -> tune -> recommendations -> lead -> confirmed) in TH and EN with no console errors.
- Confidence ladder holds: matched-vehicle first estimate = medium; all accuracy resolved = high; segment/commercial = rough.
