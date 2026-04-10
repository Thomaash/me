import { expect } from "@playwright/test";

export async function meVisClick(
  page,
  locator,
  { button = 0, x = 0, y = 0, dbl = false } = {},
) {
  const dispatch = (eventType) =>
    locator.evaluate(
      (el, { type, button, clientX, clientY }) => {
        el.dispatchEvent(
          new PointerEvent(type, {
            button,
            clientX,
            clientY,
            bubbles: true,
          }),
        );
      },
      { type: eventType, button, clientX: x, clientY: y },
    );

  await dispatch("pointerdown");
  await dispatch("pointerup");

  if (dbl) {
    await dispatch("pointerdown");
    await dispatch("pointerup");
  }
}

export async function meVisAddItem(page, type, position = { x: 150, y: 150 }) {
  await meVisFabClick(page, type);
  await meVisClick(page, page.locator("[data-cy=vis] canvas"), position);
}

export async function meVisFabClick(page, button) {
  await page.locator("[data-cy=fab-activator] button").click();
  await page.locator(`[data-cy=fab-${button}]`).click();
}

export async function meImportEmpty(page) {
  await meClickMenu(page, "export");
  await page.locator("[data-cy=import-empty]").click();
  await page.locator("[data-cy=import-warning-confirm]").click();
  await expect(page.locator(".v-alert__content")).toContainText(
    "Successfully imported",
  );
}

export async function meSetVuetifyInputs(
  page,
  { textProps = {}, checkboxProps = {}, selectProps = {} },
) {
  for (const [key, values] of Object.entries(textProps)) {
    const input = page.locator(
      `[data-cy=${key}] input, [data-cy=${key}] textarea:not([aria-hidden])`,
    );
    await input.clear();
    const text = values.join("\n");
    try {
      await input.fill(text);
    } catch {
      // fill() rejects non-numeric text for <input type="number">.
      // Fall back to typing key-by-key so validation tests can
      // exercise invalid inputs (e.g. "172.16.0.7" in a number field).
      await input.pressSequentially(text);
    }
  }

  for (const [key, { clicks }] of Object.entries(checkboxProps)) {
    for (let i = 0; i < clicks; ++i) {
      await page.locator(`[data-cy=${key}] input`).click({ force: true });
    }
  }

  for (const [key, value] of Object.entries(selectProps)) {
    await page.locator(`[data-cy=${key}]`).click();
    await page
      .locator(".v-overlay__content .v-list-item-title")
      .filter({ hasText: value })
      .click();
  }
}

export async function meTestVuetifyInputs(
  page,
  { textProps = {}, checkboxProps = {}, selectProps = {} },
) {
  for (const [key, values] of Object.entries(textProps)) {
    await expect(
      page.locator(
        `[data-cy=${key}] input, [data-cy=${key}] textarea:not([aria-hidden])`,
      ),
    ).toHaveValue(values.join("\n"));
  }

  for (const [key, { ariaChecked }] of Object.entries(checkboxProps)) {
    const input = page.locator(`[data-cy=${key}] input`);
    await expect(input).toHaveCount(1);

    // Asserting title because Vuetify doesn't seem to set indeterminate correctly.
    if (ariaChecked === "mixed") {
      await expect(input).toHaveAttribute("title", "Default");
    } else if (ariaChecked === "true") {
      await expect(input).toHaveAttribute("title", "Enabled");
    } else {
      await expect(input).toHaveAttribute("title", "Disabled");
    }
  }

  for (const [key, value] of Object.entries(selectProps)) {
    await expect(page.locator(`[data-cy=${key}]`)).toContainText(value);
  }
}

const hashMap = {
  home: "#/home",
  canvas: "#/canvas",
  "mininet-settings": "#/mininet_settings",
  export: "#/export",
  about: "#/about",
};

export async function meClickMenu(page, name) {
  if (name) {
    await page
      .locator(`[data-cy=drawer-${name}][href="${hashMap[name]}"]`)
      .click();
    await page.waitForFunction(
      (expectedHash) => location.hash === expectedHash,
      hashMap[name],
    );
  } else {
    for (const [n, hash] of Object.entries(hashMap)) {
      await page.locator(`[data-cy=drawer-${n}][href="${hash}"]`).click();
      await page.waitForFunction(
        (expectedHash) => location.hash === expectedHash,
        hash,
      );
    }
  }
}

export async function meOpen(page) {
  const url = page.url();
  if (!url || url === "about:blank") {
    await page.goto("/");
    await page.waitForFunction(() => location.hash === "#/home");
  }
}

export async function meReadPersistedState(page) {
  return page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open("Vuex");
        req.addEventListener("error", () => reject(req.error));
        req.addEventListener("success", () => {
          const db = req.result;
          const tx = db.transaction("vuex-me", "readonly");
          const get = tx.objectStore("vuex-me").get("vuex-me");
          get.addEventListener("success", () => resolve(get.result ?? null));
          get.addEventListener("error", () => reject(get.error));
        });
      }),
  );
}

export async function meWaitForPersistenceFlush(page, predicate) {
  await expect
    .poll(async () => {
      const state = await meReadPersistedState(page);
      try {
        return predicate(state);
      } catch {
        return false;
      }
    })
    .toBeTruthy();
}
