# TNI AI Insurance Advisor MVP

## 1. Executive Summary

TNI wants to build an all-in-one AI chatbox experience for car insurance. The intended experience is similar in commercial purpose to Thai online insurance aggregators such as Roojai, MrKumka, Rabbit Care, and CheckDi, but with a more interactive, conversational, and engaging user journey. Instead of starting with a long form, the customer should feel like they are speaking with a helpful insurance expert inside a messaging app such as LINE.

The recommended MVP is intentionally narrow. It should help a customer answer the minimum questions needed to generate an indicative car-insurance quote range, present 2-3 recommended plan options, and capture a qualified lead for TNI's human advisor team. The MVP should not attempt to complete full online purchase, payment, binding coverage, claims handling, or final policy issuance.

The core business value is lead quality and conversion. The AI should reduce user friction, educate customers in plain language, and prepare a clean handoff to a licensed human advisor who can confirm the final quote and close the sale.

## 2. Product Vision

Create a mobile-first AI insurance advisor that:

- Feels like chatting with a human insurance expert.
- Helps users understand car insurance without needing to know insurance terminology.
- Collects quote inputs one step at a time.
- Shows indicative quote ranges and plan recommendations.
- Explains why each plan is suitable.
- Captures high-intent leads after value has been shown.
- Gives TNI's sales team a complete customer summary and transcript.

Positioning:

> "An AI-powered digital insurance advisor for TNI that guides customers through car insurance selection, recommends suitable plans, explains tradeoffs in plain language, and hands off smoothly to human advisors when needed."

## 3. Market Context

Public online insurance experiences generally follow this pattern:

- Roojai emphasizes quick personalized online quotes by entering car and driver details, then choosing coverage.
- MrKumka describes a quote journey based on car details, main driver details, driving history, mileage, claim history, and no-claims discount.
- Rabbit Care and CheckDi emphasize comparing plans from multiple insurers and choosing coverage based on price, type, and benefits.
- UK and US aggregators such as MoneySuperMarket, Confused.com, Compare the Market, and Insurify commonly ask for vehicle details, driver information, driving history, claims history, annual mileage, coverage preferences, and contact details.

TNI's opportunity is not simply to duplicate a comparison form. The opportunity is to keep the quote engine discipline underneath while making the user experience conversational, friendly, and low-friction.

Reference sources:

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

## 4. MVP Goal

The MVP should complete one primary job:

> Help a customer chat naturally with TNI, answer the minimum car-insurance questions, receive indicative quote-range recommendations, and submit a qualified lead to a human advisor.

Success means the customer reaches a useful recommendation without feeling they completed a long form, and TNI receives a lead that is materially better than a generic name and phone number.

## 5. Target Users

### 5.1 End Customer

Likely profile:

- Wants car insurance or is approaching renewal.
- May not know the difference between Type 1, Type 2+, Type 3+, and Type 3.
- May know their car brand and approximate year, but not exact sub-model.
- May prefer LINE-style chat over a form.
- Wants fast price guidance before sharing contact details.
- Needs confidence that a human advisor will confirm the final details.

### 5.2 TNI Sales Advisor

Needs:

- Qualified leads with car, coverage, and contact context.
- Clear indication of what the customer wants.
- Transcript and AI summary.
- Ability to prioritize hot leads.
- Simple lead statuses.

### 5.3 TNI Admin / Management

Needs:

- Visibility into lead volume and conversion.
- Control over indicative pricing bands and approved content.
- Basic analytics on drop-off and plan interest.
- Assurance that AI responses stay within approved boundaries.

## 6. MVP Scope Overview

In scope:

- Mobile-first AI chat UI.
- Thai and English language support.
- Guided quote intake for car insurance only.
- Indicative quote-range logic.
- 2-3 recommended plan cards.
- Simple plan comparison.
- Lead capture after plan recommendations.
- Human advisor handoff.
- Admin lead dashboard.
- Basic product/pricing content admin.
- Basic analytics.
- AI guardrails, consent logging, and transcript storage.

Out of scope:

- Online payment.
- Policy issuance.
- Binding final quotes.
- Claims handling.
- OCR document extraction.
- Voice chat.
- User accounts.
- Renewal automation.
- Complex CRM automation.
- Full multi-product insurance marketplace.
- Fully autonomous regulated insurance advice.
- Real-time insurer API integration unless TNI already has the APIs and wants to include them as a specific build dependency.

