# Indara Advisor — MVP web app (A + C hybrid)

A mobile-first, responsive **web app** for the Indara AI car-insurance advisor.
Implements the "Advisor + live price rail" direction from the project memory
(`IndaraAI` repo, section 27.8): a conversational advisor that prices the car in
**3 taps**, explains the price, lets the user lower it, then captures a lead.
Bilingual (Thai + English). Front end only — pricing data is a seeded
**placeholder database**; the backend is stubbed.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
npm run seed     # regenerate the sample pricing database
```

## The flow (project memory §27–28)

1. **3-tap core intake** in the chat (left pane): Car (Brand → Model → Year,
   cascading catalog picker) → Cover goal → Driver age. Nothing else is asked.
2. **Live price rail** (right pane) appears with the first estimate and a
   **confidence label** (rough / medium / high), and recalculates live:
   - **Why this price?** — the deterministic base × modifier breakdown.
   - **Lower my price** — NCB-led savings console (claim-free years, repair
     channel, dashcam, voluntary excess, low mileage) + a "best achievable"
     floor projection. Setting your **area** sharpens medium → high confidence.
3. **3 recommendation cards** at the tuned price — Best Budget / Best Value /
   Strongest Coverage — each with a **coverage-gap educator** ("what's NOT
   covered") and an **upgrade delta** ("+฿X/yr adds…").
4. **Lead capture** (gated after value is shown) → confirmation + reference.

Plus two differentiators from the memory file:

- **"Should I claim?" calculator** (§28.1) — repair cost vs. excess + lost NCB,
  available anytime from the header. Educational only.
- **EV-aware branch** (§28.2) — picking an EV (e.g. BYD Atto 3) surfaces a
  battery / charging-cover notice and a cheaper-tier exclusion warning.

A guided **stepper** (Car → Cover → Driver → Tune price) runs across the top;
on narrow widths the panes stack and the live price **pins to a sticky bottom
bar** (with a "Why · Lower" jump) while the full rail stays scrollable below.

## Where the real backend plugs in

Everything the **price-scraper pipeline** and admin tools will own is isolated
behind a stable interface. Replace these, not the UI:

| Concern | Placeholder | Replace with |
| --- | --- | --- |
| Indicative pricing bands | `src/data/pricingBands.json` (+ `scripts/seedPricingBands.mjs`) | scraped bands from the pricing service / an endpoint |
| Plan content / benefits / gaps | `src/data/mockDb.ts` (`planTemplates`) | admin-approved plan content |
| Vehicle catalog | `src/data/catalog.ts` | make/model reference data |
| Quote computation | `src/lib/pricing.ts` | same modifier logic, reading from an API |
| Lead submission / reference | `src/data/mockDb.ts` (`makeReference`) + `App.tsx` `onSubmitLead` | POST to the lead API + CRM adapter |

The quote logic is **deterministic** — base bands × explicit, visible modifier
layers; no LLM-invented prices (compliance §14). All numbers are synthetic.

## Structure

```
src/
  App.tsx                 state machine + layout (stepper · chat · rail · results)
  types.ts                shared types
  data/
    flow.ts               3-tap core intake definition
    catalog.ts            brand → model picker + EV detection
    i18n.ts               TH / EN strings (placeholder, pending Indara approval)
    pricingData.ts        reads pricing bands; reference-age base-band lookup
    pricingBands.json     PLACEHOLDER DATABASE (regenerate via npm run seed)
    mockDb.ts             plan archetypes + coverage gaps
  lib/
    pricing.ts            deterministic base × modifier engine + claim math
    quoteEngine.ts        back-compat re-export of pricing.ts
  components/
    Header, Stepper, ChatPanel, PriceRail, PlanCard,
    ResultsPanel, LeadForm, ClaimCalculator
scripts/
  seedPricingBands.mjs    generates the sample pricing dataset
```

## Not in v1 (next)

Admin lead dashboard, real persistence, advisor notification, CRM adapter,
analytics events, registration-book OCR autofill, Indara garage-network surface.
See the project scope and memory docs in the `IndaraAI` repo.
