import type { SiteAdapter } from "../types.js";
import { defaultLiveQuoteScenarios } from "../live/liveQuoteScenarios.js";
import { MrKumkaLiveQuoteFlowAdapter } from "./mrKumkaLiveQuoteFlowAdapter.js";
import { MrKumkaPublicPageAdapter } from "./mrKumkaPublicPageAdapter.js";
import { RoojaiLiveQuoteFlowAdapter } from "./roojaiLiveQuoteFlowAdapter.js";
import { RoojaiPublicPageAdapter } from "./roojaiPublicPageAdapter.js";

export function publicPageAdapters(): SiteAdapter[] {
  return [new MrKumkaPublicPageAdapter(), new RoojaiPublicPageAdapter()];
}

export function liveQuoteFlowAdapters(): SiteAdapter[] {
  const scenarios = filterScenarios(defaultLiveQuoteScenarios());
  return filterSites([new MrKumkaLiveQuoteFlowAdapter(scenarios), new RoojaiLiveQuoteFlowAdapter(scenarios)]);
}

function filterScenarios(scenarios: ReturnType<typeof defaultLiveQuoteScenarios>) {
  const requested = parseCsvEnv("LIVE_FORM_SCENARIOS");
  if (requested.length === 0) return scenarios;

  return scenarios.filter((scenario) => {
    const searchable = [
      scenario.input.vehicleGroup,
      scenario.brand,
      scenario.model,
      `${scenario.brand}_${scenario.model}`.replace(/\W+/g, "_").toLowerCase(),
    ].map((value) => value.toLowerCase());
    return requested.some((needle) => searchable.includes(needle));
  });
}

function filterSites(adapters: SiteAdapter[]): SiteAdapter[] {
  const requested = parseCsvEnv("LIVE_FORM_SITES");
  if (requested.length === 0) return adapters;
  return adapters.filter((adapter) => requested.includes(adapter.site.toLowerCase()));
}

function parseCsvEnv(name: string): string[] {
  return (process.env[name] ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

