import { test, expect } from "@playwright/test";
import {
  meOpen,
  meImportEmpty,
  meClickMenu,
  meVisClick,
  meVisFabClick,
} from "../playwright-support/commands.js";

/**
 * Regression coverage for the bug where, after creating a new item via the
 * canvas FAB + click flow and saving the edit dialog, the canvas had drifted
 * from the topology store state and reopening the item via double-click
 * failed.
 *
 * The fix privatizes the topology store's `applyChange` helper and rewires
 * VisCanvas to react to the public mutation workflows (createItems /
 * updateItems / replaceItems / removeItems / undo / redo). These tests pin
 * the user-visible contract: items created or mutated through the canvas
 * remain selectable and re-editable.
 */
test.describe
  .serial("Canvas reopen regression (privatize-topology-apply-change)", () => {
  /** @type {import("@playwright/test").Page} */
  let page;

  const itemPosition = { x: 150, y: 150 };

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await meOpen(page);
    await meImportEmpty(page);
    await meClickMenu(page, "canvas");
  });

  test.afterAll(async () => {
    await page.close();
  });

  async function addItemViaFab(type) {
    await meVisFabClick(page, type);
    // Mimic the cursor moves used in the existing canvas scenario so the
    // ghost item attaches to the canvas before placement.
    for (const pos of [
      { clientX: 50, clientY: 50 },
      { clientX: 250, clientY: 100 },
    ]) {
      await page.locator(".vis-root").evaluate((el, p) => {
        el.dispatchEvent(
          new MouseEvent("mousemove", {
            button: 0,
            clientX: p.clientX,
            clientY: p.clientY,
            bubbles: true,
          }),
        );
      }, pos);
    }
    await meVisClick(page.locator("[data-cy=vis] canvas"), itemPosition);
  }

  async function saveAndExpectClosed(type) {
    await page
      .locator(`[data-cy=edit-${type}]`)
      .locator("[data-cy=edit-save]")
      .click();
    await expect(page.locator(`[data-cy=edit-${type}]`)).toHaveCount(0);
  }

  async function dblClickRenderedItem() {
    await meVisClick(page.locator("[data-cy=vis] canvas"), {
      ...itemPosition,
      dbl: true,
    });
  }

  test("creating a port, saving, and double-clicking reopens the port edit dialog", async () => {
    await addItemViaFab("port");
    // Initial create dialog is open at this point.
    await expect(page.locator("[data-cy=edit-port]")).toBeVisible();
    await saveAndExpectClosed("port");

    // Core regression assertion: canvas is in sync with the store, so the
    // newly created port is double-clickable and reopens the edit dialog.
    await dblClickRenderedItem();
    await expect(page.locator("[data-cy=edit-port]")).toBeVisible();

    // Close so subsequent tests start from a clean state.
    await page
      .locator("[data-cy=edit-port]")
      .locator("[data-cy=edit-cancel]")
      .click();
    await expect(page.locator("[data-cy=edit-port]")).toHaveCount(0);
  });

  test("reopening, editing, and saving a port keeps it reopenable", async () => {
    // Reopen the port we just created.
    await dblClickRenderedItem();
    await expect(page.locator("[data-cy=edit-port]")).toBeVisible();

    // Mutate via the public update workflow (edit dialog save).
    const hostnameInput = page.locator(
      "[data-cy=edit-hostname] input, [data-cy=edit-hostname] textarea:not([aria-hidden])",
    );
    await hostnameInput.clear();
    await hostnameInput.fill("test");
    await saveAndExpectClosed("port");

    // After the public update, double-clicking must still reopen the dialog
    // and reflect the new state - this would also fail if the canvas dataset
    // drifted from the store.
    await dblClickRenderedItem();
    await expect(page.locator("[data-cy=edit-port]")).toBeVisible();
    await expect(hostnameInput).toHaveValue("test");
    await page
      .locator("[data-cy=edit-port]")
      .locator("[data-cy=edit-cancel]")
      .click();
    await expect(page.locator("[data-cy=edit-port]")).toHaveCount(0);
  });

  test("creating a host then reopening it works through the public mutation path", async () => {
    // A second public-mutation path (host creation) helps confirm the bridge
    // covers more than just the port creation flow. Place at a different
    // position so it does not overlap the port created in earlier tests.
    const hostPosition = { x: 400, y: 300 };
    await meVisFabClick(page, "host");
    for (const pos of [
      { clientX: 50, clientY: 50 },
      { clientX: 350, clientY: 250 },
    ]) {
      await page.locator(".vis-root").evaluate((el, p) => {
        el.dispatchEvent(
          new MouseEvent("mousemove", {
            button: 0,
            clientX: p.clientX,
            clientY: p.clientY,
            bubbles: true,
          }),
        );
      }, pos);
    }
    await meVisClick(page.locator("[data-cy=vis] canvas"), hostPosition);
    await expect(page.locator("[data-cy=edit-host]")).toBeVisible();
    await saveAndExpectClosed("host");

    await meVisClick(page.locator("[data-cy=vis] canvas"), {
      ...hostPosition,
      dbl: true,
    });
    await expect(page.locator("[data-cy=edit-host]")).toBeVisible();
    await page
      .locator("[data-cy=edit-host]")
      .locator("[data-cy=edit-cancel]")
      .click();
    await expect(page.locator("[data-cy=edit-host]")).toHaveCount(0);
  });
});
