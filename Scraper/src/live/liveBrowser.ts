import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";

export interface LiveBrowserSession {
  browser: Browser;
  context: BrowserContext;
}

export async function launchLiveBrowser(): Promise<LiveBrowserSession> {
  const headless = process.env.LIVE_FORM_HEADLESS !== "false";
  const slowMo = Number(process.env.LIVE_FORM_SLOW_MO_MS ?? "0");
  const storageState = process.env.LIVE_FORM_STORAGE_STATE
    ? resolve(process.env.LIVE_FORM_STORAGE_STATE)
    : undefined;

  const browser = await chromium.launch({
    headless,
    slowMo: Number.isFinite(slowMo) ? slowMo : 0,
  });
  const context = await browser.newContext({
    locale: "en-US",
    timezoneId: "Asia/Bangkok",
    viewport: { width: 1366, height: 900 },
    storageState,
  });

  return { browser, context };
}

export async function closeLiveBrowser(session: LiveBrowserSession): Promise<void> {
  const savePath = process.env.LIVE_FORM_SAVE_STORAGE_STATE
    ? resolve(process.env.LIVE_FORM_SAVE_STORAGE_STATE)
    : undefined;
  if (savePath) {
    await mkdir(dirname(savePath), { recursive: true });
    await session.context.storageState({ path: savePath });
  }
  await session.context.close().catch(() => undefined);
  await session.browser.close().catch(() => undefined);
}

export async function captureDiagnostics(page: Page, site: string, runId: string, label: string): Promise<string[]> {
  const diagnosticsRoot = resolve(process.env.LIVE_FORM_DIAGNOSTICS_DIR ?? "data/live-diagnostics");
  const safeLabel = label.replace(/[^a-z0-9_-]+/gi, "_").slice(0, 80);
  const folder = resolve(diagnosticsRoot, runId, site);
  await mkdir(folder, { recursive: true });

  const screenshotPath = resolve(folder, `${safeLabel}.png`);
  const htmlPath = resolve(folder, `${safeLabel}.html`);
  await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => undefined);
  const html = await page.locator("html").evaluate((node) => node.outerHTML).catch(() => "");
  if (html) await writeFile(htmlPath, html, "utf8");
  return [screenshotPath, htmlPath];
}

export async function saveManualAuthState(url: string, path: string, waitMs: number): Promise<void> {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext({
    locale: "en-US",
    timezoneId: "Asia/Bangkok",
    viewport: { width: 1366, height: 900 },
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(waitMs);
  const resolvedPath = resolve(path);
  await mkdir(dirname(resolvedPath), { recursive: true });
  await context.storageState({ path: resolvedPath });
  await context.close().catch(() => undefined);
  await browser.close().catch(() => undefined);
}
