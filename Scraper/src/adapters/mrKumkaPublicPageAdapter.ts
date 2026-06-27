import * as cheerio from "cheerio";
import type { RawQuote, SiteAdapter } from "../types.js";
import { createQuoteId } from "../utils/ids.js";
import { normalizeCoverageType } from "../utils/normalize.js";

const URL = "https://www.mrkumka.com/en/car-insurance/";

export class MrKumkaPublicPageAdapter implements SiteAdapter {
  readonly site = "mrkumka";
  readonly sourceMethod = "public_page" as const;

  async collect(runId: string): Promise<RawQuote[]> {
    const response = await fetch(URL, {
      headers: {
        "user-agent": "TNI/0.1 public-page calibration contact=TNI",
      },
    });
    if (!response.ok) {
      throw new Error(`MrKumka public page returned ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const text = $("body").text().replace(/\s+/g, " ");
    const matches = Array.from(
      text.matchAll(/Car Insurance Type\s*(1|2\+|3\+|2|3)\s*Starting from THB\s*([\d,]+(?:\.\d+)?)\s*\/\s*month/gi),
    );
    const scrapedAt = new Date().toISOString();

    return matches.flatMap((match): RawQuote[] => {
      const coverageType = normalizeCoverageType(match[1]);
      if (!coverageType) return [];
      const monthly = Number(match[2].replace(/,/g, ""));
      const tenMonthInstallmentEstimate = monthly * 10;

      return [
        {
          id: createQuoteId(this.site),
          runId,
          site: this.site,
          sourceMethod: this.sourceMethod,
          scrapedAt,
          input: {
            vehicleGroup: "market_public",
            yearBand: "all",
            provinceRegion: "thailand",
            requestedCoverageType: coverageType,
            driverAgeBand: "all",
            repairPref: "any",
            defaultsUsed: {
              source_url: URL,
              public_page_only: true,
              note: "Public starting price; not vehicle-specific.",
            },
          },
          premiumThb: tenMonthInstallmentEstimate,
          premiumBasis: "ten_month_installment",
          coverageType,
          requestedCoverageType: coverageType,
          extractionMethod: "public_page",
          rawPayload: {
            matchedText: match[0],
            monthlyPremiumThb: monthly,
            annualizedAsTenInstallmentsThb: tenMonthInstallmentEstimate,
            sourceUrl: URL,
          },
          parseOk: true,
          notes: "Public starting price only. Use for market calibration, not customer-specific quotes.",
        },
      ];
    });
  }
}
