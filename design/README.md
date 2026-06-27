# Design mockups — Indara Advisor (customer web app)

Static, browsable design artifacts for the customer-facing quote advisor. These are
visual references for the section 27 flow in
[`memory/indara-ai-project-memory.md`](../memory/indara-ai-project-memory.md); they are
**not** wired to the quote engine and all numbers are illustrative placeholders.

## Files

- `indara-advisor-mockup.html` — the **chosen design direction** (the "A + C hybrid"):
  conversational advisor (A) with a guided stepper and a persistent live-price rail (C).
  Shows the desktop two-pane layout and the narrow-width (mobile) reflow on one page.
  Open it directly in a browser.

## Chosen direction: "Advisor + live price rail" (A + C hybrid)

Three directions were mocked and compared:

- **A — "The Advisor"**: conversational two-pane (chat + results), messaging-app warmth.
- **B — "The Price Cockpit"**: price front-and-centre, calculator energy.
- **C — "Guided"**: stepper + sticky live-price rail, structured and trust-signalling.

We chose an **A + C hybrid**:

- Chat advisor (A) drives the 3-tap intake in the left pane — reuses the existing
  `ChatPanel` / `ResultsPanel` two-pane shell, so low build delta.
- A guided stepper (C) runs across the top (`Car -> Cover -> Driver -> Tune price`) so
  progress and the "3 taps" promise are visible, and step 4 "Tune price" signals where
  savings happen.
- A persistent live-price rail (C) fills the right pane from the first answer and visibly
  recalculates — carrying the estimate + confidence, the "Why this price?" breakdown, and
  the NCB-led "Lower my price" console (A's price-control emphasis).

Why this combo: the stepper fixes pure-chat's hidden-progress weakness; the always-on,
reacting price keeps the experience reading as a *price tool with an advisor* (not an "AI
chatbot", per the section 27.2 / section 29 positioning); and it stays inside the existing
component structure.

Mobile/narrow reflow: stacks to chat-on-top with the price rail collapsing into a sticky
bottom bar (current estimate + "why / lower" expander) so the live number stays visible
while the chat scrolls.

Not chosen: B as a standalone (too transactional, drops the advisory/education layer) and
C as a standalone (reads like a polished aggregator form). B's market-position bar is
parked as an optional later enhancement to the rail.
