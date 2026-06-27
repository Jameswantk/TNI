import { randomUUID } from "node:crypto";

export function createRunId(): string {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return `run_${stamp}_${randomUUID().slice(0, 8)}`;
}

export function createQuoteId(site: string): string {
  return `${site}_${randomUUID()}`;
}

