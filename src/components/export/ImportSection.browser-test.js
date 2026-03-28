import { describe, it, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import { createStore } from "vuex";
import ImportSection from "@/components/export/ImportSection.vue";

function createMockStore({ working = false } = {}) {
  return createStore({
    state() {
      return {
        loading: false,
        working,
        isUpdateAvailable: false,
        alert: { show: false },
      };
    },
    mutations: {
      setWorking(state, val) {
        state.working = val.working ?? val;
      },
      setAlert(state, val) {
        state.alert = val;
      },
      clearAlert(state) {
        state.alert = { show: false };
      },
    },
    modules: {
      topology: {
        namespaced: true,
        state() {
          return {
            data: { items: {} },
            past: [],
            future: [],
          };
        },
        getters: {
          data: (s) => s.data,
          canUndo: (s) => s.past.length,
          canRedo: (s) => s.future.length,
          boundingBox: () => () => ({
            sX: 0,
            eX: 100,
            sY: 0,
            eY: 100,
            width: 100,
            height: 100,
          }),
        },
        mutations: {
          importData(state, data) {
            state.data = data;
          },
        },
      },
    },
  });
}

function createContainer() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  return container;
}

function mountImportSection({ working = false, attachTo, store } = {}) {
  const vuetify = createVuetify();
  const resolvedStore = store || createMockStore({ working });
  const options = {
    global: {
      plugins: [vuetify, resolvedStore],
    },
  };
  if (attachTo) {
    options.attachTo = attachTo;
  }
  return { wrapper: mount(ImportSection, options), store: resolvedStore };
}

async function waitForDialog() {
  await flushPromises();
  await new Promise((resolve) => setTimeout(resolve, 50));
  await flushPromises();
}

