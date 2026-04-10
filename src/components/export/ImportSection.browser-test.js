import { describe, it, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import { createPinia } from "pinia";
import ImportSection from "@/components/export/ImportSection.vue";
import { useTopologyStore } from "@/store/topologyStore";
import { useAppStore } from "@/store/appStore";

function createTestPinia({ working = false } = {}) {
  const pinia = createPinia();
  pinia.state.value.app = {
    loading: false,
    working,
    isUpdateAvailable: false,
    alert: { show: false },
  };
  pinia.state.value.topology = {
    data: { items: {}, projectName: "Test", startScript: "" },
    past: [],
    future: [],
  };
  return pinia;
}

function createContainer() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  return container;
}

function mountImportSection({
  working = false,
  attachTo,
  pinia: existingPinia,
} = {}) {
  const vuetify = createVuetify();
  const pinia = existingPinia || createTestPinia({ working });
  const options = {
    global: {
      plugins: [vuetify, pinia],
    },
  };
  if (attachTo) {
    options.attachTo = attachTo;
  }
  const topologyStore = useTopologyStore(pinia);
  const appStore = useAppStore(pinia);
  return { wrapper: mount(ImportSection, options), topologyStore, appStore };
}

describe.concurrent("ImportSection", () => {
  it("mounts successfully in Vuetify context with Pinia store", ({
    expect,
  }) => {
    const { wrapper } = mountImportSection();

    expect(wrapper.exists()).toBe(true);
  });

  it("renders import buttons for Empty, Examples, and File", ({ expect }) => {
    const { wrapper } = mountImportSection();

    const buttons = wrapper.findAllComponents({ name: "VBtn" });
    const buttonTexts = buttons.map((btn) => btn.text());

    expect(buttonTexts).toContain("Empty");
    expect(buttonTexts).toContain("Examples");
    expect(buttonTexts).toContain("File");
  });

  it("disables import buttons when working is true", ({ expect }) => {
    const { wrapper } = mountImportSection({ working: true });

    const buttons = wrapper.findAllComponents({ name: "VBtn" });
    const importButtons = buttons.filter((btn) =>
      ["Empty", "Examples", "File"].includes(btn.text()),
    );

    expect(importButtons.length).toBe(3);
    for (const btn of importButtons) {
      expect(btn.attributes("disabled")).toBeDefined();
    }
  });

  it("opens dropdown with example project titles when Examples is clicked", async ({
    expect,
  }) => {
    const container = createContainer();
    const { wrapper } = mountImportSection({ attachTo: container });

    const buttons = wrapper.findAllComponents({ name: "VBtn" });
    const examplesBtn = buttons.find((btn) => btn.text() === "Examples");
    await examplesBtn.trigger("click");

    const expectedTitles = [
      "Tiny without controller",
      "Tiny with controller",
      "Tiny with physical interface",
      "Tiny with traffic control",
      "Tiny with Mininet settings",
      "Medium with 1 controller",
      "Medium with 2 controllers",
    ];

    // Wait for Vuetify menu overlay to render
    await expect
      .poll(() => document.body.textContent)
      .toContain(expectedTitles[0]);

    // After the first title appears, the rest should be present too
    for (const title of expectedTitles.slice(1)) {
      expect(document.body.textContent).toContain(title);
    }

    wrapper.unmount();
    container.remove();
  });

  it("configures file input accept attribute with json and python extensions and MIME types", ({
    expect,
  }) => {
    const { wrapper } = mountImportSection();

    const fileInput = wrapper.find('input[type="file"]');
    const accept = fileInput.attributes("accept");

    expect(accept).toContain(".json");
    expect(accept).toContain(".py");
    expect(accept).toContain("application/json");
    expect(accept).toContain("application/x-python-code");
    expect(accept).toContain("text/x-python");
  });

  it("returns early from retrieveFile when no file is present", async ({
    expect,
  }) => {
    const pinia = createTestPinia();
    const container = createContainer();
    const { wrapper, appStore } = mountImportSection({
      attachTo: container,
      pinia,
    });

    const fileInput = wrapper.find('input[type="file"]');

    await fileInput.trigger("change");
    await flushPromises();

    // working should remain false since retrieveFile returned early
    expect(appStore.working).toBe(false);
    // No alert should be set
    expect(appStore.alert.show).toBe(false);

    wrapper.unmount();
    container.remove();
  });
});

