import { chromium } from "@playwright/test";

const BASE_URL = "http://127.0.0.1:3000";

const ROUTES = ["/", "/register", "/login", "/roadmap", "/share/warmup-token"];

export default async function globalSetup() {
  const browser = await chromium.launch();
  const page = await (await browser.newContext()).newPage();

  for (const route of ROUTES) {
    await page
      .goto(BASE_URL + route, { waitUntil: "networkidle", timeout: 30000 })
      .catch(() => {});
  }

  await browser.close();
}
