# Indara AI Project Memory

This file is intended for future LLMs, developers, product managers, and implementation partners working on the Indara AI Insurance Advisor project. Treat this as durable project context. Update it when key scope, product, compliance, or implementation decisions change.

Last updated: 2026-06-24

## 0. Confirmed Client Decisions (2026-06-19)

These were confirmed directly with the client and supersede the earlier open questions in section 18.

- Indicative quotes: sourced from a custom price-scraping tool that samples Thai insurance aggregator sites (e.g. MrKumka https://www.mrkumka.com/en/car-insurance/, Roojai https://www.roojai.com/en/car-insurance/). See section 10 for the recommended pipeline design.
- Plan cards: generic categories first (Best Budget / Best Value / Strongest Coverage). No real insurer names in the MVP.
- Content approval: Indara approves all insurance wording, coverage descriptions, disclaimers, and FAQ content.
- Primary channel: web-chat first. LINE OA deferred to phase 2.
- Language: bilingual (Thai + English) at launch.
- Lead management: no existing CRM/LMS (greenfield). Launch on the built-in admin lead dashboard; integrate a cheaper-than-HubSpot external CRM later (Zoho CRM recommended for cost, Thai/SE-Asia presence, and a mature API/webhooks). Build the lead object CRM-agnostic with a thin adapter so the external CRM can be swapped without reworking the app.

Still open: the legal/ToS implications of scraping aggregator sites (see section 18).

## 1. Project Identity

Project name: Indara AI Insurance Advisor

Client / brand: Indara Insurance

Product type: AI-powered car insurance chatbox and lead qualification experience.

Primary channel: Mobile-first web chat. The experience should feel close to a messaging app such as LINE.

Current phase: MVP scope and business requirements.

Repository: https://github.com/Jameswantk/IndaraAI.git

Local path used during this documentation pass: C:\Users\james\IndaraAI

## 2. High-Level Product Intent

Indara wants an all-in-one AI chatbox experience for insurance. The user described the desired experience as similar in outcome to online insurance aggregators such as Roojai and MrKumka, but more interactive, engaging, and conversational. The AI should feel like a human insurance expert on a messaging app.

The MVP must remain narrow. It should not become a full insurance marketplace, policy issuance system, or autonomous regulated sales agent.

The primary MVP job:

> Help a customer chat naturally with Indara, answer the minimum car-insurance questions, receive indicative quote-range recommendations, and submit a qualified lead to a human advisor.

## 3. Core MVP Boundary

In scope:

- Car insurance only.
- Chat-first customer journey.
- Thai and English support.
- AI-guided quote-range question flow.
- Indicative quote ranges.
- 2-3 plan recommendations.
- Simple comparison.
- Lead capture.
- Human advisor handoff.
- Admin lead dashboard.
- Basic content/pricing admin.
- Transcript and consent storage.
- Basic analytics.

Out of scope for MVP:

- Payment.
- Binding final quote.
- Full online purchase.
- Policy issuance.
- Claims handling.
- OCR document upload.
- Voice chat.
- User accounts.
- Renewal automation.
- Complex CRM automation.
- Multi-product marketplace.
- Fully autonomous regulated insurance advice.

## 4. Important Product Philosophy

This should not be "just a chatbot." It is a conversational insurance sales platform where AI is the interface, but pricing, eligibility, compliance, and lead handoff are controlled by structured systems.

The LLM should never be the source of truth for:

- Final prices.
- Policy wording.
- Coverage guarantees.
- Eligibility decisions.
- Compliance disclosures.

The LLM can:

- Ask questions.
- Explain approved concepts.
- Summarize answers.
- Use structured tools/rules.
- Recommend plan categories using deterministic outputs.
- Escalate to a human.

## 5. Market Research Summary

Public sources checked during planning:

- Roojai car insurance: https://www.roojai.com/en/car-insurance/
- Roojai voluntary car insurance requirements: https://www.roojai.com/en/car-insurance/voluntary/
- MrKumka car insurance: https://www.mrkumka.com/en/car-insurance/
- Rabbit Care car insurance: https://rabbitcare.com/en/car-insurance
- CheckDi car insurance Thailand: https://checkdi.com/th/car/main?lg=en
- CheckDi Type 1 pricing factors: https://checkdi.com/th/car/lp/class/1?lg=en
- MoneySuperMarket car insurance: https://www.moneysupermarket.com/car-insurance/
- Confused.com quote requirements: https://www.confused.com/compare-car-insurance/what-you-need-for-a-quote
- Compare the Market premium factors: https://www.comparethemarket.com/car-insurance/content/what-impacts-upon-your-car-insurance/
- Insurify comparison quote inputs: https://insurify.com/car-insurance/the-best-and-worst-sites-to-compare-car-insurance-quotes/

Typical online quote inputs across Thai and international aggregators:

- Vehicle make/brand.
- Vehicle model.
- Vehicle year or age.
- Location/province/postcode.
- Coverage type.
- Driver age.
- Usage type.
- Annual mileage.
- Driving history.
- Claims history.
- Repair preference.
- Current insurance/no-claims information.
- Contact details once quote or lead submission is needed.

Thai market-specific considerations:

- Coverage types include Type 1, Type 2+, Type 3+, Type 3, and compulsory Por Ror Bor.
- Repair preference matters: dealer repair vs garage repair.
- Sum insured / coverage amount matters.
- Flood, theft/fire, roadside assistance, and replacement car can matter as add-ons.
- LINE-style communication is culturally and operationally relevant.

## 6. Recommended Question Set

Collect the minimum fields needed for an indicative quote range:

1. Car brand.
2. Car model.
3. Car year or approximate age.
4. Province or main driving location.
5. Desired coverage style:
   - Best protection.
   - Good value.
   - Cheapest acceptable.
   - Not sure, recommend for me.
6. Main driver age range.
7. Usage type:
   - Personal.
   - Commute.
   - Business.
   - Delivery.
8. Approximate annual mileage.
9. Recent claims:
   - No.
   - Yes.
   - Not sure.
10. Repair preference:
   - Dealer repair.
   - Garage repair.
   - Not sure.
11. Current insurance expiry / renewal timing.

Avoid asking early:

- License plate.
- National ID.
- Home address.
- Chassis number.
- Engine number.
- Detailed accident facts.
- Claim document number.

These may be needed later for exact quote, purchase, or insurer verification, but they are too high-friction for the initial MVP quote-range journey.

## 7. Preferred Conversation Order

Use this order unless future product decisions change it:

1. Greet and explain no phone number is needed yet.
2. Ask car brand.
3. Ask car model.
4. Ask car year or approximate age.
5. Ask province / main driving location.
6. Ask desired protection style in plain language.
7. Ask driver age range.
8. Ask car usage.
9. Ask approximate mileage.
10. Ask recent claims.
11. Ask repair preference.
12. Ask renewal timing.
13. Summarize answers.
14. Ask permission to show estimated options.
15. Show recommendation cards.
16. Let user compare or view details.
17. Capture contact details after value is shown.
18. Create lead and confirm callback.

## 8. UX Direction

The UI should be chat-first, not form-first.

Important UI principles:

- Mobile-first.
- Chat is the main surface.
- Quick reply chips for common answers.
- Free text should always be accepted.
- "Not sure" should be available for difficult questions.
- Ask one question at a time.
- Delay contact capture until after recommendations.
- Plan cards should appear after enough quote details are collected.
- Comparison should be simple and high-level.
- Avoid dense legal/policy tables in MVP.

Suggested screen sequence:

1. Welcome chat.
2. Vehicle details.
3. Coverage preference.
4. Driver and usage questions.
5. Quote summary.
6. Recommended plan cards.
7. Why this plan explanation.
8. Plan comparison.
9. Lead capture.
10. Confirmation.

## 9. Recommendation Cards

Default MVP cards:

- Best Budget.
- Best Value.
- Strongest Coverage.

Each card should include:

- Label.
- Coverage type.
- Repair type.
- Estimated yearly premium range in THB.
- 3-4 benefit chips.
- Deductible/excess note if applicable.
- Installment availability.
- "Why this plan?" explanation.
- Buttons:
  - View details.
  - Compare.
  - I am interested.

Example:

```text
Best Value
Type 1 - Garage repair
Estimated: THB 13,000 - 17,000 / year
Good for: stronger protection without dealer-repair pricing
Benefits: Own damage, theft/fire, third-party liability, optional flood
```

## 10. Indicative Quote Logic

Important: Do not let the LLM invent prices.

Quote ranges should come from structured logic. For MVP this can be a simple quote-band table maintained by admin or configuration.

Inputs likely affecting quote ranges:

- Brand/model or vehicle group.
- Year/age band.
- Province/location.
- Coverage type.
- Driver age band.
- Usage type.
- Mileage band.
- Claims history.
- Repair preference.

Output:

- Minimum estimated yearly premium.
- Maximum estimated yearly premium.
- Recommended plan category.
- Explanation bullets.
- Confidence/missing-data flags.

All prices must be labeled as indicative and subject to verification.

### 10.1 Pricing Data Pipeline (confirmed 2026-06-19)

The pricing bands are populated by a custom price-scraping tool that samples Thai insurance aggregator sites (MrKumka, Roojai, and similar). Design guidance for future implementers:

- Scrape on a schedule (e.g. nightly/weekly), NOT live per conversation. Live scraping during chat would be slow, fragile, and break when a site changes its layout.
- Store scraped results as structured indicative pricing bands in the DB. The chat reads from these bands instantly and deterministically.
- Input-matching gap: aggregators compute quotes from inputs the MVP deliberately avoids (license plate, exact sub-model, national ID). The intake only collects brand / model / year-band / province / driver-age-band / usage / coverage type. So scrape across a grid of representative inputs and bucket results into bands that map to the coarser intake fields. The output is a range derived from sampled real quotes, not a mirror of any single aggregator's price.
- Build per-site adapters so one site breaking does not break the others. Add monitoring/alerts for failed scrapes or garbage output.
- Keep the admin manual-override of bands (section 13) so staff can correct or freeze bands if the scraper goes stale.
- Legal/ToS: aggregator sites likely prohibit automated scraping. This is a business/legal decision Indara owns (they approve compliance). See section 18 open question. Safer alternatives if needed: a data-sharing/partnership arrangement with an aggregator, or an insurer rate table.

## 11. Human Handoff Rules

Manual handoff:

- User clicks "Talk to human advisor."
- User clicks "I am interested."
- User submits lead details.

Automatic handoff:

- User asks to buy.
- User asks for final price.
- Claims history is complex.
- Vehicle is modified.
- Vehicle details are unclear.
- Usage is delivery/commercial and needs special handling.
- AI confidence is low.
- User asks for legal/regulatory advice.
- User asks about exact exclusions not in approved FAQ.

Handoff payload:

- Contact details.
- Preferred callback time.
- Language.
- Car details.
- Quote intake answers.
- Recommended plans.
- Selected plan.
- Summary.
- Full transcript.
- Consent timestamp.

## 12. Lead Capture Rules

Lead capture should happen after the user sees value.

Required lead fields:

- Name.
- Phone.
- LINE ID optional.
- Preferred language.
- Preferred callback time.
- Consent to be contacted.

Good lead capture copy:

> I can have an Indara advisor check the exact price for you. Your estimate may change after insurer verification. An advisor will confirm final price and coverage before you decide.

Confirmation should include:

- Reference ID.
- Callback window.
- Submitted summary.

## 13. Admin Requirements

Lead management at launch: Indara has no existing CRM/LMS (greenfield). The MVP launches on this built-in admin lead dashboard as the lead management system (effectively zero ongoing cost and purpose-built for the insurance funnel). A cheaper-than-HubSpot external CRM (Zoho CRM recommended) is integrated in a later phase. On lead creation, fire a single lead-created event consumed by (a) the advisor notification and (b) a CRM adapter, so the external CRM can be added/swapped without reworking the app.

Admin lead dashboard must show:

- Lead ID.
- Created time.
- Name.
- Phone.
- LINE ID.
- Preferred language.
- Preferred callback time.
- Car details.
- Coverage preference.
- Driver/usage/claims details.
- Recommended plan.
- Selected plan.
- Estimated quote range.
- Transcript.
- AI summary.
- Consent timestamp.
- Lead status.
- Assigned owner.

Lead statuses:

- New.
- Contacted.
- Quoted.
- Won.
- Lost.

Admin content/pricing should allow updates to:

- Indicative pricing bands.
- Coverage descriptions.
- FAQ answers.
- Plan card templates.
- Benefit labels.
- Disclaimers.
- Escalation rules.

## 14. Compliance Guardrails

Conservative MVP stance:

- This is lead capture plus advisor handoff.
- This is not final policy issuance.
- Quote ranges are indicative.
- Exact price requires advisor/insurer verification.
- Final coverage must be confirmed against actual policy terms.

AI must:

- Use approved content.
- Avoid binding language.
- Escalate uncertain cases.
- Store transcript.
- Store consent timestamp.
- Make privacy notice available.

AI must not:

- Promise coverage.
- Guarantee final price.
- Invent exclusions or benefits.
- Hide that a human advisor is needed.
- Ask for sensitive identifiers too early.

## 15. Business Requirements

Primary business goals:

- Increase quote-start to lead-submit conversion.
- Improve lead quality.
- Reduce advisor time spent gathering basic information.
- Educate customers before sales contact.
- Create a modern digital sales experience for Indara.

Metrics to track:

- Conversations started.
- Quote flows completed.
- Leads submitted.
- Quote completion rate.
- Lead submission rate.
- Drop-off question.
- Most selected coverage preference.
- Most recommended plan.
- Human handoff count.
- Advisor conversion from lead to quote.
- Quote to won conversion.

## 16. Acceptance Criteria

MVP is complete when:

- User can complete full quote-range journey on mobile.
- Required quote intake fields can be collected.
- Unknown/approximate answers are handled gracefully.
- User sees summary before recommendations.
- User sees 2-3 recommendation cards.
- User can compare plans.
- User can submit contact details and consent.
- Lead appears in dashboard.
- Transcript is visible.
- AI does not invent prices or unapproved policy details.
- Admin can update basic content/pricing data.
- Basic analytics are captured.

## 17. Timeline Memory

Recommended production MVP timeline:

- Discovery and UX: 2-3 weeks.
- MVP build: 6-8 weeks.
- QA and launch prep: 2-3 weeks.
- Total: 10-14 weeks.

Clickable demo/prototype:

- Could be done in 3-4 weeks.
- Should not be considered production-ready unless it includes guardrails, lead capture, admin visibility, and data storage.

## 18. Open Questions

Resolved (2026-06-19, see section 0):

- Recommendations generic categories vs insurer plans -> generic categories first.
- Historical quote data for pricing bands -> none; use a price-scraping tool to build bands (section 10.1).
- Existing CRM -> none (greenfield); launch on built-in dashboard, add external CRM (Zoho recommended) later.
- LINE OA in MVP -> no; web-chat first, LINE OA phase 2.
- Who approves product wording -> Indara.
- Thai-first vs bilingual -> bilingual (Thai + English) at launch.

Still open / future agents should resolve:

- Legal/ToS implications of scraping aggregator sites (MrKumka, Roojai, etc.). Indara owns this compliance decision. Consider data-sharing/partnership or insurer rate tables as alternatives.
- Which exact Indara products should be represented (once generic phase is validated).
- Does Indara have insurer APIs to integrate later?
- What callback SLA should be promised? (Drives advisor notifications and staffing.)
- How are new leads notified to the advisor team (email / LINE / WhatsApp)?
- How many advisor seats will work leads (affects future CRM cost/assignment)?
- Should document upload be phase 2 or included earlier?

## 19. Current Repository Documents

Created in this pass:

- README.md
- docs/mvp-scope-business-requirements.md
- memory/indara-ai-project-memory.md
- Scraper/README.md
- Scraper/MEMORY.md
- Scraper TypeScript worker scaffold

The requirements document is client/business-facing.

This memory file is implementation/context-facing and should be read by future LLMs before making product or scope changes.

The `Scraper/` folder is the offline pricing-band worker. Its first implementation supports manual CSV imports, public-page calibration adapters, generated JSON/JSONL storage, and pricing-band aggregation. It now also includes gated Playwright live quote-form adapters for Roojai and MrKumka behind `ALLOW_LIVE_QUOTE_FORMS=true`, plus authorized-testing controls for headed runs, slow motion, storage state, manual auth-state capture, and diagnostics. It must not be used to scrape competitor quote flows in real time during customer chat or to bypass CAPTCHA, anti-bot systems, login walls, access controls, or rate limits.

## 20. Customer Web App Build Status (2026-06-19)

A first mockup version of the customer web app has been scaffolded (workspace `indara-advisor/`, now committed to this repo 2026-06-23; see section 20.1 for the current A + C hybrid build).

- Stack: React + Vite + TypeScript. Mobile-first responsive (two-pane chat + results on desktop, stacked on mobile). Bilingual TH/EN with a live toggle.
- Flow implemented end to end: conversational intake (one question at a time, quick-reply chips + free text, "Not sure", progress indicator) -> quote summary -> 2-3 generic plan cards (Best Budget / Best Value / Strongest Coverage) -> lead capture (gated after value) -> confirmation with reference number.
- Deterministic quote engine; LLM never invents prices. UI labels estimates as indicative.
- Placeholder data stands in for the backend: bundled pricing seed + placeholder TH/EN copy (pending Indara content approval). Built and verified working; no admin dashboard or persistence yet.

It is a responsive web app, not a native mobile app. The customer side is public web; the admin side will be an authenticated web area.

### 20.1 A + C hybrid implementation status (2026-06-23, Claude)

The customer web app was rebuilt to the section 27.8 "Advisor + live price rail" direction and committed to this repo under `indara-advisor/`. Implemented and verified (type-checks, production build, driven end to end in-browser):

- 3-tap core intake in chat with a cascading Brand -> Model -> Year catalog picker (`data/catalog.ts`; 18 seeded vehicles mapping to exact pricing bands, free-typed vehicles fall back to the segment default).
- Guided stepper (Car -> Cover -> Driver -> Tune price).
- Persistent live price rail: the first indicative range appears right after the 3 core taps with a rough/medium/high confidence label, then recalculates live. Setting the area promotes medium -> high (exact band match).
- "Why this price?" breakdown: deterministic base band x explicit modifier layers (driver age, NCB, dashcam, voluntary excess, low mileage) shown as readable line items.
- NCB-led "Lower my price" console (claim-free years None/1/2/3/4+, repair channel, dashcam/excess/mileage toggles, area) with a best-achievable floor projection.
- 3 recommendation cards at the tuned price, each with a coverage-gap educator ("not covered") and an upgrade-delta ("+THB X/yr adds...").
- Lead capture after value -> confirmation + reference; data-freshness line from band `lastScrapedAt`.
- Mobile reflow: panes stack and the price rail collapses to a sticky bottom price bar.

New pricing model: `lib/pricing.ts` reads an age-neutral base band (`data/pricingData.ts` reference-age lookup) then applies the stacked modifier magnitudes from section 27.6. Sample database regenerable via `npm run seed` (`scripts/seedPricingBands.mjs`; 4,324 bands across 18 vehicles x 5 regions x 4 ages x 2 year bands x coverage/repair). Engine still deterministic; no LLM-invented prices (sections 4, 14).

### 20.2 Codex audit fixes (2026-06-23, Claude)

Addressed a Codex usability/technical audit of the section 20.1 build:

- Coverage mapping corrected to memory sections 6/9: "Good value" / "recommend for me" now map to **Type 2+** (was Type 1). The Best Value card is Type 2+ garage, so the three cards form a true ladder (Type 3+ -> Type 2+ -> Type 1) instead of garage-vs-dealer variants of Type 1.
- "3 quick taps" copy changed to "3 quick steps" in this round. Later UX review
  corrected the visible pre-price counter to count the 5 actual required sections
  before an indicative price appears (brand, model, year, cover goal, driver age),
  while the Stepper still groups them into Car / Cover / Driver / Tune milestones.
- NCB "Not sure" option added to the savings console (distinct from "None"; applies no discount).
- Lead-capture and claim-calculator controls given programmatic labels (htmlFor/id, aria-label) for screen readers.
- "Should I claim?" calculator gained an at-fault / not-at-fault toggle (a not-at-fault claim against a liable party keeps NCB) and is labelled a simplified first version.
- Dependency advisories cleared: upgraded to vite 8 + @vitejs/plugin-react 5; `npm audit` reports 0 vulnerabilities.
- Added an inline SVG favicon (removes the dev-server 404).
- Known/deferred (P3): bundling `pricingBands.json` keeps the JS chunk large; the production fix is loading bands from an endpoint (see 20.1 / README).

### 20.3 Section 30 two-group rail implemented (2026-06-23, Claude)

Implemented and verified in-browser the section 30 design plus the Claude/Codex
mockup-review refinements:

- Price rail split into "Lower my price" (savings: NCB, named-driver, repair,
  dashcam, excess, mileage tier) and "Sharpen this estimate" (accuracy: area,
  vehicle use, insured value, at-fault claims; trim parked as a "coming soon"
  note outside the active controls).
- Named-driver plan modifier (named only / any 30+ / any 25+ / any) with the
  coverage-tradeoff warning ("only listed drivers are covered"); advertised as
  "up to -X%" until selected, exact applied percentage after.
- Sum insured as a BOUNDED control (lower -10% / balanced / higher +10%, default
  balanced) with the write-off underinsurance warning; not a free slider.
- Vehicle use as an eligibility gate: business/delivery withdraws the confident
  number, shows "an advisor will confirm", and drops confidence (§11 / §30.5).
- Mileage upgraded from a boolean to tiers (<5k / 5-10k / 10-15k / 15k+ / not sure).
- Compositional confidence (§30.3): the badge is a weighted roll-up of band-match
  quality plus unresolved accuracy assumptions, with a "what's assumed" checklist
  and a "because {area & use} still assumed" reason line. Calibrated so a matched
  vehicle's first estimate reads medium, an exact band with use/insured still
  assumed stays medium, all-resolved reads high, and an unknown (segment) vehicle
  reads rough.
- Progressive disclosure (Codex restraint note): NCB + named-driver and
  area/use/insured shown by default; the rest behind "More ways to save" / "More
  accuracy". Sticky "See my 3 plans" CTA.
- Engine: new modifiers in lib/pricing.ts; PriceControls extended (the lowMileage
  boolean replaced by a mileage tier; province/sumInsured/usage/atFault are
  optional, where undefined = "assumed"). Bilingual TH/EN. tsc + production build
  clean; recommendation cards reflect the tuned controls.

This realizes §30.6 priorities 1-5 (named-driver, sum insured, usage gate,
mileage tiers, at-fault claims); trim (priority 6) remains deferred. The §30.2
named-driver tradeoff and §30.3 compositional-confidence amendments discussed
earlier are now implemented as described here.

### 20.4 "Indara's read" advisor layer implemented (2026-06-23, Claude)

Added a compact, deterministic advisor card in the price rail (slot 2: after the
live estimate, before "Why this price?"), per the agreed plan. No chatbot, no new
questions, no LLM — it interprets existing state (§4, §14).

- `lib/advisorRead.ts` `buildAdvisorRead(answers, controls, quote)` returns up to
  three rows: best next saving, biggest assumption, watch-out warning.
- Best next saving walks the lever ladder (NCB -> named-driver -> garage repair ->
  dashcam -> mileage -> excess) and is QUANTIFIED with the real THB it would
  remove (computed via headlineQuote with the lever applied).
- Biggest assumption reuses `assessConfidence(...).openLabelKeys` (summarizes
  "Sharpen this estimate").
- Watch-out surfaces the most likely regret: lower-insured / named-driver tradeoff,
  then the coverage-tier gap (Type 3+ theft/fire/solo, Type 2+ solo), then garage.
- Commercial / delivery use pivots the card to a single advisor-confirm row — no
  price optimization (§30.5 / §11).
- `components/IndaraRead.tsx`: quiet card (no AI badge, no chat input), collapsed
  to a one-line summary on mobile (<=820px). Row actions scroll to the relevant
  existing control (`Confirm`/`Adjust` -> Lower, `Sharpen` -> Sharpen, `See plans`
  -> recommendations); they never create new flows.
- De-duplicated the estimate card's "because … still assumed" line, which the
  read's assumption row now owns. Bilingual TH/EN. tsc + build clean.

Deliberately NOT built (kept out of MVP): open-ended chat, garage finder, renewal
advisor, LINE share, full plan Q&A, trim/hybrid pricing, extra EV toggles, policy
wallet, accounts.

### 20.5 Price-rail P1 done + "Indara's read" polish (2026-06-23)

Builds on 20.3 (the two-group rail) and 20.4 (Indara's read).

Price-rail P1 plan (docs/price-rail-implementation-plan.md) fully implemented by
Codex (commits b072b35 / 9b7d441):

- Sum insured backed by a real market-value reference: new `data/marketValues.ts`
  per vehicleGroup x yearBand; `marketValue()` / `insuredValue()` in pricing.ts;
  the control shows live THB (lower/balanced/higher = market value x0.9/x1.0/x1.1).
- Adaptive disclosure: confirmed accuracy controls (area / use / insured value)
  collapse to one-line "· value · Edit" summaries; still-assumed ones stay open.
- Mobile reflow: sticky bottom price bar updated for the new rail, including the
  commercial "advisor will confirm" wording.
- Plan cards: an estimated-insured-value line on every card; commercial use
  replaces the price with an advisor-confirm block + eligibility caveat and
  carries through the compare table and confirmation.
- Handoff payload: the lead is enriched with `quoteContext` = { answers, controls,
  confidence (ConfidenceAssessment), commercial } so advisors see what was
  assumed vs confirmed (§11).

This completes section 30.6 build priorities 1-5 (named-driver, sum insured,
usage gate, mileage tiers, at-fault claims). Priority 6 (trim / variant) remains
deferred, as do P2/P3 (EV battery/charger pricing, license tenure, optional-
benefit limits in compare).

"Indara's read" refinements (Claude, commits c442f94 / 9e4a28f / 417a777):

- Resolve feedback: when a real control change resolves a read suggestion (set
  province, confirm NCB, etc.) the row ticks to a green "Applied / Confirmed"
  state for ~1.3s then fades out as the next suggestion advances — so it feels
  like ticking off the advice. Acknowledgment fires on the truthful control
  change, NOT the chip click (no auto-applying possibly-inaccurate inputs).
- Action affordance: a read action now scrolls to the specific control (NCB
  block, named-driver, the open accuracy control the assumption is about, or the
  dashcam/excess/mileage toggles — auto-expanding "More ways to save") and flashes
  a brief highlight pulse, instead of just scrolling to the card.
- The "Claim-free years" box no longer carries a permanent blue outline — it shows
  the blue lead border only while NCB is unanswered (none / not sure), then calms
  to a normal border (color transition, no layout shift) once a value is chosen.

### 20.6 Codex-audit round 2: Indara's read accuracy + honest framing (2026-06-24, Claude)

Codex re-reviewed the §20.4/20.5 "Indara's read" build (ran it live, source pass)
and flagged four issues; Claude fixed all four plus a fifth that the highest-delta
sort exposed. Commits 448991d + 5b33a20, verified live in-browser end to end.

- [P2] Segment / free-typed vehicle now surfaces the RIGHT assumption. When
  `quote.quality === 'segment'` (car not in catalog, priced off similar vehicles),
  Indara's read biggest-assumption row says "I matched your car to similar
  vehicles. The exact model may affect the price." instead of misblaming area.
  (`lib/advisorRead.ts` biggestAssumption; new `read.assume.vehicle` TH/EN.)
- [P2] Named-driver warnings split by plan type. `any30` → "drivers under 30 may
  not be covered", `any25` → "under 25", `named` → "only listed driver(s)" — in
  BOTH Indara's read (coverageWarning) and the rail's inline ctrl-warn
  (`PriceRail.tsx`). New keys `read.warn.any30/any25`, `named.tradeoff.named/any30/
  any25` (the old single `named.tradeoff` / `read.warn.named` wording was wrong for
  age-restricted plans).
- [P3] Commercial pivot clears stale rows. Switching to Business/delivery now
  immediately cancels pending fade timers and replaces the row set with the single
  advisor-confirm warning, instead of letting resolved "Applied/Confirmed" rows
  linger ~1.3s above it (`IndaraRead.tsx`).
- [P3] Best-next-saving ranks by REAL THB delta. `bestSaving` now computes the
  saving for every available lever and sorts descending, instead of returning the
  first match in a fixed priority ladder.
- [follow-up] Don't coach a high-mileage user downward. The highest-delta sort
  exposed that `mileage === 'o15'` (user explicitly chose 15k+) was treated as a
  saving candidate patched toward <5k. Now mileage is only suggested when `unsure`
  — never nudge a user toward a lower tier they explicitly rejected (§14 honest
  framing). Copy ("Setting your *real* mileage…") was always written for the
  unanswered case.

Live walkthrough (Claude, desktop + mobile) also re-verified: Good value → Type 2+
mapping holds; 3-card ladder (Type 3+/2+/1) with coverage-gap + upgrade-delta +
compare table; lead capture (proper id/label[for], consent in a <label>) →
confirmation with reference; TH/EN toggle preserves entered data; mobile sticky
price bar + Indara's-read one-line collapse; "Should I claim?" at-fault/NCB math
correct. No console errors anywhere.

### 20.7 Intake back / change navigation (2026-06-24, Codex)

Fixes a real usability gap found in review: the intake chat was forward-only and
append-only — once an answer chip was tapped it was locked, the answer bubbles and
the top Stepper strip were both display-only, and the only reset (`onRestart`) was
wired solely into the confirmation screen. A mis-tapped model/year/coverage could
only be undone by reloading the page. Codex commit 0876129 (`App.tsx`,
`ChatPanel.tsx`, `Stepper.tsx`, `i18n.ts`, `styles.css`); tsc + build clean.

- Every sent answer bubble is now a button (click to re-open that question), with
  a pencil "Change" affordance beside it; a "← Back" row steps to the last
  answered question.
- Stepper Car / Cover / Driver chips are clickable once done (jump back to edit
  that group); Tune remains a status marker, not a button. The completed parts of
  the strip that always *looked* interactive now are.
- New `App.tsx` helpers: `editAnswer(targetIndex)` rewinds `stepIndex` and
  `clearForEdit` invalidates the now-stale downstream answers (changing brand
  clears model/group/EV/year; etc.); `nextOpenStep` / `moveAfterAnswer` resume at
  the first still-unanswered step and jump straight to `tune` once the core is
  complete (so editing one field mid-flow doesn't force re-walking the rest).
  Editing also clears any captured lead/reference. New i18n: `step.change`,
  `chat.back`, `chat.change`, `chat.changeAnswer` (TH/EN).

### 20.8 Netlify demo deployment (2026-06-24, Codex)

Public demo deployed to Netlify:

- Live URL: `https://indara-advisor-demo.netlify.app`
- Netlify admin: `https://app.netlify.com/projects/indara-advisor-demo`
- Site ID: `39ab2641-7520-40ac-9d8a-48f82ae3b09c`

Deployment was created from the local `indara-advisor/dist` production build using
Netlify CLI, not yet configured as GitHub-connected continuous deployment. The
live smoke test loaded the page, verified the title `Indara Advisor`, and clicked
Toyota into the model step with no browser console errors.

Exposure note for client demos: this is a static frontend deployment. It does not
expose backend secrets or credentials, but the browser necessarily exposes the
frontend bundle, static assets, React/Vite traces in minified JS, and bundled mock
pricing data / deterministic demo logic. Real insurer integrations, lead storage,
pricing rules, and proprietary data should move behind server/API boundaries for
production.

## 21. Pricing Data Contract And Fallback

The web app reads pricing from the Scraper's `PricingBand` shape directly (see `Scraper/src/types.ts`), so the two workstreams are contract-compatible.

- Band key = `vehicleGroup | yearBand | provinceRegion | coverageType | driverAgeBand | repairPref`.
- Coverage codes follow the Scraper: `type_1`, `type_2_plus`, `type_2`, `type_3_plus`, `type_3`.
- The app maps its coarse intake answers onto these canonical keys, looks up the band, and surfaces the band's confidence.

Fallback ladder when an exact band is missing (the app must NEVER fabricate a price):

1. Exact band -> use stored min/max/median, keep its confidence.
2. Relaxed match (same vehicle + coverage; drop repair -> province -> age band) -> confidence forced low, displayed range widened ~8% to signal uncertainty.
3. Segment default (vehicle not in data -> `default` vehicle group) -> low confidence, shown as a "rough estimate".
4. None groundable -> show no number; card says an advisor will price it and routes to human handoff.

Production swap: replace the bundled `pricingBands.json` with the Scraper's `pricing_bands.json` output (same shape) -- no other app changes. Open decision: how the app receives that file (bundle at build time vs fetch from an endpoint); bundle for the mockup, endpoint for production.

## 22. Competitive Landscape And Differentiation (Thai Market)

Findings from market research:

- The conversational-quote pattern is proven globally (Lemonade's Maya, Perspective AI, Floatbot) -- not a novel category, which lowers concept risk.
- Thai incumbents quote via FORMS, not conversation: Roojai (form-based 60-sec quote; well funded, $60m Series C Nov 2025), Rabbit Care, MrKumka, CheckDi. LINE is used for payment/claims/support, not conversational quoting.
- Closest Thai precedent: FWD + AiChat ran a conversational quote bot, but single-carrier life/health on Messenger. Sunday Ins is an ML pricing engine with a self-serve UI, not a chatbot. Vendors (Botnoi, iApp Chinda, True, AiChat) build service/claims bots for insurers.
- Gap: a neutral, conversational, bilingual CAR-insurance advisor is open in Thailand.

Chosen differentiation -- anchor the MVP on these three (free, on-brand, buildable now):

- Neutral honest-broker advisor (vs single-carrier bots).
- Education-first, plain-language trust (most buyers do not understand Type 1/2+/3+/3).
- Value-before-contact (show indicative price before asking for a phone number).

Future moats (roadmap, not MVP): registration-book (เล่มทะเบียน) photo OCR autofill as the signature "magic moment"; expat segment; EV and rideshare/delivery verticals; AI-does-homework + human-confirms hybrid handoff.

## 23. Recommended Additional Features (Not Yet Confirmed)

Surfaced as recommendations; confirm with Indara before building:

- Real-time advisor notification on new lead (highest priority -- a dashboard alone will not be watched; pairs with the lead-created event in section 13).
- Lead assignment / claim locking to prevent double-contact.
- CSV export of leads (cheap, useful before any CRM integration).
- Abuse / cost guardrails on the public chat (rate limiting, message caps, bot protection on lead capture).
- Graceful AI-failure fallback (low confidence / error / timeout -> offer human advisor rather than a broken state).
- Session resume, UTM/source capture, and an estimate-vs-actual feedback loop (advisors log the real quoted price to improve bands over time).

## 24. Scraper Review, Proposal, And Implementation Status (2026-06-19)

A full source review of `Scraper/` was done against the goal of a complete premium DB across brands/models.

Strengths: typed `PricingBand` / `RawQuote` / `GridInput` contract (matches the web app); sensible banding (10/90 trim, median, confidence by sample count, manual-override respected); strong compliance gating (`ALLOW_LIVE_QUOTE_FORMS`, automation-block detection, diagnostics, graceful non-price handling); realistic Roojai funnel handling.

Weaknesses identified: small hand-written smoke grid (8 Roojai scenarios, single-valued on non-vehicle dimensions); coverage asserted `type_1` only, and whether Roojai exposes multiple tiers in one DOM was unverified; hardcoded form answers could make band keys untruthful; `bander.ts` did not filter on `premiumBasis`; confidence stuck low under deterministic re-scraping; body-text regex extraction with risky fallbacks; fixed-sleep throughput won't scale; MrKumka not yet reaching trim/premium.

Proposal written: `Scraper/Claude_Suggestedchanges_Scraper.md`. Phases: (0) diagnostics spike to verify the Roojai tier DOM before any multi-tier yield; (1) observed coverage typing + schema cleanup (`targetCoverageType`), `GridInput`-parametrized form filling, DOM-scoped extraction + non-annual rejection in `bander.ts`; (1b) gated multi-tier capture OR separate per-coverage runs; (2) gated/capped catalog crawl (`ALLOW_CATALOG_CRAWL`, site allowlist, per-run caps, cache) + bounded grid generator + coverage report; (3) single-source then cross-source confidence, MrKumka fix, throughput/caching/scheduling, production storage.

Reviewed by Codex (v1 -> v3); corrections incorporated: gate multi-tier behind the spike (do not assume multiple tiers in one DOM); add a bander-level non-annual filter; schema cleanup so observed != requested coverage cannot contradict; catalog-crawl safety controls; split confidence into single-source first, cross-source after MrKumka works; corrected current-state facts (8 scenarios; Roojai live reaches premiums; MrKumka is the unreliable source).

Status: per the proposal doc, the scraper-side architecture and safety changes have since been implemented in the scraper core; the production database and admin override UI remain a separate workstream. Remaining/next: run the 0.1 diagnostics spike (if not already), build the catalog + grid for breadth, and move to production storage.

## 25. Interactive Differentiation Feature Roadmap (Web App)

Concrete, buildable features to differentiate the interactive quote site, beyond the section 22 positioning anchors. The Thai incumbents are form-based black boxes, so differentiate on transparency, interactivity, and trust.

Tier 1 -- leverage the existing deterministic band engine (low effort):

- Interactive what-if price explorer: live sliders/toggles for coverage tier, garage vs dealer repair, voluntary excess, driver age, with the indicative range updating in real time.
- Price-factor breakdown ("why is my price this?"): surface the deterministic modifiers that drove the estimate.
- Coverage-gap educator ("what you're NOT covered for") + upgrade-delta ("+THB X/yr adds own-damage cover").

Tier 2 -- signature bets:

- Registration-book (เล่มทะเบียน) / car-photo OCR autofill (the "magic moment").
- Surface Indara's approved repair-shop network (~1,424 garages, 22 branches per indara.co.th) as "approved garages near you" when garage repair is chosen.
- Data-freshness / confidence transparency, using the band `confidence` and `lastScrapedAt`.

Tier 3 -- retention: renewal reminder + price-watch; save & resume / share via LINE (no account).

Tier 4 -- vertical wedges: EV-aware flow (battery/charging cover; insurers still pricing EVs); Grab/delivery commercial-use mode.

Recommended next three to build: 3-tap first estimate, "Lower my price" controls, and price-factor breakdown. Registration-book OCR remains the post-MVP signature moment.

Compliance: do NOT present competitor prices as quotes even though pricing data is scraped from aggregators; at most a generic "typical market range" framing, and only with Indara sign-off.

## 26. Scraper Core Implementation Details (2026-06-19)

This section is additive to section 24 and preserves Claude Code/project notes. It records the specific scraper-core implementation details from commit `89af829`.

Latest pushed implementation commit: `89af829 Implement comprehensive scraper controls`.

Key current facts:

- The scraper core is now structurally comprehensive for the quote factors discussed with the user: vehicle, location/postcode, requested coverage, observed coverage, dashcam, mileage, car usage, commute usage, claims, financing, NCB, driver profile, license tenure, policy start, alcohol-free policy setting, and repair preference.
- The live quote grid is bounded and config-driven. The current smoke grid covers Toyota Vios/Yaris, Honda City/Civic, BMW 320i/X1, Mercedes-Benz C200/E220.
- The scraper separates requested coverage from observed coverage. Pricing bands must use observed `coverageType`, not the requested scenario value.
- Annual-only guardrail is implemented at both extraction and banding layers. Non-annual, installment, unknown-basis, and unobserved-coverage rows must not contribute to customer pricing bands.
- Roojai live quote flow is verified as premium-producing for the smoke path. The latest focused run captured Toyota Vios 2021 at `6790 THB/year`, observed `type_1`, `premiumBasis=annual`, and `extractionMethod=dom_plan_card`.
- Roojai extraction now uses DOM/hidden automation summary fields when available: `SummaryPrice`, `CoverType`, `PaymentFrequency`.
- MrKumka is wired to the same safer extraction contract but still needs selector QA before it can serve as a reliable second live source.
- Coverage completeness and refresh planning commands exist: `npm run report:coverage` and `npm run plan:incremental -- --limit <n>`.
- Catalog crawling is implemented but gated: `ALLOW_CATALOG_CRAWL=true`, `CATALOG_SITES`, and per-run caps are required.

Operational guidance:

- The scraper should still run offline/scheduled, never during a customer conversation.
- The chat app should consume generated pricing bands or the future production DB, not live websites.
- The data will not be truly comprehensive until Indara approves broader runs and the grid is populated across coverage tiers, vehicles, provinces, and driver/usage factors.
- Continue treating legal/ToS approval for competitor quote-form automation as an Indara business/compliance decision.

## 27. MVP Scope Refinement: Price in 3 Taps + Lower My Price (2026-06-22)

Design decision after competitive review: "fast quote" is not enough by itself. Thai competitors already claim 30-second / 60-second / under-one-minute quote flows. The differentiated MVP should be:

> Know your likely price, understand why, lower it if you can, then choose whether to talk to an advisor.

This keeps the product simple, but makes it feel unlike a normal aggregator form. The wedge is explainable price control before lead capture, not AI novelty.

### 27.1 Simple customer flow

```text
1. Pick car
   Brand -> Model -> Year

2. Pick coverage goal
   Lowest-cost basic cover / Balanced value / Strongest protection
   Map these to Type 3 or 3+ / Type 2+ / Type 1 recommendations, with plain-language explanation.

3. Pick driver age band
   Under 25 / 25-35 / 36-50 / 50+
   This keeps the first estimate aligned with the current pricing-band key.

4. Show first indicative THB range immediately
   Label confidence clearly: rough / medium / high.
   Do not ask for phone number yet.

5. Show "Why this price?"
   Base price from car + coverage.
   Adjustments shown as readable chips, not actuarial jargon.

6. Show "Lower my price" controls
   Lead with No-Claim Bonus / claim-free years.
   Garage repair ok?
   Add voluntary excess?
   Have dashcam?
   Low mileage?
   Province / area?

7. Show 2-3 generic recommendation cards
   Best Budget / Best Value / Strongest Coverage.
   Include what is not covered and what changes the price.

8. Lead capture after value
   "Want an Indara advisor to check exact options?"
   Capture name, phone/LINE, preferred callback time, consent.
```

### 27.2 Core product rule

Lead with explainability and price control. "No phone number before price" is table stakes because Thai competitors such as MrKumka already promise no-contact quote journeys; it should be preserved, but not used as the main public hook.

The first price must appear before phone capture. The user should feel they received value before becoming a lead.

The first estimate should be as clean as the current pricing contract allows. Always show a visible confidence label: rough / medium / high. If any band-key dimension is defaulted or relaxed, explain that optional answers can narrow or lower the range.

### 27.3 Why driver age stays in the core, while NCB leads refinement

Product review originally considered claim / no-claim status as the third core tap because it is a large perceived price lever. Final recommendation: keep driver age in the core and make NCB / claim-free years the lead "Lower my price" control.

Reasons:

- Driver age is part of the current `PricingBand` key (`vehicleGroup | yearBand | provinceRegion | coverageType | driverAgeBand | repairPref`), so asking it in the core enables a cleaner first lookup.
- NCB / claims are not currently band-key dimensions. They can be applied as explicit modifier layers after the base band is found.
- A simple "claim last year?" chip does not resolve the full NCB tier. The 20% / 30% / 40% / 50% ladder depends on accumulated claim-free years.
- The strongest product moment is a trustworthy first estimate that visibly drops when the user taps a no-claim / claim-free-years chip.

Implementation note: default the first base estimate to no NCB or unknown NCB unless the user has already supplied it. Then make the first refine chip "No claim bonus / claim-free years" with choices such as `None / 1 year / 2 years / 3 years / 4+ years / Not sure`, so the price can visibly drop with a clear explanation.

Optional alternative: if user testing shows that NCB must appear earlier, add it as a fourth tap rather than evicting driver age from the core.

### 27.4 Differentiation anchors

Build the MVP around these product promises, in this order:

1. **Explain the price**
   Show why the range moved: car, coverage class, claim history / NCB, repair choice, dashcam, driver, province, mileage.

2. **Let the user change the price**
   Make the optional controls feel like a savings console, not more form fields.

3. **Explain coverage gaps**
   Do not only say "Type 1 / 2+ / 3+". Say what is not covered, and what extra THB/year buys.

4. **Use Indara-specific trust**
   Surface Indara's branch and garage network when relevant, especially after province / repair preference. This is harder for generic aggregators to copy than a chat UI.

5. **Preserve price before phone number**
   The customer sees an indicative range before lead capture. This supports trust, but is not the unique wedge.

### 27.5 License-plate -> vehicle lookup: ruled out

"Type a plate, auto-fill the car" was evaluated and permanently ruled out for MVP. Do not re-propose.

- Thailand's DLT (Department of Land Transport) exposes no public real-time API mapping a plate number to vehicle specs; owner/vehicle records are PII gated behind an official request taking ~1-3 business days.
- The consumer "Thang Rath" (ทางรัฐ) app only shows an owner their own vehicle after authentication.
- Commercial APIs (iApp Technology, Plate Recognizer) are ALPR/OCR: they recognise the car from a photo, not from the plate string against a registry.

Substitute: a static Make/Model/Year cascading picker delivers the near-zero typing feel without PII. The realistic magic autofill remains registration-book (เล่มทะเบียน) / car-photo OCR, and should stay post-MVP.

### 27.6 Thai rating-factor magnitudes (for quote-engine modifiers)

Researched 2026-06-22 from current Thai sources (DirectAsia, MSIG, Roojai, OIC-aligned guides). Two layers; structure `mockDb` modifiers as base x stacked discount multipliers.

Base setters (driven by make/model/year):

- Coverage class (Type 1 / 2+ / 3+ / 3) is the biggest single lever; Type 1 is roughly 2-4x Type 3.
- Sum insured is roughly tied to market value from make/model/year; premium scales broadly with that value.
- Car group / repair cost, car age, and usage affect the base.

Stacked discounts / loadings:

- No-Claim Bonus (NCB): 20% / 30% / 40% / 50% for 1/2/3/4+ claim-free years. Biggest discount.
- Named-driver age: 18-24 -> 5%, 25-35 -> 10%, 36-50 -> 15%, 50+ -> 20%.
- Voluntary deductible/excess: paying the first THB 1,000-5,000 of a claim lowers premium.
- Dashcam: 5-10% off net premium.
- Province/area: urban/Bangkok loading higher, rural lower.
- Repair type: dealer/ศูนย์ adds roughly 10-20%+ vs general garage (อู่).

Note: an OIC two-factor discount system (driving history + claims, 5 levels each, around +10%/yr for a clean record) took effect Aug 2025; treat exact figures as provisional. Compliance unchanged: these are indicative ranges, never presented as a specific insurer's quote.

### 27.7 Implementation mapping

Against the existing `indara-advisor/` workspace (section 20):

- `data/flow.ts`: split steps into `coreEstimate`, `priceControls`, `recommendations`, and `leadCapture`.
- `components/ChatPanel.tsx`: add the cascading Brand -> Model -> Year picker and keep the first three taps fast.
- `components/ResultsPanel.tsx`: add an `estimate` stage between `intake` and `recommendations`, with confidence and "Why this price?".
- `lib/quoteEngine.ts` / `data/mockDb.ts`: expose modifier breakdowns and support default/unknown factors for low-confidence first estimates.
- Future pricing work: add claim / NCB segmentation to generated pricing bands or apply it as an explicit modifier layer on top of base bands.

The goal is not to build a chatbot that asks fewer questions. The goal is to build an advisor surface where users can see and improve their likely price before talking to anyone.

**Status: implemented 2026-06-23 — see section 20.1.**

### 27.8 Chosen design direction: "Advisor + live price rail" (A + C hybrid, 2026-06-22)

Three UI directions were mocked and compared: A "The Advisor" (conversational two-pane), B "The Price Cockpit" (calculator-forward, price front-and-centre), and C "Guided" (stepper + sticky live-price rail). Chosen direction: an **A + C hybrid**. Browsable mockups live in the repo `design/` folder (`design/indara-advisor-mockup.html`, `design/README.md`).

The hybrid:

- Chat advisor (A) drives the 3-tap intake in the left pane — reuses the existing `ChatPanel` / `ResultsPanel` two-pane shell, so low build delta.
- A guided stepper (C) runs across the top (`Car -> Cover -> Driver -> Tune price`) so progress and the "3 taps" promise are visible; step 4 "Tune price" signals where savings happen.
- A persistent live-price rail (C) fills the right pane from the first answer and visibly recalculates — carrying the estimate + confidence label, the "Why this price?" breakdown, and the NCB-led "Lower my price" console (A's price-control emphasis).

Why this combo: the stepper fixes pure-chat's hidden-progress weakness; the always-on reacting price keeps the experience reading as a price tool with an advisor (NOT an "AI chatbot", per 27.2 and the section 29 positioning); and it stays inside the existing component structure.

Mobile / narrow reflow: stacks to chat-on-top with the price rail collapsing into a sticky bottom bar (current estimate + "why / lower" expander) so the live number stays visible while the chat scrolls.

Not chosen: B as a standalone (too transactional, drops the advisory/education layer) and C as a standalone (reads like a polished aggregator form). B's market-position bar (where the user's price sits between budget and strongest) is parked as an optional later enhancement to the rail.

**Section 27.8 status: implemented 2026-06-23 — see section 20.1.**

## 28. Additional Differentiation: Claim-Decision Tool + EV-Aware Branch (2026-06-22)

From an online competitive + market scan (2026-06-22). These ADD to the section 27 spine; they do not replace it. The core MVP flow stays: price in 3 taps -> explain why -> lower my price -> lead capture. Sequencing discipline: 28.1 and 28.2 are roadmap features; 28.3 are later notes, kept out of the MVP so the main flow stays light.

Market context confirmed by the scan: speed (30-60s quotes), no-contact quotes (MrKumka), best-price guarantees, instalments, garage networks, and NCB / named-driver messaging are all table stakes across Roojai / MrKumka / Rabbit Care / CheckDi — none of these differentiate. The durable wedge remains explainable, user-controllable price and money decisions.

### 28.1 "Should I claim?" decision calculator (high priority)

An interactive tool answering "is it worth claiming this damage, or paying out of pocket?" No Thai aggregator foregrounds this as an interactive product.

- The decision math: repair cost vs (deductible/excess + value of NCB lost). An at-fault claim drops NCB one tier (e.g. 30% -> 20%); 2+ at-fault claims whose damage exceeds ~200% of premium can reset NCB to 0%.
- Fit: reuses the NCB ladder (20/30/40/50%, section 27.6) and deductible math the engine already handles — near-zero new modeling.
- It extends the explainability wedge from pre-purchase into the ownership relationship, and works BEFORE lead capture as a lead magnet (e.g. "Not sure whether to claim that THB 10k dent?"). Turns insurance from "buy a policy" into "help me make a better money decision."
- COMPLIANCE: frame strictly as an educational calculator, indicative only — NOT claims handling or legal/financial advice. Consistent with the section 14 guardrails.

**28.1 status: implemented 2026-06-23 as the in-app "Should I claim?" educational calculator — see section 20.1.**

### 28.2 EV-aware coverage branch (high priority, conditional)

Triggers ONLY when the Brand -> Model -> Year picker detects an EV (BYD, Tesla, MG, etc.), so the main MVP does not get heavier for ICE buyers.

- Show "EV insurance works differently": explain battery cover, charging-equipment cover, and coverage gaps; warn clearly when a cheaper tier EXCLUDES battery protection.
- Backed by real regulatory/product differences: OIC Registrar Order 47/2566 created standard BEV policy rules including battery compensation tiers (100% of battery value if <=1yr, declining to ~50% if >5yr), while charger / wall-box protection may need clear add-on explanation. EV repair/parts run ~50-60% higher than ICE; EV is ~3.83% of Type 1 policies and growing ~400%/yr, with many buyers confused or underinsured — a real underserved gap.
- This upgrades the section 25 Tier 4 "EV-aware flow" note into a concrete conditional branch off the existing vehicle picker.

**28.2 status: implemented 2026-06-23 as a conditional EV notice off the vehicle picker — see section 20.1.**

### 28.3 Later roadmap notes (not MVP)

- Digital policy wallet / instant proof of coverage: from 1 Jan 2026, Thai law moves motor policies toward fully digital issuance. Precise scope: the compulsory Por Ror Bor going fully digital is confirmed; treat the broader voluntary-policy experience as an operations/retention item, not a lead-gen differentiator. Post-purchase; aligns Indara with the mandate.
- Light usage-based / low-mileage framing: usage-based insurance (telematics / pay-as-you-drive via OBD or app telemetry) is a rising Thai motor trend AND already exists in-market — Thaivivat ships a real "no drive, no pay" on-off pay-per-use product via an AIS IoT device (premium from ~600 baht, up to ~40% cheaper). We do NOT have telematics hardware or a pay-per-use carrier product, so for MVP lean into the existing low-mileage "Lower my price" chip framed honestly as "low mileage may qualify for cheaper options" — do NOT call it pay-as-you-drive or imply telematics we do not have. Treat Thaivivat as the real pay-per-use benchmark a savvy user may compare against. (Corrects an earlier draft of this note that implied no such product exists.)

Sources from the scan: Motorist (claim vs NCB math), Roojai (NCB ladder, EV battery/charger coverage), Baker McKenzie / Lexology (OIC Registrar Order 47/2566 BEV rules), Bangkok Post (EV claim costs), OIC CIT (usage-based insurance), and Thai motor-insurance market reports (digital-policy mandate, UBI trend).

## 29. Competitive Validation: Does an Integrated Product Like This Already Exist? (verdict recorded 2026-06-22)

The research INTENT (immediately below) was recorded first, deliberately WITHOUT a conclusion, to avoid confirmation bias. The verdict (29.1) was added ONLY after a second, independent analysis (Codex) was run separately and converged on the same conclusion — so the finding is corroborated across two analyses, not self-confirmed. The intent text is preserved as a record of how the verdict was reached.

What we are validating: whether the combined section 27 + 28 concept already exists as a single product — in Thailand or globally. The concept under test is a neutral, bilingual (TH/EN) conversational AI car-insurance advisor that shows an instant, explainable indicative price the user can lower live via "Lower my price" controls BEFORE lead capture, plus a "Should I claim?" decision tool and an EV-aware coverage branch.

Dimensions to assess — each independently, then as a bundle:

- Conversational / AI-first quote intake (vs form-based) for motor insurance.
- Explainable "why this price?" breakdown.
- Live, user-controlled price adjustment (the "savings console").
- Indicative price/value shown before contact capture.
- "Should I claim?" / NCB-loss decision tooling.
- EV-specific coverage branch.
- Neutral multi-insurer positioning (vs single-carrier).
- Thai-market localisation + bilingual TH/EN.

How to evaluate (to stay honest):

- Actively seek DISCONFIRMING evidence — a Thai or global player already shipping the full bundle, or shipping enough of it that the gap is shallow.
- Separate two questions: (a) does the integrated product exist? and (b) even if it does not, is the bundle a DURABLE moat or quickly copyable given that conversational-AI and quote-adjust tech are commoditised? Both are open.
- Weigh Indara-specific assets (brand, 77-year history, branch + garage network, the pricing-band data pipeline) as part of defensibility, not just the UX.

### 29.1 Verdict (2026-06-22, corroborated by an independent Codex analysis)

Finding: NO single product — in Thailand or globally — matches the full integrated concept. The individual components all exist separately; nobody appears to have bundled them into a customer-facing "insurance decision cockpit" for Thai motor insurance. Two separate scans (Claude and Codex) reached this independently and converged, which is why it is now recorded despite the earlier bias caution.

Evidence map — what exists, and where:

- Thai incumbents already cover speed, comparison, no-contact quotes, instalments, price guarantees, and discounts (NCB up to 50%, named-driver up to 20%) — all table stakes, none differentiating on their own:
  - Roojai: strong online quote/buy, e-policy, no contact needed for an instant quote, dashcam discount, EV product, app claims, large garage network.
  - MrKumka: closest on instant no-contact quote; 3-step flow incl. car / driver / claims / mileage.
  - CheckDi: ~30s comparison from 40+ insurers, best-price guarantee, basic class education.
  - Rabbit Care: best-price guarantee, 0% instalments, NCB / named-driver discounts.
  - Gengmak: compares 24 insurers but asks phone/email before the quote.
- Thaivivat: a GENUINE Thai usage-based / pay-per-use ("no drive, no pay") on-off product via an AIS IoT device; premium from ~600 baht, up to ~40% cheaper. Verified — real UBI in-market (see corrected 28.3).
- Roojai EV: a serious EV product (battery + wall-charger cover, EV education); EV insurance itself is not novel.
- Global near-matches (individual pieces, not the bundle, and not Thai):
  - Progressive "Name Your Price": the closest price-CONTROL ancestor (target a budget, adjust coverage to fit).
  - The Zebra: quick estimate with "why we ask" explanations — more calculator than live savings console.
  - Jerry (jerry.ai): the closest STRATEGIC analogue — a car-ownership super-app (compare 100+, find discounts, repair help, driving score); validates the ownership-tool / "Should I claim?" direction, but is US, carrier-comparison-led, and not framed around explainable price control.
  - Lemonade: proves conversational insurance works, but carrier-led, not neutral motor comparison.
  - FWD Thailand + AiChat: proved conversational quote conversion in Thailand, but a single-carrier campaign, not neutral aggregation.

What looks open (the white space):

- The integrated sequence itself: quick estimate -> "why this price?" -> live "Lower my price" -> coverage-gap education -> lead capture -> ownership tools.
- An NCB-led live "Lower my price" moment; a "Should I claim?" calculator integrated into the advisor (not found in Thai aggregators); an EV conditional branch off the picker; and Indara's garage/branch trust surfaced inside the quote UX.

Defensibility (honest): the enabling tech (conversational AI, quote-adjust UX) is commoditised and copyable — a well-funded incumbent (e.g. Roojai, $60m Series C Nov 2025) could replicate the UX. So the moat is NOT the tech; it is integration + Thai localisation/bilingual + Indara-specific assets (brand / 77-year history, branch + 1,424-garage network, the pricing-band data pipeline) + tight execution. Differentiation is real but execution-dependent, not structurally protected.

Positioning that follows: lead with "Understand and control your car-insurance price before you speak to anyone." NOT "get a quote fast", and NOT "AI chatbot".

Sources: Roojai, MrKumka, CheckDi, Rabbit Care, Gengmak, Thaivivat (thaivivat.co.th + Nation/Bangkok Post on the AIS IoT on-off product), Roojai EV, Progressive Name Your Price, The Zebra, Jerry, Lemonade, FWD + AiChat. Verdict corroborated independently by Codex's competitive scan.

### 29.2 Detailed Codex market-equivalence audit (2026-06-22)

Codex follow-up question tested: "Is there already a product like this on the market?" Answer: no public evidence of the full bundle was found. There are many strong feature fragments, but not the complete Thai-market pattern:

`3-tap indicative estimate -> visible confidence -> why-this-price explanation -> live lower-my-price controls -> coverage-gap education -> lead capture -> later claim-decision / EV-aware branches`

Feature-by-feature market read:

| Indara component | Market status | Product implication |
|---|---|---|
| Fast quote | Exists widely | Do not lead with this; speed is expected. |
| No phone before quote | Exists | Preserve it for trust, but do not claim it as the unique hook. |
| Multi-insurer comparison | Exists | Table stakes for aggregator positioning. |
| NCB / dashcam / named-driver discounts | Exists | Use these as interactive controls, not static marketing bullets. |
| Explain why the premium moved | Partial | Common in articles / FAQ; not commonly exposed as an in-flow live explanation layer. |
| Live price-control / savings console | Partial globally | Progressive is the closest ancestor; Thai public aggregators did not show the full savings-console pattern. |
| Coverage-gap explanation tied to the user's selected quote | Partial | Competitors explain coverage types, but the opportunity is making gaps contextual and decision-oriented. |
| NCB-led visible price-drop moment | Not clearly found | Strong MVP interaction: default no/unknown NCB, then let the price drop when claim-free years are selected. |
| "Should I claim?" calculator | Not found in Thai aggregators | Strong roadmap lead magnet / ownership tool; frame as educational only. |
| EV-aware conditional branch from car picker | Partial | EV products exist, but the opportunity is contextual education inside the quote journey. |
| Indara garage / branch trust inside quote UX | Indara-specific | Use as contextual proof, not generic marketing. |

Thai competitor notes:

- Roojai: very strong direct online quote / buy flow, e-policy, app claims, no-contact instant quote, NCB up to 50%, dashcam discount, EV insurance, wall-charger add-on language, and large garage / service ecosystem. Roojai is the benchmark for digital execution, but no public evidence was found of the full `why this price + lower my price + claim-decision` integrated bundle.
- MrKumka: closest on instant private quote and no-contact flow; public journey is a fast quote / comparison pattern, not a visible price-explanation and live savings-console pattern.
- CheckDi: strong speed and breadth claim (~30s / many insurers), best-price guarantee, instalments, class education. Looks like a comparison engine, not an interactive advisor cockpit.
- Rabbit Care: strong broker / comparison proposition with savings, NCB, named-driver, instalment, and service messaging. Discounts are marketed clearly, but not found as a live NCB-led price-control flow.
- Gengmak: compares many insurers and uses LINE-style assistance, but asks phone/email before quote in the public form seen. Useful contrast for why lead capture after value matters.
- Thaivivat: real Thai UBI / pay-per-use competitor. This makes it especially important that Indara not imply true pay-as-you-drive unless Indara has a real insurer/telematics product.

Global near-match notes:

- Progressive Name Your Price / coverage calculator: closest global ancestor for price-control thinking. It validates budget/coverage adjustment as a product pattern, but it is not a neutral Thai motor advisor and does not cover the Indara bundle.
- The Zebra: quick estimate and "why we ask" style explanations; useful proof that explanation improves trust, but still closer to calculator/comparison than live savings cockpit.
- Jerry: closest strategic analogue as a broader car-ownership assistant, including insurance shopping and repair/maintenance adjacency. Validates the "ownership decision tool" direction behind the claim calculator, but is US-focused and not the Thai bilingual motor-insurance bundle.
- Lemonade / Maya: proves conversational insurance can work, but is carrier-led and not neutral Thai motor comparison.
- FWD Thailand + AiChat: proves conversational quote conversion in Thailand, but single-carrier / campaign-oriented, not a neutral car-insurance advisor.

Final product conclusion:

- The idea is differentiated as a bundle, not because every ingredient is novel.
- The safest public wording is not "first" or "only"; use language like "unlike typical quote forms" and "helps you understand and control your price before speaking to an advisor."
- The moat is not generic AI. The moat is execution quality, Thai bilingual localisation, the pricing-band data pipeline, Indara trust assets, and useful decision tools that keep helping after the first quote.
- Build order should remain disciplined: section 27 core flow first, then section 28.1 claim-decision calculator, then section 28.2 EV-aware branch. Do not overload the first MVP with the later policy-wallet / telematics ideas.

Primary URLs referenced in Codex scan:

- Roojai car insurance: `https://www.roojai.com/en/car-insurance/`
- Roojai EV insurance: `https://www.roojai.com/en/car-insurance/electric-vehicle/`
- MrKumka car insurance: `https://www.mrkumka.com/en/car-insurance/`
- CheckDi car insurance: `https://checkdi.com/th/car/main?lg=en`
- Rabbit Care car insurance: `https://rabbitcare.com/en/car-insurance`
- Gengmak car insurance quote: `https://gengmak.com/en/car-insurance-quote`
- Thaivivat motor insurance / Pay Per Use: `https://www.thaivivat.co.th/en/products_car.php`
- Progressive Name Your Price: `https://www.progressive.com/auto/discounts/name-your-price/`
- Progressive coverage calculator: `https://www.progressive.com/auto/insurance-coverages/calculator/`
- The Zebra: `https://www.thezebra.com/`
- Jerry: `https://jerry.ai/`
- Lemonade: `https://www.lemonade.com/`
- FWD Thailand + AiChat: `https://www.aichat.com/customer-success/fwd-thailand-insurance-chatbot`
- Motorist claim / NCB article: `https://www.motorist.co.th/en/article/4395/how-many-times-can-you-claim-car-insurance`


## 30. Premium-Factor Coverage: Savings vs Accuracy Controls (2026-06-23)

A competitive scan (Codex) re-checked Thai aggregators and insurers — Roojai,
MrKumka, Rabbit Care, CheckDi, Chubb, AXA, Thaivivat — for premium factors the
app does not yet expose. Claude and Codex converged on a decision framework.
This section records that framework and the resulting decisions. It does NOT
change the section 27 fast first-estimate flow; everything here is a
POST-ESTIMATE refinement layer.

### 30.1 Core principle: modifier layers vs band-key dimensions

The pricing band key is:
`vehicleGroup | yearBand | provinceRegion | coverageType | driverAgeBand | repairPref`

- **Modifier-layer factors** are cheap: a visible coefficient stacked on the base
  band, no new scraped data (today: driver age, NCB, dashcam, excess, mileage).
- **Band-key dimensions** are expensive: each new one multiplies the grid the
  scraper must populate (sections 10.1, 26).

Decision rule: **prefer modifier-layer additions over new band-key dimensions
unless the pricing benefit clearly justifies the scraper-grid cost.** Trim /
variant is the only band-key candidate on the list, and it is deferred.

Also note: the scraper (section 26) already models usage, claims, NCB, mileage,
license tenure, dashcam, and repair preference. So most "missing" factors are
**app-exposure gaps**, not data gaps — the app deliberately hid them to keep the
first flow light. The genuinely NEW data items are: **sum insured, trim/variant,
and named-driver plan.**

### 30.2 Two control groups: "Lower my price" vs "Sharpen this estimate"

The rail's post-estimate controls split by user intent — "I want it cheaper" vs
"I want it more accurate." This keeps the product from becoming a long quote form
(section 27.2 / 28 positioning) and makes each control's purpose obvious.

- **Lower my price (savings levers):** NCB / claim-free years, named-driver plan,
  dashcam, higher excess, mileage tier, repair preference.
- **Sharpen this estimate (accuracy levers):** province / registration area,
  insured value (sum insured), private-vs-commercial use, recent at-fault claims,
  vehicle trim / hybrid / EV detail (later).

Migration note: `province` moves from its current rail position into "Sharpen
this estimate" (it is an accuracy lever — it already promotes confidence). Repair
preference stays under "Lower my price" (a price/coverage choice, not accuracy).

### 30.3 Confidence becomes compositional

Today `confidence` derives from one thing — band-match quality (exact / partial /
segment). With a "Sharpen" panel that breaks: a vehicle can be an exact band match
yet still be low-confidence because usage is assumed private, sum insured is at
default, and trim is unknown.

Decision: **confidence = band-match quality COMBINED with how many accuracy levers
are still at assumed defaults.** Every defaulted dimension must state its
assumption and lower confidence — e.g. "Assumes private personal use," "balanced
insured value," "exact trim not set." This is what makes the Sharpen panel honest.
It is a real model change: confidence stops being a single enum off the band lookup.

### 30.4 Component decisions

| Factor | Type | Decision |
| --- | --- | --- |
| Named-driver plan | modifier | ADD (priority 1). Plan types: named only / any 30+ / any 25+ / any driver. |
| Sum insured | modifier + new ref data | ADD (priority 2). Bounded range around market value; see 30.5. |
| Usage / commercial / delivery | eligibility gate | ADD (priority 3). Not priced; routes to advisor; see 30.5. |
| Mileage | modifier | UPGRADE boolean -> tiers (priority 4); honest framing, see 30.5. |
| At-fault claims (last 12 mo) | modifier + eligibility | ADD (priority 5). Also feeds the "Should I claim?" tool (28.1). |
| Trim / variant / engine | band-key (expensive) | DEFER (priority 6). Optional modifier later, never new bands; see 30.5. |
| License tenure | modifier | LATER. Only relevant for age 18-24 or exact-quote requests. |
| Modifications | eligibility gate | LATER. Already a handoff trigger (section 11). |
| Optional benefit limits | plan content | LATER. Surface as included / optional / not-included on compare cards. |
| EV battery / charger pricing | modifier + confidence | LATER. Evolve the educational EV branch (28.2) into a price/confidence input. |

### 30.5 Specific guardrails

- **Sum insured** is NOT a free modifier: bands store premiums, not insured sums,
  so it needs a market-value / sum-insured reference per `vehicleGroup x yearBand`
  (modest new data). The control must be a **bounded range around market value**
  (e.g. -10% / balanced / +10%, with a sensible floor near typical ~80% market
  value), NOT a free slider toward zero. Frame as protection levels ("balanced
  insured value" / "higher protection" / "lower insured value, may reduce payout"),
  with an underinsurance warning. The guardrail is enforced by the control's RANGE,
  not only its copy.
- **Usage** is an eligibility gate, not a price knob. The first indicative price
  shows a visible assumption ("Assumes private personal use"). In "Sharpen," ask
  "Private use only?"; if no (Grab / delivery / hire / business), downgrade
  confidence and route to an advisor (section 11). Regression note: a usage
  question existed in the original 11-question flow and was dropped in the
  5-input-core trim, removing delivery/commercial detection — reinstating restores
  it on compliance grounds.
- **Trim / variant** is the only band-key candidate; do it later as an OPTIONAL
  modifier (e.g. hybrid +x%, performance/import +y%), never as new bands. Sum
  insured (30.4) absorbs PART of trim's effect (market value) but not all — parts
  cost, battery, repair complexity, import status, theft/claim patterns, and
  insurer eligibility still vary by trim. Do NOT let a "make it exact" step
  reintroduce the plate / registration-NUMBER lookup ruled out in section 27.5;
  "registration province" is fine, plate is not.
- **Mileage tiers** (e.g. <5,000 / 5,000-10,000 / 10,000-15,000 / >15,000 / not
  sure) replace the boolean, but keep the honest "low mileage may qualify for
  cheaper options" framing — do NOT imply pay-as-you-drive or telematics we do not
  have (section 28.3). Thaivivat / CheckDi pay-per-mile remain the benchmark a
  savvy user may compare against.
- **Named-driver** aligns with the OIC named-driver tariff phasing in (new cars
  from 1 June 2025, all cars from 1 January 2026; ties to the Aug 2025 two-factor
  system in section 27.6), giving a defensible discount coefficient.

### 30.6 Build priority (agreed Claude + Codex)

1. Named-driver plan — best ROI: cheap modifier, strong Thai lever, fits "Lower my price."
2. Sum insured control — biggest single-number lever; needs market-value ref + underinsurance guardrail.
3. Usage eligibility gate — correctness/compliance, not pricing.
4. Mileage tiers — upgrade the boolean; keep honest framing.
5. At-fault claims (last 12 months) — accuracy + powers the claim calculator.
6. Trim / variant — optional later refinement, not a band-key expansion.

### 30.7 Compliance note

Each precision step nudges the product from "indicative range" toward "looks like
a bindable quote" (section 14). Sum insured and named-driver change the number the
most, so they carry the most "did Indara quote me this?" risk. Keep the
advisor-confirms gate and indicative framing prominent as these are added.

### 30.8 Sources

MrKumka (car, Type 1), Roojai (car, Type 3+, FAQ), Rabbit Care, CheckDi
(pay-per-mile), Thaivivat, Chubb (sum-insured / Type 1 premium), AXA (Type 1).