## 7. Customer-Facing Features

### 7.1 AI Chat Experience

The customer should begin directly in a chat-first experience. There should not be a traditional landing page before the quote journey unless required for campaign routing.

Requirements:

- Mobile-first responsive chat interface.
- TNI-branded AI advisor persona.
- Online/status indicator.
- Thai / English toggle.
- Free-text input.
- Quick-reply chips for common answers.
- One question at a time.
- "Not sure" option for hard questions.
- "Skip for now" on non-critical fields.
- Ability to correct previous answers.
- Friendly but professional tone.

Example opening:

> Hi, I am TNI's AI insurance advisor. I can help estimate your car insurance options first. No phone number needed yet. What car do you drive?

### 7.2 Guided Quote Intake

The AI should collect only the minimum data needed for an indicative quote range.

Required intake fields:

- Car brand.
- Car model.
- Car year or approximate vehicle age.
- Province or main driving location.
- Desired coverage style:
  - Best protection.
  - Good value.
  - Cheapest acceptable.
  - Not sure, recommend for me.
- Insurance type mapping:
  - Type 1.
  - Type 2+.
  - Type 3+.
  - Type 3.
- Main driver age range.
- Usage type:
  - Personal.
  - Commute.
  - Business.
  - Delivery.
- Approximate annual mileage.
- Recent claims:
  - No.
  - Yes.
  - Not sure.
- Repair preference:
  - Dealer repair.
  - Garage repair.
  - Not sure.
- Current insurance expiry or renewal timing.

Recommended order:

1. Car brand.
2. Car model.
3. Car year or approximate age.
4. Province or main driving location.
5. Desired protection style.
6. Driver age range.
7. Usage type.
8. Approximate mileage.
9. Recent claims.
10. Repair preference.
11. Renewal timing.

The flow should ask lower-friction questions first and avoid asking for license plate, national ID, address, chassis number, or detailed accident facts before value is shown.

### 7.3 Smart Clarification

The AI should handle incomplete or approximate answers gracefully.

Examples:

- If the user says "Toyota", ask for model.
- If the user says "Vios maybe 2020", accept and confirm.
- If the user does not know the exact year, ask for approximate age.
- If the user does not know coverage type, ask plain-language preference.
- If the user asks what Type 1 means, give a short approved explanation.

Requirements:

- Accept approximate inputs.
- Avoid repeated interrogation.
- Ask one follow-up at a time.
- Do not block the user for non-critical missing fields.
- Confirm uncertain details before showing recommendations.

### 7.4 Quote Summary Before Recommendations

Before displaying plan cards, the AI should show a concise summary and allow edits.

Example:

> Here is what I have so far:
>
> - Toyota Vios, around 2021
> - Bangkok
> - Personal / commute use
> - Driver age: 25-35
> - Looking for: good value
> - Recent claims: no
> - Repair preference: garage or not sure
>
> Shall I show estimated options?

Actions:

- Show my options.
- Edit details.

### 7.5 Indicative Quote Range

The MVP should show estimated premium ranges, not final guaranteed prices.

Requirements:

- Label all prices as indicative.
- Show yearly premium ranges in THB.
- Explain that final price depends on insurer verification.
- State that coverage, exclusions, and policy wording must be confirmed before purchase.
- Use deterministic quote-band logic rather than asking the LLM to invent prices.

Indicative pricing can initially be based on:

- Vehicle brand/model/year or vehicle group.
- Vehicle age band.
- Province/location.
- Coverage type.
- Driver age band.
- Usage type.
- Annual mileage band.
- Claims history.
- Repair preference.

### 7.6 Recommended Plan Cards

The system should show 2-3 recommended options.

Recommended default cards:

- Best Budget.
- Best Value.
- Strongest Coverage.

Each card should include:

- Recommendation label.
- Coverage type.
- Repair type.
- Estimated yearly premium range.
- Key benefit chips.
- Deductible/excess note if applicable.
- Installment availability.
- "Why this plan?" expandable explanation.
- CTA buttons:
  - View details.
  - Compare.
  - I am interested.

