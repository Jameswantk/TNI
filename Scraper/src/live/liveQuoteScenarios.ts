import type { LiveQuoteScenario } from "../types.js";
import { generateLiveQuoteScenarios } from "../grid/gridGenerator.js";

export function defaultLiveQuoteScenarios(): LiveQuoteScenario[] {
  return generateLiveQuoteScenarios();
}
