import { test } from "@playwright/test";
import {
  meOpen,
  meImportEmpty,
  meClickMenu,
  meSetVuetifyInputs,
  meTestVuetifyInputs,
  meWaitForPersistenceFlush,
} from "../playwright-support/commands.js";

test.describe.serial("Mininet settings", () => {
  /** @type {import("@playwright/test").Page} */
  let page;

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

  test("Clean the project", async () => {
    await meOpen(page);
    await meImportEmpty(page);
    await meClickMenu(page, "mininet-settings");
  });

  for (const { name, textProps = {}, checkboxProps = {}, selectProps = {} } of [
    {
      name: "Basic",
      textProps: {
        "mininet-settings-project-name": ["Test Project"],
        "mininet-settings-ip-base": ["172.16.0.0/16"],
        "mininet-settings-listen-port-base": ["1564"],
        "mininet-settings-start-script": [...Array(8)].map(
          (_, i) => `ping 172.16.77.${60 + i}`,
        ),
        "mininet-settings-stop-script": ["pingall"],
      },
      checkboxProps: {
        "mininet-settings-auto-set-mac": checkboxPropsFromUnset.setTrue,
        "mininet-settings-auto-static-arp": checkboxPropsFromUnset.setFalse,
        "mininet-settings-in-namespace": checkboxPropsFromUnset.unset,
        "mininet-settings-spawn-terminals": checkboxPropsFromUnset.setTrue,
      },
      selectProps: {
        "mininet-settings-log-level": "Critical",
      },
    },
  ]) {
    test.describe.serial(name, () => {
      test("Change the properties", async () => {
        await meSetVuetifyInputs(page, {
          textProps,
          checkboxProps,
          selectProps,
        });
      });

      test("Wait for persistence flush", async () => {
        await meWaitForPersistenceFlush(
          page,
          (s) =>
            s?.topology?.data?.projectName ===
            textProps["mininet-settings-project-name"][0],
        );
      });

      test("Navigate away and back", async () => {
        await meClickMenu(page, "about");
        await meClickMenu(page, "mininet-settings");
      });

      test("Test the properties", async () => {
        await meTestVuetifyInputs(page, {
          textProps,
          checkboxProps,
          selectProps,
        });
      });
    });
  }
});