Example card:

```text
Best Value
Type 1 - Garage repair
Estimated: THB 13,000 - 17,000 / year

Good for: stronger protection without dealer-repair pricing
Benefits: Own damage, theft/fire, third-party liability, optional flood

[Why this plan?] [Compare] [I am interested]
```

### 7.7 Why This Plan Explanation

The plan explanation should be short and grounded in collected facts.

Example:

> Why TNI recommends this:
>
> - Your car is still suitable for stronger coverage.
> - You said you wanted good value, not only the cheapest price.
> - Garage repair can keep the premium lower than dealer repair.
> - No recent claims may help keep the quote competitive.

The AI must not invent insurer-specific terms that are not in the approved product content.

### 7.8 Plan Comparison

The comparison view should be simple and limited to high-value fields.

Comparison fields:

- Estimated premium range.
- Insurance type.
- Own-damage coverage.
- Theft/fire coverage.
- Flood/natural disaster coverage.
- Repair type.
- Roadside assistance.
- Installment availability.
- Best-for label.

The comparison should avoid dense policy tables in the MVP.

### 7.9 Lead Capture

Lead capture should happen after the customer sees useful plan options.

Required fields:

- Name.
- Phone number.
- LINE ID, optional.
- Preferred language.
- Preferred callback time.
- Consent to be contacted.

Lead capture copy:

> I can have an TNI advisor check the exact price for you. Your estimate may change after insurer verification. An advisor will confirm final price and coverage before you decide.

Actions:

- Request exact quote.
- Talk to human advisor.

### 7.10 Human Advisor Handoff

The product should include a clear handoff path.

Manual handoff trigger:

- User clicks "Talk to human advisor."
- User clicks "I am interested."
- User submits lead capture form.

Automatic handoff trigger:

- User asks to buy.
- User asks for final price.
- User has complex claims history.
- Vehicle details are unclear.
- Vehicle is modified.
- Usage is delivery/commercial and needs special handling.
- AI confidence is low.
- User asks a policy/legal/compliance question outside approved FAQ.

Handoff payload:

- Customer contact details.
- Vehicle details.
- Quote intake answers.
- Recommended plans.
- Selected plan, if any.
- AI-generated conversation summary.
- Full transcript.
- Consent timestamp.

### 7.11 Confirmation Screen

After lead submission, the customer should receive:

- Confirmation that the request was sent.
- Reference number.
- Expected callback window.
- Summary of submitted details.
- Option to start another quote.

Example:

> Done. Your request has been sent to TNI.
>
> Reference: IND-24891
>
> An advisor will contact you today between 2:00 PM and 4:00 PM.

## 8. Admin Features

### 8.1 Lead Dashboard

TNI staff should have a simple internal dashboard.

Capabilities:

- View all submitted leads.
- Search leads.
- Filter by status.
- Filter by callback time.
- Filter by recommendation type.
- View customer details.
- View vehicle details.
- View recommended and selected plan.
- View indicative quote range.
- View AI summary.
- View full transcript.
- Update status.

Lead statuses:

- New.
- Contacted.
- Quoted.
- Won.
- Lost.

Recommended lead fields:

- Lead ID.
- Created timestamp.
- Customer name.
- Phone.
- LINE ID.
- Preferred language.
- Preferred callback time.
- Car brand.
- Car model.
- Car year/age.
- Province.
- Coverage preference.
- Insurance type recommendation.
- Driver age band.
- Usage type.
- Mileage band.
- Claims history.
- Repair preference.
- Renewal timing.
- Recommended plan label.
- Estimated quote range.
- Lead status.
- Assigned owner.
- Consent timestamp.

### 8.2 Product And Content Admin

The MVP should include basic admin control for:

- Indicative quote bands.
- Coverage descriptions.
- FAQ answers.
- Plan card templates.
- Benefit labels.
- Disclaimers.
- Escalation rules.

This prevents the LLM from becoming the source of truth for insurance content.

### 8.3 Basic Analytics

Track:

- Conversations started.
- Quote flows completed.
- Leads submitted.
- Lead conversion rate.
- Drop-off question.
- Most selected coverage preference.
- Most recommended plan type.
- Human handoff count.
- Language selected.
- Average time to recommendation.

