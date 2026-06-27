import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { VehicleCatalogEntry } from "../types.js";

export const DEFAULT_CATALOG_PATH = resolve("data/vehicle_catalog.json");

export async function readVehicleCatalog(path = DEFAULT_CATALOG_PATH): Promise<VehicleCatalogEntry[]> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as VehicleCatalogEntry[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function writeVehicleCatalog(entries: VehicleCatalogEntry[], path = DEFAULT_CATALOG_PATH): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
}

export function mergeVehicleCatalog(existing: VehicleCatalogEntry[], incoming: VehicleCatalogEntry[]): VehicleCatalogEntry[] {
  const byKey = new Map<string, VehicleCatalogEntry>();
  for (const entry of [...existing, ...incoming]) {
    byKey.set(`${entry.site}|${entry.brand}|${entry.model ?? ""}`, entry);
  }
  return Array.from(byKey.values()).sort((a, b) => `${a.site}|${a.brand}|${a.model ?? ""}`.localeCompare(`${b.site}|${b.brand}|${b.model ?? ""}`));
}