describe("ImportSection dialog interactions", () => {
  it("shows confirmation dialog and imports data when confirmed via Empty button", async ({
    expect,
  }) => {
    const pinia = createTestPinia();
    const container = createContainer();
    const { wrapper, appStore } = mountImportSection({
      attachTo: container,
      pinia,
    });

    const emptyBtn = wrapper
      .findAllComponents({ name: "VBtn" })
      .find((btn) => btn.text() === "Empty");
    emptyBtn.trigger("click");
    await expect
      .poll(() => document.querySelector('[data-cy="import-warning-confirm"]'))
      .toBeTruthy();

    const confirmBtn = document.querySelector(
      '[data-cy="import-warning-confirm"]',
    );
    expect(confirmBtn).not.toBeNull();
    confirmBtn.click();
    await expect.poll(() => appStore.alert.type).toBe("success");

    expect(appStore.alert.text).toBe("Successfully imported.");

    wrapper.unmount();
    container.remove();
  });

  it("shows confirmation dialog and cancels import when cancel is clicked", async ({
    expect,
  }) => {
    const pinia = createTestPinia();
    const container = createContainer();
    const { wrapper, appStore } = mountImportSection({
      attachTo: container,
      pinia,
    });

    const emptyBtn = wrapper
      .findAllComponents({ name: "VBtn" })
      .find((btn) => btn.text() === "Empty");
    emptyBtn.trigger("click");
    await expect
      .poll(() => document.querySelector('[data-cy="import-warning-cancel"]'))
      .toBeTruthy();

    const cancelBtn = document.querySelector(
      '[data-cy="import-warning-cancel"]',
    );
    expect(cancelBtn).not.toBeNull();
    cancelBtn.click();
    await expect.poll(() => appStore.alert.type).toBe("info");

    expect(appStore.alert.text).toBe("Import canceled.");

    wrapper.unmount();
    container.remove();
  });

  it("sets working state during importData and resets after confirm", async ({
    expect,
  }) => {
    const pinia = createTestPinia();
    const container = createContainer();
    const { wrapper, appStore } = mountImportSection({
      attachTo: container,
      pinia,
    });

    const emptyBtn = wrapper
      .findAllComponents({ name: "VBtn" })
      .find((btn) => btn.text() === "Empty");
    emptyBtn.trigger("click");
    await flushPromises();

    expect(appStore.working).toBe(true);

    const confirmBtn = document.querySelector(
      '[data-cy="import-warning-confirm"]',
    );
    confirmBtn.click();
    await expect.poll(() => appStore.working).toBe(false);

    wrapper.unmount();
    container.remove();
  });

  it("calls topologyStore.importData when import is confirmed", async ({
    expect,
  }) => {
    const pinia = createTestPinia();
    const topologyStore = useTopologyStore(pinia);
    const importDataSpy = vi.spyOn(topologyStore, "importData");
    const container = createContainer();
    const { wrapper } = mountImportSection({ attachTo: container, pinia });

    const emptyBtn = wrapper
      .findAllComponents({ name: "VBtn" })
      .find((btn) => btn.text() === "Empty");
    emptyBtn.trigger("click");
    await expect
      .poll(() => document.querySelector('[data-cy="import-warning-confirm"]'))
      .toBeTruthy();

    const confirmBtn = document.querySelector(
      '[data-cy="import-warning-confirm"]',
    );
    confirmBtn.click();
    await expect
      .poll(() => importDataSpy.mock.calls.length)
      .toBeGreaterThanOrEqual(1);

    expect(importDataSpy).toHaveBeenCalled();

    wrapper.unmount();
    container.remove();
  });

  it("processes a JSON file via retrieveFile and imports after confirmation", async ({
    expect,
  }) => {
    const pinia = createTestPinia();
    const container = createContainer();
    const { wrapper, appStore } = mountImportSection({
      attachTo: container,
      pinia,
    });

    const jsonContent = '{"version":0,"items":[{"id":"test"}]}';
    const file = new File([jsonContent], "test.json", {
      type: "application/json",
    });

    const fileInput = wrapper.find('input[type="file"]');
    const inputEl = fileInput.element;

    Object.defineProperty(inputEl, "files", {
      value: [file],
      writable: false,
    });

    await fileInput.trigger("input");
    // Wait for FileReader onloadend
    await expect
      .poll(() => document.querySelector('[data-cy="import-warning-confirm"]'))
      .toBeTruthy();

    const confirmBtn = document.querySelector(
      '[data-cy="import-warning-confirm"]',
    );
    confirmBtn.click();
    await expect.poll(() => appStore.alert.type).toBe("success");

    expect(appStore.alert.text).toBe("Successfully imported.");
    expect(appStore.working).toBe(false);

    wrapper.unmount();
    container.remove();
  });

  it("shows error alert when file type is unknown in retrieveFile", async ({
    expect,
  }) => {
    const pinia = createTestPinia();
    const container = createContainer();
    const { wrapper, appStore } = mountImportSection({
      attachTo: container,
      pinia,
    });

    const file = new File(["some content"], "data.xyz", {
      type: "application/octet-stream",
    });

    const fileInput = wrapper.find('input[type="file"]');
    const inputEl = fileInput.element;

    Object.defineProperty(inputEl, "files", {
      value: [file],
      writable: false,
    });

    await fileInput.trigger("input");
    // Wait for FileReader onloadend
    await expect.poll(() => appStore.alert.type).toBe("error");

    expect(appStore.alert.text).toContain("Unknown file format");
    expect(appStore.working).toBe(false);

    wrapper.unmount();
    container.remove();
  });

  it("shows script import warning in dialog for Python files", async ({
    expect,
  }) => {
    const pinia = createTestPinia();
    const container = createContainer();
    const { wrapper } = mountImportSection({ attachTo: container, pinia });

    const pyContent =
      "from mininet.net import Mininet\nnet = Mininet()\nnet.start()\nnet.stop()\n";
    const file = new File([pyContent], "network.py", { type: "text/x-python" });

    const fileInput = wrapper.find('input[type="file"]');
    const inputEl = fileInput.element;

    Object.defineProperty(inputEl, "files", {
      value: [file],
      writable: false,
    });

    await fileInput.trigger("input");
    // Wait for FileReader onloadend
    await expect
      .poll(() => document.body.textContent)
      .toContain("Imported project won't contain node positions");

    const confirmBtn = document.querySelector(
      '[data-cy="import-warning-confirm"]',
    );
    if (confirmBtn) {
      confirmBtn.click();
      await flushPromises();
    }

    wrapper.unmount();
    container.remove();
  });

  it("triggers click on hidden file input when File button is clicked", async ({
    expect,
  }) => {
    const container = createContainer();
    const { wrapper } = mountImportSection({ attachTo: container });

    const fileInput = wrapper.find('input[type="file"]');
    const clickSpy = vi.spyOn(fileInput.element, "click");

    const buttons = wrapper.findAllComponents({ name: "VBtn" });
    const fileBtn = buttons.find((btn) => btn.text() === "File");
    await fileBtn.trigger("click");

    expect(clickSpy).toHaveBeenCalledTimes(1);

    clickSpy.mockRestore();
    wrapper.unmount();
    container.remove();
  });

  it("shows error alert when file content is malformed and parsing throws", async ({
    expect,
  }) => {
    const pinia = createTestPinia();
    const container = createContainer();
    const { wrapper, appStore } = mountImportSection({
      attachTo: container,
      pinia,
    });

    const malformedJson = "{ this is not valid json !!!";
    const file = new File([malformedJson], "broken.json", {
      type: "application/json",
    });

    const fileInput = wrapper.find('input[type="file"]');
    const inputEl = fileInput.element;

    Object.defineProperty(inputEl, "files", {
      value: [file],
      writable: false,
    });

    await fileInput.trigger("input");
    // Wait for FileReader onloadend
    await expect.poll(() => appStore.alert.type).toBe("error");

    expect(appStore.alert.text).toBe("Import failed.");
    expect(appStore.working).toBe(false);

    wrapper.unmount();
    container.remove();
  });

  it("imports example data when an example item is clicked", async ({
    expect,
  }) => {
    const pinia = createTestPinia();
    const container = createContainer();
    const { wrapper, appStore } = mountImportSection({
      attachTo: container,
      pinia,
    });

    const buttons = wrapper.findAllComponents({ name: "VBtn" });
    const examplesBtn = buttons.find((btn) => btn.text() === "Examples");
    await examplesBtn.trigger("click");
    await expect
      .poll(() => document.querySelectorAll(".v-list-item-title").length)
      .toBeGreaterThan(0);

    // Click the first example item
    const listItems = document.querySelectorAll(".v-list-item-title");
    expect(listItems.length).toBeGreaterThan(0);
    listItems[0].click();
    await expect
      .poll(() => document.querySelector('[data-cy="import-warning-confirm"]'))
      .toBeTruthy();

    // The confirmation dialog should appear; confirm the import
    const confirmBtn = document.querySelector(
      '[data-cy="import-warning-confirm"]',
    );
    expect(confirmBtn).not.toBeNull();
    confirmBtn.click();
    await expect.poll(() => appStore.alert.type).toBe("success");

    expect(appStore.alert.text).toBe("Successfully imported.");

    wrapper.unmount();
    container.remove();
  });

  it("emits log event when importing a file", async ({ expect }) => {
    const pinia = createTestPinia();
    const container = createContainer();
    const { wrapper } = mountImportSection({ attachTo: container, pinia });

    const jsonContent = '{"version":0,"items":[]}';
    const file = new File([jsonContent], "test.json", {
      type: "application/json",
    });

    const fileInput = wrapper.find('input[type="file"]');
    const inputEl = fileInput.element;

    Object.defineProperty(inputEl, "files", {
      value: [file],
      writable: false,
    });

    await fileInput.trigger("input");
    await expect.poll(() => wrapper.emitted("log")).toBeTruthy();

    expect(wrapper.emitted("log")[0][0]).toEqual([]);

    const confirmBtn = document.querySelector(
      '[data-cy="import-warning-confirm"]',
    );
    if (confirmBtn) {
      confirmBtn.click();
      await flushPromises();
    }

    wrapper.unmount();
    container.remove();
  });
});
