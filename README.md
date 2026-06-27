# TNI AI Insurance Advisor

Documentation repository for the TNI AI chatbox MVP.

## Documents

- [MVP Scope and Business Requirements](docs/mvp-scope-business-requirements.md)
- [LLM Project Memory](memory/TNI-ai-project-memory.md)
- [Price Scraper Worker](Scraper/README.md)

## Current Product Direction

TNI wants a mobile-first AI insurance advisor that feels like a human expert inside a messaging app. The MVP should stay narrow: guide a customer through the minimum car-insurance quote-range questions, show indicative plan recommendations, and create a qualified lead for a human advisor.

The MVP does not include online payment, final policy issuance, claims handling, or a fully autonomous regulated sales process.

## Implementation Areas

- `Scraper/`: offline pricing-band worker for manual imports, public-page calibration, future approved data sources, and quote-band aggregation.
