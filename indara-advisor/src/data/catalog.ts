// ============================================================================
// VEHICLE CATALOG
// ----------------------------------------------------------------------------
// Powers the cascading Brand -> Model picker (project memory 27.7) and EV
// detection for the EV-aware branch (28.2). Each model carries the exact
// `vehicleGroup` slug used by the pricing bands, so a catalog pick lands an
// exact band match. Free-typed vehicles fall back to the segment default.
// In production this list is replaced by the real make/model reference data.
// ============================================================================

export interface CatalogModel {
  label: string
  group: string
  ev?: boolean
}

export interface CatalogBrand {
  brand: string
  models: CatalogModel[]
}

export const catalog: CatalogBrand[] = [
  {
    brand: 'Toyota',
    models: [
      { label: 'Vios', group: 'toyota_vios' },
      { label: 'Yaris', group: 'toyota_yaris' },
      { label: 'Corolla Altis', group: 'toyota_corolla_altis' },
      { label: 'Fortuner', group: 'toyota_fortuner' },
      { label: 'Hilux Revo', group: 'toyota_hilux_revo' },
    ],
  },
  {
    brand: 'Honda',
    models: [
      { label: 'City', group: 'honda_city' },
      { label: 'Civic', group: 'honda_civic' },
      { label: 'CR-V', group: 'honda_crv' },
      { label: 'Jazz', group: 'honda_jazz' },
    ],
  },
  {
    brand: 'Isuzu',
    models: [
      { label: 'D-Max', group: 'isuzu_dmax' },
      { label: 'MU-X', group: 'isuzu_mux' },
    ],
  },
  {
    brand: 'Mitsubishi',
    models: [
      { label: 'Triton', group: 'mitsubishi_triton' },
      { label: 'Xpander', group: 'mitsubishi_xpander' },
    ],
  },
  { brand: 'Mazda', models: [{ label: 'Mazda 2', group: 'mazda_2' }] },
  { brand: 'Nissan', models: [{ label: 'Almera', group: 'nissan_almera' }] },
  { brand: 'Ford', models: [{ label: 'Ranger', group: 'ford_ranger' }] },
  { brand: 'MG', models: [{ label: 'ZS', group: 'mg_zs' }] },
  { brand: 'BYD', models: [{ label: 'Atto 3', group: 'byd_atto3', ev: true }] },
  { brand: 'Mercedes-Benz', models: [] },
  { brand: 'BMW', models: [] },
  { brand: 'Suzuki', models: [] },
  { brand: 'Hyundai', models: [] },
  { brand: 'Kia', models: [] },
  { brand: 'GWM', models: [] },
  { brand: 'Tesla', models: [] },
  { brand: 'Neta', models: [] },
]

// Brands whose every model is electric — used so a free-typed EV brand still
// triggers the EV branch even if the exact model isn't in the catalog.
const EV_BRANDS = new Set(['byd', 'tesla', 'neta'])

export function findModel(brand: string, model: string): CatalogModel | undefined {
  const b = catalog.find((c) => c.brand.toLowerCase() === brand.trim().toLowerCase())
  if (!b) return undefined
  return b.models.find((m) => m.label.toLowerCase() === model.trim().toLowerCase())
}

// Resolve free-text or catalog answers to a canonical vehicleGroup slug.
export function resolveVehicleGroup(brand?: string, model?: string): string {
  const hit = brand && model ? findModel(brand, model) : undefined
  if (hit) return hit.group
  const slug = [brand, model]
    .filter(Boolean)
    .map((s) => s!.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''))
    .filter(Boolean)
    .join('_')
  return slug || 'default'
}

export function isEvVehicle(brand?: string, model?: string): boolean {
  const hit = brand && model ? findModel(brand, model) : undefined
  if (hit?.ev) return true
  if (brand && EV_BRANDS.has(brand.trim().toLowerCase())) return true
  return false
}