## 9. AI Requirements

### 9.1 AI Role

The AI should act as a conversational guide and information collector, not as an autonomous policy seller.

Allowed:

- Ask guided quote questions.
- Explain basic coverage concepts using approved content.
- Summarize user answers.
- Recommend plan categories based on deterministic quote logic.
- Explain why a plan category may fit.
- Escalate to a human advisor.

Not allowed:

- Invent premiums.
- Promise final coverage.
- Give binding insurance advice.
- Make final underwriting decisions.
- Say a policy is guaranteed.
- Hide uncertainty.
- Answer outside approved content when the question has regulatory or legal sensitivity.

### 9.2 Guardrail Rules

Rules:

- All quote ranges must come from structured pricing/rules data.
- AI must label estimates as indicative.
- AI must use approved coverage descriptions.
- AI must trigger handoff for uncertain or complex cases.
- AI should not request high-friction sensitive identifiers before value is shown.
- AI should not ask for national ID, address, chassis number, or detailed accident facts during the initial MVP quote-range journey unless TNI explicitly approves that step.

### 9.3 Conversation Tone

Tone:

- Friendly.
- Plain language.
- Confident but not pushy.
- Helpful like a human insurance advisor.
- Short messages.
- Avoid dense legal explanations unless the user asks.

## 10. Compliance And Privacy Requirements

The MVP must be designed conservatively.

Requirements:

- Show privacy notice link.
- Capture contact consent.
- Store consent timestamp.
- Store transcript and lead payload.
- Label quote ranges as indicative.
- Make clear that a human advisor or insurer verification is needed for exact pricing and final coverage.
- Use approved product descriptions only.
- Maintain audit logs for key events.
- Allow admin review of conversations.

Thailand online insurance sales may involve OIC requirements around approved policy wording, disclosure, intermediaries, and electronic sales processes. TNI should have legal/compliance review before launch, especially if the product moves beyond lead capture into purchase, payment, or binding policy issuance.

## 11. Data Model

### 11.1 Conversation Session

- Session ID.
- Created timestamp.
- Last updated timestamp.
- Language.
- Source channel.
- Current step.
- Completion status.
- AI confidence indicator.

### 11.2 Quote Intake

- Brand.
- Model.
- Year.
- Approximate age.
- Province.
- Coverage preference.
- Insurance type preference.
- Driver age band.
- Usage type.
- Mileage band.
- Claims history.
- Repair preference.
- Renewal timing.
- Missing fields.
- User uncertainty flags.

### 11.3 Recommendation

- Recommendation ID.
- Plan label.
- Coverage type.
- Repair type.
- Estimated minimum premium.
- Estimated maximum premium.
- Benefits.
- Deductible/excess note.
- Installment availability.
- Explanation bullets.
- Confidence.

### 11.4 Lead

- Lead ID.
- Session ID.
- Customer name.
- Phone.
- LINE ID.
- Preferred language.
- Preferred callback time.
- Consent accepted.
- Consent timestamp.
- Selected plan.
- Lead status.
- Assigned owner.
- Advisor notes.

### 11.5 Transcript

- Message ID.
- Session ID.
- Sender type.
- Message text.
- Timestamp.
- Extracted fields.
- Escalation markers.

## 12. Non-Functional Requirements

Performance:

- Chat response should feel near real-time.
- Plan recommendations should load within a few seconds.

Reliability:

- Lead submission must not silently fail.
- Failed lead submission should show retry or human contact fallback.

Security:

- Admin dashboard requires authentication.
- Lead data should be protected.
- Consent and transcript data should be stored securely.

Maintainability:

- Pricing bands and approved content should be editable without code changes where possible.
- AI prompts and guardrails should be versioned.
- Conversation flow should be configurable enough for future insurance products.

Accessibility:

- Mobile-first.
- Clear text contrast.
- Buttons large enough for touch.
- Avoid relying only on color.

## 13. MVP User Journey

