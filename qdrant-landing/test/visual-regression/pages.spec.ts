import { test, expect } from "playwright/test";
import { includedRoutes } from "./routes";

const DISABLE_ANIMATIONS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    scroll-behavior: auto !important;
  }
`;

// Third-party widgets (HubSpot forms, YouTube embeds, analytics, consent) load
// late and change on their own, so they make screenshots slow and flaky. Only
// the local site and the CDN for MathJax, Popper, and Chart.js may load.
const ALLOWED_HOSTS = new Set(["localhost", "127.0.0.1", "cdn.jsdelivr.net"]);

for (const { route, name } of includedRoutes()) {
  test(`visual snapshot — ${name}`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.route(
      (url) => !ALLOWED_HOSTS.has(url.hostname),
      (r) => r.abort(),
    );
    await page.goto(route, { waitUntil: "load" });
    // Some pages (embeds, HubSpot, chart data) never go fully idle. Give the rest
    // a few seconds to settle, then move on rather than waiting out the full cap.
    await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {});
    await page.addStyleTag({ content: DISABLE_ANIMATIONS });
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot(`${name}.png`, {
      fullPage: true,
    });
  });
}
