import { test } from "@playwright/test";
import {
  meOpen,
  meImportEmpty,
  meClickMenu,
  meSetVuetifyInputs,
  meTestVuetifyInputs,
  meWaitForPersistenceFlush,
} from "../playwright-support/commands.js";

test.describe.serial("Persistence", () => {
  /** @type {import("@playwright/test").Page} */
  let page;

  const textProps = {
    "mininet-settings-project-name": ["Persisted Project"],
  };

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("Survives a full page reload", async () => {
    await meOpen(page);
    await meImportEmpty(page);
    await meClickMenu(page, "mininet-settings");

    await meSetVuetifyInputs(page, { textProps });

    await meWaitForPersistenceFlush(
      page,
      (s) =>
        s?.topology?.data?.projectName ===
        textProps["mininet-settings-project-name"][0],
    );

    await page.reload();
    await meClickMenu(page, "mininet-settings");

    await meTestVuetifyInputs(page, { textProps });
  });
});
