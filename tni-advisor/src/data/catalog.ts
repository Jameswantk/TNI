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
  {
    brand: 'BYD',
    models: [
      { label: 'Atto 3', group: 'byd_atto3', ev: true },
      { label: 'Dolphin', group: 'byd_dolphin', ev: true },
      { label: 'Seal', group: 'byd_seal', ev: true },
    ],
  },
  {
    brand: 'Mercedes-Benz',
    models: [
      { label: 'A-Class', group: 'mercedes_benz_a_class' },
      { label: 'C200', group: 'mercedes_benz_c200' },
      { label: 'E220', group: 'mercedes_benz_e220' },
      { label: 'CLA', group: 'mercedes_benz_cla' },
      { label: 'GLC', group: 'mercedes_benz_glc' },
    ],
  },
  {
    brand: 'BMW',
    models: [
      { label: '320i', group: 'bmw_320i' },
      { label: '520d', group: 'bmw_520d' },
      { label: 'M340i', group: 'bmw_m340i' },
      { label: 'X1', group: 'bmw_x1' },
      { label: 'X3', group: 'bmw_x3' },
    ],
  },
  {
    brand: 'Suzuki',
    models: [
      { label: 'Swift', group: 'suzuki_swift' },
      { label: 'Ciaz', group: 'suzuki_ciaz' },
    ],
  },
  {
    brand: 'Hyundai',
    models: [
      { label: 'H-1', group: 'hyundai_h1' },
      { label: 'Tucson', group: 'hyundai_tucson' },
    ],
  },
  {
    brand: 'Kia',
    models: [
      { label: 'Carnival', group: 'kia_carnival' },
      { label: 'Seltos', group: 'kia_seltos' },
    ],
  },
  {
    brand: 'GWM',
    models: [
      { label: 'Haval H6', group: 'gwm_haval_h6' },
      { label: 'Ora Good Cat', group: 'gwm_ora_good_cat', ev: true },
      { label: 'Tank 300', group: 'gwm_tank_300' },
    ],
  },
  {
    brand: 'Tesla',
    models: [
      { label: 'Model 3', group: 'tesla_model_3', ev: true },
      { label: 'Model Y', group: 'tesla_model_y', ev: true },
    ],
  },
  {
    brand: 'Neta',
    models: [
      { label: 'V', group: 'neta_v', ev: true },
      { label: 'X', group: 'neta_x', ev: true },
    ],
  },
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
