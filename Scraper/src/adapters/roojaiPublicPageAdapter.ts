import * as cheerio from "cheerio";
import type { RawQuote, SiteAdapter } from "../types.js";

const URL = "https://www.roojai.com/en/car-insurance/";

export class RoojaiPublicPageAdapter implements SiteAdapter {
  readonly site = "roojai";
  readonly sourceMethod = "public_page" as const;

  async collect(_runId: string): Promise<RawQuote[]> {
    const response = await fetch(URL, {
      headers: {
        "user-agent": "TNI/0.1 public-page calibration contact=TNI",
      },
    });
    if (!response.ok) {
      throw new Error(`Roojai public page returned ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const text = $("body").text().replace(/\s+/g, " ");
    const hasQuoteInputs =
      /Make,\s*model,\s*year,\s*current mileage/i.test(text) &&
      /driver'?s license number,\s*and driving history/i.test(text);

    if (!hasQuoteInputs) {
      throw new Error("Roojai public page loaded, but expected quote-input text was not found.");
    }

    // Roojai's public page describes required inputs and broad factors, but it does not expose
    // vehicle-specific public premiums suitable for banding. Keep this adapter as a health check
    // and future parsing hook rather than manufacturing a quote from non-specific marketing copy.
    return [];
  }
}

