// Backwards-compatible entry point. The deterministic quote logic now lives in
// ./pricing.ts (base band x explainable modifier layers). Re-exported here so
// existing imports keep working.
export {
  computeQuote,
  headlineQuote,
  recommendPlans,
  headlineCoverage,
  headlineRepair,
  headlinePlanId,
  evaluateClaim,
  NCB_PCT,
  type ClaimInputs,
  type ClaimResult,
} from './pricing'
