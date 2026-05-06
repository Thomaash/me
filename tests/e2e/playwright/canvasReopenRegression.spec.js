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

/**
 * Regression coverage for the spec scenarios:
 *   "Undo preserves editability of an affected item"
 *   "Redo preserves editability of an affected item"
 *
 * After a public topology mutation followed by undo (and, separately, redo),
 * the affected rendered item must remain selectable and the appropriate
 * edit dialog must open via double-click. These are kept in their own
 * describe block with independent setup so the undo and redo cases fail
 * (and report) independently of each other and of the create/update flows
 * already covered above.
 */
test.describe("Canvas undo/redo editability regression", () => {
  /** @type {import("@playwright/test").Page} */
  let page;
  const itemPosition = { x: 200, y: 200 };
  const MUTATED_HOSTNAME = "hmutated";

  const hostnameInputLocator = () =>
    page.locator(
      "[data-cy=edit-host] [data-cy=edit-hostname] input, [data-cy=edit-host] [data-cy=edit-hostname] textarea:not([aria-hidden])",
    );

  async function placeHostViaFab() {
    await meVisFabClick(page, "host");
    for (const pos of [
      { clientX: 50, clientY: 50 },
      { clientX: 250, clientY: 250 },
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
    await expect(page.locator("[data-cy=edit-host]")).toBeVisible();
  }

  async function saveHostDialog() {
    await page
      .locator("[data-cy=edit-host]")
      .locator("[data-cy=edit-save]")
      .click();
    await expect(page.locator("[data-cy=edit-host]")).toHaveCount(0);
  }

  async function dblClickHost() {
    await meVisClick(page.locator("[data-cy=vis] canvas"), {
      ...itemPosition,
      dbl: true,
    });
    await expect(page.locator("[data-cy=edit-host]")).toBeVisible();
  }

  /**
   * Sets up a saved host whose hostname has been mutated through the public
   * update workflow. Returns the auto-assigned (pre-mutation) hostname so the
   * caller can assert against it after undo, without any window globals.
   */
  async function setupMutatedHost() {
    await placeHostViaFab();
    const originalHostname = await hostnameInputLocator().inputValue();
    await saveHostDialog();

    await dblClickHost();
    await hostnameInputLocator().clear();
    await hostnameInputLocator().fill(MUTATED_HOSTNAME);
    await saveHostDialog();

    return originalHostname;
  }

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await meOpen(page);
    await meImportEmpty(page);
    await meClickMenu(page, "canvas");
  });

  test.afterEach(async () => {
    await page.close();
  });

  test("after undo of a public update mutation, the affected item is selectable and reopens its edit dialog", async () => {
    const originalHostname = await setupMutatedHost();

    // Trigger undo via the documented Ctrl+Z keybinding handled by VisContainer.
    await page.locator(".vis-root").focus();
    await page.keyboard.press("Control+z");

    // Item must remain rendered and double-clickable; the dialog must reopen
    // and reflect the pre-mutation state.
    await dblClickHost();
    await expect(hostnameInputLocator()).toHaveValue(originalHostname);
  });

  test("after redo of a previously-undone mutation, the affected item is selectable and reopens its edit dialog", async () => {
    await setupMutatedHost();

    await page.locator(".vis-root").focus();
    await page.keyboard.press("Control+z");
    await page.keyboard.press("Control+y");

    await dblClickHost();
    await expect(hostnameInputLocator()).toHaveValue(MUTATED_HOSTNAME);
  });
});
