import { test, expect } from "@playwright/test";
import {
  meOpen,
  meImportEmpty,
  meClickMenu,
  meVisClick,
  meVisFabClick,
  meSetVuetifyInputs,
  meTestVuetifyInputs,
} from "../playwright-support/commands.js";

test.describe.serial("Canvas", () => {
  /** @type {import("@playwright/test").Page} */
  let page;

  const itemPosition = { x: 150, y: 150 };
  const checkboxPropsFromUnset = {
    setTrue: {
      clicks: 1,
      ariaChecked: "true",
    },
    setFalse: {
      clicks: 2,
      ariaChecked: "false",
    },
    unset: {
      clicks: 3,
      ariaChecked: "mixed",
    },
  };

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  let editDialogCounter = 0;
  function openEditDialog(expectedType) {
    const label =
      ++editDialogCounter % 2 === 1 ? "Open edit dialog" : "Reopen edit dialog";
    test(label, async () => {
      await meVisClick(page.locator("[data-cy=vis] canvas"), {
        ...itemPosition,
        dbl: true,
      });
      await expect(
        page.locator(`[data-cy=edit-${expectedType}]`),
      ).toBeVisible();
    });
  }

  test("Clean the canvas", async () => {
    await meOpen(page);
    await meImportEmpty(page);
    await meClickMenu(page, "canvas");
  });

  for (const {
    type,
    hostname,
    itemsToDelete = 1,
    textProps = {},
    checkboxProps = {},
    selectProps = {},
  } of [
    {
      type: "port",
      hostname: "eth0",
      itemsToDelete: 1,
      textProps: {
        "edit-hostname": ["test"],
        "edit-ips": [
          "172.16.0.7/16",
          "172.16.0.7/32",
          "2001:0db8:0000:0000:0000:ff00:0042:8329/64",
          "2001:db8:0:0:0:ff00:42:8329/17",
          "2001:db8::ff00:42:8329/1",
        ],
      },
      checkboxProps: {
        "edit-physical": checkboxPropsFromUnset.setTrue,
      },
    },
    {
      type: "host",
      hostname: "h1",
      itemsToDelete: 5,
      textProps: {
        "edit-hostname": ["test"],
        "edit-default-route": ["172.16.0.1"],
        "edit-cpu-limit": ["0.23"],
        "edit-cpu-cores-str": ["2"],
        "edit-start-script": ["ping 172.16.0.1", "ping 172.16.0.2"],
        "edit-stop-script": ["pingall"],
      },
      selectProps: {
        "edit-cpu-scheduler": "CFS",
      },
    },
    {
      type: "switch",
      hostname: "s1",
      itemsToDelete: 13,
      textProps: {
        "edit-hostname": ["test"],
        "edit-stp-priority": ["12288"],
        "edit-ip": ["172.16.15.74"],
        "edit-dpctl-port": ["1576"],
        "edit-dpid": ["acdc"],
        "edit-dpopts": ["--some-arg some-value"],
        "edit-reconnect-ms": ["500"],
        "edit-opts": ["--some-arg some-value"],
        "edit-start-script": ["ping 172.16.0.1"],
        "edit-stop-script": ["pingall", "# good bye"],
      },
      checkboxProps: {
        "edit-stp": checkboxPropsFromUnset.setTrue,
        "edit-inband": checkboxPropsFromUnset.unset,
        "edit-in-namespace": checkboxPropsFromUnset.setFalse,
        "edit-batch": checkboxPropsFromUnset.setTrue,
        "edit-verbose": checkboxPropsFromUnset.unset,
      },
      selectProps: {
        "edit-switch-type": "OVS Switch",
        "edit-protocol": "OpenFlow 1.3",
        "edit-datapath": "User",
        "edit-fail-mode": "Secure",
      },
    },
    {
      type: "controller",
      hostname: "c1",
      itemsToDelete: 1,
      textProps: {
        "edit-hostname": ["test"],
        "edit-ip": ["172.16.15.4"],
        "edit-port": ["65535"],
      },
      selectProps: {
        "edit-controller-type": "Remote Controller",
        "edit-protocol": "SSL",
      },
    },
    {
      type: "dummy",
      hostname: "",
      itemsToDelete: 1,
      textProps: {
        "edit-hostname": [
          "Moving along\u2026",
          "",
          "That\u2019s a popular name today. Little \u201Ce\u201D, big \u201CB\u201D?",
          "Bender, this is Fry\u2019s decision\u2026 and he made it wrong.",
          "So it\u2019s time for us to interfere in his life.",
          "You\u2019re going back for the Countess, aren\u2019t you?",
          "",
          "We\u2019re rescuing ya.",
          "Yeah, and if you were the pope they\u2019d be all, \u201CStraighten your pope hat. \u201D And \u201CPut on your good vestments. \u201D",
          "Who am I making this out to?",
          "Belligerent and numerous.",
          "I don\u2019t want to be rescued.",
        ],
      },
    },
  ]) {
    test.describe.serial(type, () => {
      test("Enter add mode", async () => {
        await meVisFabClick(page, type);

        await page.locator(".vis-root").evaluate(
          (el, { clientX, clientY }) => {
            el.dispatchEvent(
              new MouseEvent("mousemove", {
                button: 0,
                clientX,
                clientY,
                bubbles: true,
              }),
            );
          },
          { clientX: 50, clientY: 50 },
        );
        await page.locator(".vis-root").evaluate(
          (el, { clientX, clientY }) => {
            el.dispatchEvent(
              new MouseEvent("mousemove", {
                button: 0,
                clientX,
                clientY,
                bubbles: true,
              }),
            );
          },
          { clientX: 250, clientY: 100 },
        );
      });

      test("Place the item", async () => {
        await meVisClick(page.locator("[data-cy=vis] canvas"), itemPosition);
      });

      test("Save the item", async () => {
        await page
          .locator(`[data-cy=edit-${type}]`)
          .locator("[data-cy=edit-save]")
          .click();
        await expect(page.locator(`[data-cy=edit-${type}]`)).toHaveCount(0);
      });

      openEditDialog(type);

      test("Test item's hostname", async () => {
        await expect(
          page.locator(
            "[data-cy=edit-hostname] input, [data-cy=edit-hostname] textarea:not([aria-hidden])",
          ),
        ).toHaveValue(hostname);
      });

      test("Change items' properties", async () => {
        await meSetVuetifyInputs(page, {
          textProps,
          checkboxProps,
          selectProps,
        });
      });

      test("Save edit dialog", async () => {
        await page
          .locator(`[data-cy=edit-${type}]`)
          .locator("[data-cy=edit-save]")
          .click();
        await expect(page.locator(`[data-cy=edit-${type}]`)).toHaveCount(0);
      });

      openEditDialog(type);

      test("Test items' properties", async () => {
        await meTestVuetifyInputs(page, {
          textProps,
          checkboxProps,
          selectProps,
        });
      });

      test("Cancel edit dialog", async () => {
        await page
          .locator(`[data-cy=edit-${type}]`)
          .locator("[data-cy=edit-cancel]")
          .click();
        await expect(page.locator(`[data-cy=edit-${type}]`)).toHaveCount(0);
      });

      test("Delete the items", async () => {
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

        const snackbar = page.locator("[data-cy=vis-snackbar]");
        await expect(snackbar).toHaveAttribute("data-cy-type", "items-deleted");
        await expect(snackbar).toHaveAttribute(
          "data-cy-values",
          `[${itemsToDelete}]`,
        );
      });
    });
  }
});