describe.concurrent("ImportSection", () => {
  it("mounts successfully in Vuetify context with mock Vuex store", ({
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

    // Wait for Vuetify menu overlay to render
    await new Promise((resolve) => setTimeout(resolve, 100));

    const expectedTitles = [
      "Tiny without controller",
      "Tiny with controller",
      "Tiny with physical interface",
      "Tiny with traffic control",
      "Tiny with Mininet settings",
      "Medium with 1 controller",
      "Medium with 2 controllers",
    ];

    // Vuetify menus render to an overlay; check the full document body
    const bodyText = document.body.textContent;
    for (const title of expectedTitles) {
      expect(bodyText).toContain(title);
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
    const store = createMockStore();
    const container = createContainer();
    const { wrapper } = mountImportSection({ attachTo: container, store });

    const fileInput = wrapper.find('input[type="file"]');

    await fileInput.trigger("change");
    await flushPromises();

    // working should remain false since retrieveFile returned early
    expect(store.state.working).toBe(false);
    // No alert should be set
    expect(store.state.alert.show).toBe(false);

    wrapper.unmount();
    container.remove();
  });
});

describe("ImportSection dialog interactions", () => {
  it("shows confirmation dialog and imports data when confirmed via Empty button", async ({
    expect,
  }) => {
    const store = createMockStore();
    const container = createContainer();
    const { wrapper } = mountImportSection({ attachTo: container, store });

    const emptyBtn = wrapper
      .findAllComponents({ name: "VBtn" })
      .find((btn) => btn.text() === "Empty");
    emptyBtn.trigger("click");
    await waitForDialog();

    const confirmBtn = document.querySelector(
      '[data-cy="import-warning-confirm"]',
    );
    expect(confirmBtn).not.toBeNull();
    confirmBtn.click();
    await waitForDialog();

    expect(store.state.alert.type).toBe("success");
    expect(store.state.alert.text).toBe("Successfully imported.");

    wrapper.unmount();
    container.remove();
  });

  it("shows confirmation dialog and cancels import when cancel is clicked", async ({
    expect,
  }) => {
    const store = createMockStore();
    const container = createContainer();
    const { wrapper } = mountImportSection({ attachTo: container, store });

    const emptyBtn = wrapper
      .findAllComponents({ name: "VBtn" })
      .find((btn) => btn.text() === "Empty");
    emptyBtn.trigger("click");
    await waitForDialog();

    const cancelBtn = document.querySelector(
      '[data-cy="import-warning-cancel"]',
    );
    expect(cancelBtn).not.toBeNull();
    cancelBtn.click();
    await waitForDialog();

    expect(store.state.alert.type).toBe("info");
    expect(store.state.alert.text).toBe("Import canceled.");

    wrapper.unmount();
    container.remove();
  });

  it("sets working state during importData and resets after confirm", async ({
    expect,
  }) => {
    const store = createMockStore();
    const container = createContainer();
    const { wrapper } = mountImportSection({ attachTo: container, store });

    const emptyBtn = wrapper
      .findAllComponents({ name: "VBtn" })
      .find((btn) => btn.text() === "Empty");
    emptyBtn.trigger("click");
    await flushPromises();

    expect(store.state.working).toBe(true);

    const confirmBtn = document.querySelector(
      '[data-cy="import-warning-confirm"]',
    );
    confirmBtn.click();
    await waitForDialog();

    expect(store.state.working).toBe(false);

    wrapper.unmount();
    container.remove();
  });

  it("commits topology importData mutation when import is confirmed", async ({
    expect,
  }) => {
    const store = createMockStore();
    const commitSpy = vi.fn(store.commit.bind(store));
    store.commit = commitSpy;
    const container = createContainer();
    const { wrapper } = mountImportSection({ attachTo: container, store });

    const emptyBtn = wrapper
      .findAllComponents({ name: "VBtn" })
      .find((btn) => btn.text() === "Empty");
    emptyBtn.trigger("click");
    await waitForDialog();

    const confirmBtn = document.querySelector(
      '[data-cy="import-warning-confirm"]',
    );
    confirmBtn.click();
    await waitForDialog();

    const importCalls = commitSpy.mock.calls.filter(
      ([mutation]) => mutation === "topology/importData",
    );
    expect(importCalls.length).toBeGreaterThanOrEqual(1);

    wrapper.unmount();
    container.remove();
  });

  it("processes a JSON file via retrieveFile and imports after confirmation", async ({
    expect,
  }) => {
    const store = createMockStore();
    const container = createContainer();
    const { wrapper } = mountImportSection({ attachTo: container, store });

    const jsonContent = '{"version":1,"items":[{"id":"test"}]}';
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
    await new Promise((resolve) => setTimeout(resolve, 200));
    await flushPromises();

    const confirmBtn = document.querySelector(
      '[data-cy="import-warning-confirm"]',
    );
    expect(confirmBtn).not.toBeNull();
    confirmBtn.click();
    await waitForDialog();

    expect(store.state.alert.type).toBe("success");
    expect(store.state.alert.text).toBe("Successfully imported.");
    expect(store.state.working).toBe(false);

    wrapper.unmount();
    container.remove();
  });

  it("shows error alert when file type is unknown in retrieveFile", async ({
    expect,
  }) => {
    const store = createMockStore();
    const container = createContainer();
    const { wrapper } = mountImportSection({ attachTo: container, store });

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
    await new Promise((resolve) => setTimeout(resolve, 200));
    await flushPromises();

    expect(store.state.alert.type).toBe("error");
    expect(store.state.alert.text).toContain("Unknown file format");
    expect(store.state.working).toBe(false);

    wrapper.unmount();
    container.remove();
  });

  it("shows script import warning in dialog for Python files", async ({
    expect,
  }) => {
    const store = createMockStore();
    const container = createContainer();
    const { wrapper } = mountImportSection({ attachTo: container, store });

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
    await new Promise((resolve) => setTimeout(resolve, 300));
    await flushPromises();

    // The dialog should be showing with script import warning text
    const dialogText = document.body.textContent;
    expect(dialogText).toContain(
      "Imported project won't contain node positions",
    );

    const confirmBtn = document.querySelector(
      '[data-cy="import-warning-confirm"]',
    );
    if (confirmBtn) {
      confirmBtn.click();
      await waitForDialog();
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
    const store = createMockStore();
    const container = createContainer();
    const { wrapper } = mountImportSection({ attachTo: container, store });

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
    await new Promise((resolve) => setTimeout(resolve, 200));
    await flushPromises();

    expect(store.state.alert.type).toBe("error");
    expect(store.state.alert.text).toBe("Import failed.");
    expect(store.state.working).toBe(false);

    wrapper.unmount();
    container.remove();
  });

  it("imports example data when an example item is clicked", async ({
    expect,
  }) => {
    const store = createMockStore();
    const container = createContainer();
    const { wrapper } = mountImportSection({ attachTo: container, store });

    const buttons = wrapper.findAllComponents({ name: "VBtn" });
    const examplesBtn = buttons.find((btn) => btn.text() === "Examples");
    await examplesBtn.trigger("click");
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Click the first example item
    const listItems = document.querySelectorAll(".v-list-item-title");
    expect(listItems.length).toBeGreaterThan(0);
    listItems[0].click();
    await waitForDialog();

    // The confirmation dialog should appear; confirm the import
    const confirmBtn = document.querySelector(
      '[data-cy="import-warning-confirm"]',
    );
    expect(confirmBtn).not.toBeNull();
    confirmBtn.click();
    await waitForDialog();

    expect(store.state.alert.type).toBe("success");
    expect(store.state.alert.text).toBe("Successfully imported.");

    wrapper.unmount();
    container.remove();
  });

  it("emits log event when importing a file", async ({ expect }) => {
    const store = createMockStore();
    const container = createContainer();
    const { wrapper } = mountImportSection({ attachTo: container, store });

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
    await new Promise((resolve) => setTimeout(resolve, 200));
    await flushPromises();

    expect(wrapper.emitted("log")).toBeTruthy();
    expect(wrapper.emitted("log")[0][0]).toEqual([]);

    const confirmBtn = document.querySelector(
      '[data-cy="import-warning-confirm"]',
    );
    if (confirmBtn) {
      confirmBtn.click();
      await waitForDialog();
    }

    wrapper.unmount();
    container.remove();
  });
});
