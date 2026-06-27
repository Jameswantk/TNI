// ============================================================================
// SAMPLE PRICING-BAND SEEDER
// ----------------------------------------------------------------------------
// Generates a realistic, internally-consistent demo dataset in the EXACT shape
// the production Scraper worker emits (Scraper/src/types.ts -> PricingBand) and
// writes it to src/data/pricingBands.json. This is a DEMO seed only — every
// number is synthetic, built from published Thai motor-rating factor magnitudes
// (region, driver age, coverage class, repair channel, vehicle value/year), not
// from any insurer's real rate tables.
//
// Run:  node scripts/seedPricingBands.mjs
//
// In production this file is replaced by the real scraper output; the app reads
// it the same way either way (see src/data/pricingData.ts).
// ============================================================================

import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../src/data/pricingBands.json')
const SCRAPED_AT = '2026-06-22T03:00:00.000Z'

// --- Vehicle groups: base = type_1 / garage / Bangkok / age 25-35 / 2020-2024
// median annual premium (THB). Magnitudes reflect the segment (eco-car < sedan
// < SUV/pickup < EV) and typical sum-insured for a ~2-4 yr old car.
const VEHICLES = [
  { group: 'toyota_vios', base: 15000, conf: 'high' },
  { group: 'toyota_yaris', base: 14500, conf: 'high' },
  { group: 'toyota_corolla_altis', base: 17500, conf: 'high' },
  { group: 'toyota_fortuner', base: 24000, conf: 'high' },
  { group: 'toyota_hilux_revo', base: 20000, conf: 'high' },
  { group: 'honda_city', base: 15800, conf: 'high' },
  { group: 'honda_civic', base: 19000, conf: 'high' },
  { group: 'honda_crv', base: 23000, conf: 'high' },
  { group: 'honda_jazz', base: 14500, conf: 'medium' },
  { group: 'isuzu_dmax', base: 18500, conf: 'high' },
  { group: 'isuzu_mux', base: 22000, conf: 'medium' },
  { group: 'mitsubishi_triton', base: 18000, conf: 'medium' },
  { group: 'mitsubishi_xpander', base: 16000, conf: 'medium' },
  { group: 'mazda_2', base: 14000, conf: 'high' },
  { group: 'nissan_almera', base: 13500, conf: 'medium' },
  { group: 'ford_ranger', base: 21000, conf: 'high' },
  { group: 'mg_zs', base: 16000, conf: 'medium' },
  { group: 'byd_atto3', base: 26000, conf: 'medium', ev: true },
]

// --- Rating multipliers (all relative to the base scenario above) -------------
const COVERAGE = {
  type_1: 1.0, // comprehensive
  type_2_plus: 0.62, // own theft/fire + 3rd party + collision w/ known party
  type_3_plus: 0.48, // 3rd party + limited own collision
  type_3: 0.28, // 3rd party only
}

// Dealer (ศูนย์) repair carries a meaningful premium over garage (อู่).
const REPAIR = { garage: 1.0, dealer: 1.22 }

// Newer car => higher sum insured => higher premium.
const YEAR = { '2020_2024': 1.0, '2015_2019': 0.82 }

// Region: Bangkok highest (density, theft, claims frequency); regions lower.
const REGION = { bangkok: 1.0, central: 0.93, south: 0.9, north: 0.88, northeast: 0.86 }

// Driver age: young-driver loading; lowest risk in middle age.
const AGE = { '18_24': 1.18, '25_35': 1.0, '36_50': 0.92, '50_99': 0.97 }

const PROVINCES = Object.keys(REGION)
const AGES = Object.keys(AGE)
const YEARS = Object.keys(YEAR)

const SITES = ['roojai', 'mrkumka', 'directasia', 'silkspan', '724', 'gettgo']

// Deterministic small hash so sampleCount/source mix is stable across runs.
function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0)
}

function round100(n) {
  return Math.round(n / 100) * 100
}

