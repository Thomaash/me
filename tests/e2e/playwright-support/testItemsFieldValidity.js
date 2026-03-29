import { test, expect } from "@playwright/test";
import {
  meOpen,
  meImportEmpty,
  meClickMenu,
  meVisFabClick,
  meVisAddItem,
  meSetVuetifyInputs,
} from "./commands.js";

export function testSet({ name, type, field, values }) {
  test.describe.serial(name, () => {
    /** @type {import("@playwright/test").Page} */
    let page;

    test.beforeAll(async ({ browser }) => {
      page = await browser.newPage();
    });

    test.afterAll(async () => {
      await page.close();
    });

    test.describe.serial("Init", () => {
      test("Open new empty canvas", async () => {
        await meOpen(page);
        await meImportEmpty(page);
        await meClickMenu(page, "canvas");
      });

      test("Place the item", async () => {
        await page.locator("[data-cy=vis] canvas").evaluate((el) => {
          el.dispatchEvent(
            new KeyboardEvent("keydown", {
              ctrlKey: true,
              key: "a",
              bubbles: true,
            }),
          );
        });

        await meVisFabClick(page, "delete");
        await meVisAddItem(page, type);
      });
    });

    test.describe.serial("Test the values", () => {
      values.forEach(({ valid, values: vals, expectedValue }, index) => {
        test.describe.serial(`${index + 1}. ${vals.join(", ")}`, () => {
          test("Change properties", async () => {
            await meSetVuetifyInputs(page, {
              textProps: {
                [field]: vals,
              },
            });
          });

          if (expectedValue != null) {
            test(`Expected: ${expectedValue}`, async () => {
              await expect(
                page.locator(
                  `[data-cy=${field}] input, [data-cy=${field}] textarea:not([aria-hidden])`,
                ),
              ).toHaveValue(expectedValue);
            });
          }

          test(`Is ${valid ? "" : "in"}valid?`, async () => {
            if (valid) {
              await expect(page.locator("[data-cy=edit-save]")).toBeEnabled();
            } else {
              await expect(page.locator("[data-cy=edit-save]")).toBeDisabled();
            }
          });
        });
      });
    });

    test.describe.serial("Close", () => {
      test("Cancel", async () => {
        await page
          .locator(`[data-cy=edit-${type}]`)
          .locator("[data-cy=edit-cancel]")
          .click();
      });
    });
  });
}

export const ips = [
  { valid: false, values: ["172.16.0.7/24"] },
  { valid: false, values: ["172.16.0.7/44"] },
  { valid: false, values: ["172.16.0.7/o"] },
  { valid: false, values: ["172.16.7"] },
  { valid: false, values: ["172.16.f.7"] },
  { valid: false, values: ["172.256.0.7"] },
  { valid: false, values: ["2001:0db8:0000:0000:0000:ff00:0042:8329/13"] },
  { valid: false, values: ["2001:0db8:0000:0000:0000:ffa00:0042:8329"] },
  { valid: false, values: ["2001:0db8:0000:0000:0000:ffx0:0042:8329"] },
  { valid: false, values: ["2001:db8:0:0:0:0:ff00:42:8329"] },
  { valid: false, values: ["2001:db8:0:0:0:ff00:42:8329/"] },
  { valid: false, values: ["2001:db8::ff00:42:8329/-7"] },
  { valid: false, values: ["2001:db8::ff00::42:8329"] },
  { valid: false, values: ["t:e::s:t"] },
  { valid: false, values: ["test"] },
  { valid: true, values: ["172.16.0.7"] },
  { valid: true, values: ["2001:0db8:0000:0000:0000:ff00:0042:8329"] },
  { valid: true, values: ["2001:db8:0:0:0:ff00:42:8329"] },
  { valid: true, values: ["2001:db8::ff00:42:8329"] },
];

export const ports = [
  { valid: false, values: ["-1"] },
  { valid: false, values: ["0"] },
  { valid: false, values: ["100000"] },
  { valid: true, values: ["12.6"], expectedValue: "12" },
  { valid: true, values: ["172.16.0.7"], expectedValue: "172" },
  { valid: true, values: ["172.16.0.7/16"], expectedValue: "172" },
  { valid: false, values: ["65536"] },
  { valid: true, values: ["1"] },
  { valid: true, values: ["65535"] },
  { valid: true, values: ["6633"] },
  { valid: true, values: ["6653"] },
];

export const integers = (min, max, minLimited = true, maxLimited = true) => [
  { valid: !maxLimited, values: [`${max + 1}`] },
  { valid: !minLimited, values: [`${min - 1}`] },
  { valid: false, values: [`${max + 0.1}`] },
  { valid: false, values: [`${max - 0.1}`] },
  { valid: false, values: [`${min + 0.1}`] },
  { valid: false, values: [`${min - 0.1}`] },
  { valid: true, values: [`${Math.floor(min + 0.1 * (max - min))}`] },
  { valid: true, values: [`${Math.floor(min + 0.5 * (max - min))}`] },
  { valid: true, values: [`${Math.floor(min + 0.9 * (max - min))}`] },
  { valid: true, values: [`${max}`] },
  { valid: true, values: [`${min}`] },
];

export const decimals = (min, max, minLimited = true, maxLimited = true) => [
  { valid: !maxLimited, values: [`${max + 0.1}`] },
  { valid: !maxLimited, values: [`${max + 1}`] },
  // { valid: !minLimited, values: [`${min - 0.1}`] }, // TODO: v-model.number converts -0 to 0 and therefore -0.1 ends up as 0.1. In the only place this is used right now it doesn't matter because all negative numbers are banned.
  { valid: !minLimited, values: [`${min - 1}`] },
  { valid: true, values: [`${max - 0.1}`] },
  { valid: true, values: [`${max}`] },
  { valid: true, values: [`${min + 0.1 * (max - min)}`] },
  { valid: true, values: [`${min + 0.1}`] },
  { valid: true, values: [`${min + 0.5 * (max - min)}`] },
  { valid: true, values: [`${min + 0.9 * (max - min)}`] },
  { valid: true, values: [`${min}`] },
];