1. Customer opens TNI AI Advisor.
2. Customer selects language or continues with detected/default language.
3. AI asks for car brand.
4. AI asks for model and year/age.
5. AI asks location and coverage preference.
6. AI asks driver/usage/claims/repair questions.
7. AI summarizes the collected details.
8. Customer confirms or edits details.
9. System shows 2-3 indicative recommendations.
10. Customer views details or compares plans.
11. Customer selects "I am interested" or "Talk to human advisor."
12. Customer enters contact details and consent.
13. Lead is created in admin dashboard.
14. Customer sees confirmation and reference number.
15. Human advisor follows up with exact quote.

## 14. UX Requirements

Design principles:

- Chat is the primary interface.
- Plan cards appear when the user has provided enough information.
- Avoid making the customer feel they are completing a long form.
- Ask the easiest questions first.
- Delay contact capture until after recommendations.
- Keep plan comparison readable.
- Use plain-language coverage labels before insurance jargon.

Suggested screen structure:

- Chat header: TNI Advisor, online status, language toggle.
- Chat body: messages and quick replies.
- Quote progress indicator: subtle, e.g. "Estimate progress: 7 / 10."
- Input bar: free text plus send button.
- Plan results: card stack or side panel depending on screen size.
- Admin: dense operational table, not a marketing layout.

## 15. Acceptance Criteria

The MVP is acceptable when:

- A user can complete a full quote-range conversation on mobile.
- The flow collects the required quote intake fields.
- The system can handle "not sure" answers without breaking.
- The system shows a summary before recommendations.
- The system shows 2-3 recommendation cards with indicative ranges.
- The system can compare recommended plans.
- The user can submit contact details and consent.
- A lead appears in the admin dashboard with full context.
- The transcript is stored and visible to staff.
- AI does not invent final prices or unapproved policy terms.
- Admin can update basic content and quote bands.
- Basic analytics events are captured.

## 16. Implementation Phases

### Phase 1: Discovery And UX Definition, 2-3 Weeks

Deliverables:

- Final quote question set.
- Approved coverage descriptions.
- Indicative quote-band structure.
- Conversation script.
- UX wireframes.
- Admin data model.
- Compliance review checklist.

### Phase 2: MVP Build, 6-8 Weeks

Deliverables:

- Customer chat UI.
- Quote intake flow.
- AI orchestration and guardrails.
- Indicative quote recommendation logic.
- Plan cards and comparison.
- Lead capture.
- Admin lead dashboard.
- Transcript storage.
- Basic analytics.

### Phase 3: QA And Launch Prep, 2-3 Weeks

Deliverables:

- Test scripts.
- Content review.
- Compliance review.
- Sales advisor training.
- Production deployment.
- Launch monitoring.

Total production MVP estimate: 10-14 weeks.

A clickable demo could be built in 3-4 weeks, but it should not be treated as production-ready unless it includes guardrails, lead capture, data storage, and admin review.

## 17. Risks And Mitigations

Risk: AI invents policy details.
Mitigation: Use approved content library and deterministic quote tools.

Risk: User thinks indicative price is final.
Mitigation: Clear labels and repeated final-verification messaging.

Risk: Too many questions reduce completion.
Mitigation: Ask only minimum fields and delay sensitive details.

Risk: Human team receives low-quality leads.
Mitigation: Require quote summary and coverage intent before lead creation.

Risk: Compliance concerns around online insurance sales.
Mitigation: Keep MVP as lead capture and advisor handoff, not final sale or policy issuance.

Risk: Quote bands are too inaccurate.
Mitigation: Start with conservative ranges and improve with sales outcomes.

## 18. Open Questions

- Which exact TNI products and insurer partners should appear in the MVP?
- Does TNI want real insurer names in the MVP or generic plan categories first?
- What historical quote data can be used to create indicative ranges?
- Does TNI require Thai-only, English-only, or bilingual launch?
- Should LINE OA be included in MVP launch or treated as phase 2?
- Who reviews and approves insurance wording?
- What CRM or lead management system does TNI currently use?
- What is the required callback SLA?
- Should customers be able to upload documents in MVP, or only after advisor contact?

## 19. Recommended MVP Boundary

The MVP should be polished enough to demo and use with real leads, but narrow enough to ship safely:

- Car insurance only.
- Quote range only.
- No final policy sale.
- No payment.
- No document upload unless explicitly required.
- AI-guided intake plus human close.

This keeps the project commercially useful while avoiding the operational and compliance burden of full online policy issuance.