function sourcesFor(key, n) {
  const start = hash(key) % SITES.length
  const out = []
  for (let i = 0; i < n; i++) out.push(SITES[(start + i) % SITES.length])
  return out
}

function confidenceFor(vehConf, province, year) {
  let c = vehConf
  if (province !== 'bangkok' && c === 'high') c = 'medium'
  if (year === '2015_2019' && c === 'medium') c = 'low'
  return c
}

function sampleCountFor(conf, key) {
  const jitter = hash(key) % 4
  if (conf === 'high') return 9 + jitter
  if (conf === 'medium') return 4 + jitter
  return 1 + (hash(key) % 3)
}

// type_3 / type_3_plus are garage-only in this demo (dealer repair only really
// differentiates comprehensive cover). type_1 / type_2_plus get both channels.
function repairsFor(coverage) {
  return coverage === 'type_1' || coverage === 'type_2_plus' ? ['garage', 'dealer'] : ['garage']
}

const bands = []

for (const veh of VEHICLES) {
  for (const year of YEARS) {
    for (const province of PROVINCES) {
      for (const age of AGES) {
        for (const coverage of Object.keys(COVERAGE)) {
          for (const repair of repairsFor(coverage)) {
            const median = round100(
              veh.base *
                COVERAGE[coverage] *
                REPAIR[repair] *
                YEAR[year] *
                REGION[province] *
                AGE[age],
            )
            const min = round100(median * 0.85)
            const max = round100(median * 1.18)
            const bandKey = `${veh.group}|${year}|${province}|${coverage}|${age}|${repair}`
            const conf = confidenceFor(veh.conf, province, year)
            const sampleCount = sampleCountFor(conf, bandKey)
            bands.push({
              bandKey,
              vehicleGroup: veh.group,
              yearBand: year,
              provinceRegion: province,
              coverageType: coverage,
              driverAgeBand: age,
              repairPref: repair,
              premiumMin: min,
              premiumMax: max,
              premiumMedian: median,
              sampleCount,
              sourceSites: sourcesFor(bandKey, conf === 'high' ? 3 : 2),
              confidence: conf,
              confidenceReason:
                conf === 'high'
                  ? 'Multiple quotes agree across sources'
                  : conf === 'medium'
                    ? 'Limited samples; range widened'
                    : 'Sparse data for this segment',
              lastScrapedAt: SCRAPED_AT,
              manualOverride: false,
              ...(veh.ev ? { overrideNote: 'EV — battery/charger cover per OIC 47/2566' } : {}),
            })
          }
        }
      }
    }
  }
}

// --- Segment defaults: national fallback per coverage (engine rung 3) ---------
const DEFAULT_BASE = 16000 // representative national type_1 median
for (const coverage of Object.keys(COVERAGE)) {
  const median = round100(DEFAULT_BASE * COVERAGE[coverage])
  const bandKey = `default|2020_2024|any|${coverage}|25_35|any`
  bands.push({
    bandKey,
    vehicleGroup: 'default',
    yearBand: '2020_2024',
    provinceRegion: 'any',
    coverageType: coverage,
    driverAgeBand: '25_35',
    repairPref: 'any',
    premiumMin: round100(median * 0.82),
    premiumMax: round100(median * 1.22),
    premiumMedian: median,
    sampleCount: 0,
    sourceSites: ['segment_default'],
    confidence: 'low',
    confidenceReason: 'Segment default — no exact band for this vehicle yet',
    lastScrapedAt: SCRAPED_AT,
    manualOverride: true,
    overrideNote: 'Segment fallback used when the vehicle is not in the pricing data',
  })
}

writeFileSync(OUT, JSON.stringify(bands, null, 2) + '\n')
console.log(`Wrote ${bands.length} pricing bands -> ${OUT}`)
console.log(`Vehicles: ${VEHICLES.length}, provinces: ${PROVINCES.length}, ages: ${AGES.length}, years: ${YEARS.length}`)
