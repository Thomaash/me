import { test, expect } from "@playwright/test";
import {
  meOpen,
  meClickMenu,
  meImportEmpty,
} from "../playwright-support/commands.js";

test.describe.serial("Basic", () => {
  /** @type {import("@playwright/test").Page} */
  let page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("Home page", async () => {
    await meOpen(page);
    await page.waitForFunction(() => location.hash === "#/home");
    await expect(
      page.locator("h3").filter({ hasText: "Description" }),
    ).toBeVisible();
    await expect(
      page.locator("h3").filter({ hasText: "Bindings" }),
    ).toBeVisible();
    await expect(
      page.locator("h3").filter({ hasText: "Placeholders" }),
    ).toBeVisible();
  });

  test("Menu url change", async () => {
    await meClickMenu(page);
  });

  test("Canvas page", async () => {
    await meClickMenu(page, "canvas");
    await expect(page.locator("canvas")).toBeVisible();
  });

  test("Empty project import", async () => {
    await meImportEmpty(page);
  });
});
