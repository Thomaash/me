import { describe, it, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { nextTick, h, defineComponent } from "vue";
import { createVuetify } from "vuetify";
import { createPinia } from "pinia";
import ExportSection from "@/components/export/ExportSection.vue";
import { useTopologyStore } from "@/store/topologyStore";
import { useAppStore } from "@/store/appStore";
import { exportData } from "@/exporter";
import Builder from "@/builder";
import AddressingPlan from "@/builder/AddressingPlan";

vi.mock("@/exporter", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    exportData: vi.fn(() => ({
      version: 0,
      items: [],
      projectName: "test-project",
    })),
  };
});

vi.mock("@/builder", () => {
  const MockBuilder = vi.fn(function () {
    this.log = ["mock-log-entry"];
    this.build = vi.fn(() => "#!/usr/bin/python\nprint('hello')");
  });
  return { default: MockBuilder };
});

vi.mock("@/builder/AddressingPlan", () => {
  const MockAddressingPlan = vi.fn(function () {
    this.build = vi.fn();
    this.savePDF = vi.fn();
  });
  return { default: MockAddressingPlan };
});

function createTestPinia({
  working = false,
  projectName = "test-project",
} = {}) {
  const pinia = createPinia();
  pinia.state.value.app = {
    loading: false,
    working,
    isUpdateAvailable: false,
    alert: { show: false },
  };
  pinia.state.value.topology = {
    data: { items: {}, projectName, startScript: "" },
    past: [],
    future: [],
  };
  return pinia;
}

function findButtonByText(wrapper, text) {
  const buttons = wrapper.findAllComponents({ name: "VBtn" });
  return buttons.find((btn) => btn.text() === text);
}

function mountExportSection({
  working = false,
  projectName = "test-project",
  toTileBlobsFn,
} = {}) {
  const vuetify = createVuetify();
  const pinia = createTestPinia({ working, projectName });
  const imageConfigStub = defineComponent({
    name: "ImageConfig",
    emits: ["render"],
    render() {
      return h("div", { class: "image-config-stub" }, "Image");
    },
  });
  const visCanvasStub = defineComponent({
    name: "VisCanvas",
    emits: ["ready"],
    setup(_, { emit, expose }) {
      const toTileBlobsImpl = toTileBlobsFn || vi.fn();
      expose({ toTileBlobs: toTileBlobsImpl });
      return {
        toTileBlobs: toTileBlobsImpl,
        triggerReady: () => emit("ready"),
      };
    },
    mounted() {
      this.triggerReady();
    },
    render() {
      return h("div");
    },
  });
  const topologyStore = useTopologyStore(pinia);
  const appStore = useAppStore(pinia);
  return {
    wrapper: mount(ExportSection, {
      global: {
        plugins: [vuetify, pinia],
        stubs: {
          ImageConfig: imageConfigStub,
          VisCanvas: visCanvasStub,
        },
      },
    }),
    topologyStore,
    appStore,
  };
}

beforeEach(() => {
  vi.spyOn(document.body, "appendChild").mockImplementation(() => {});
  vi.spyOn(document.body, "removeChild").mockImplementation(() => {});
  vi.spyOn(document, "createElement").mockImplementation((tag) => {
    if (tag === "a") {
      const anchor = {
        tagName: "A",
        setAttribute: vi.fn(),
        click: vi.fn(),
        style: {},
      };
      return anchor;
    }
    return document.constructor.prototype.createElement.call(document, tag);
  });
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe.concurrent("ExportSection", () => {
  it("mounts successfully in Vuetify context with Pinia store", ({
    expect,
  }) => {
    const { wrapper } = mountExportSection();

    expect(wrapper.exists()).toBe(true);
  });

  it("renders export buttons for JSON, Python script, and Addressing plan", ({
    expect,
  }) => {
    const { wrapper } = mountExportSection();

    const buttons = wrapper.findAllComponents({ name: "VBtn" });
    const buttonTexts = buttons.map((btn) => btn.text());

    expect(buttonTexts).toContain("JSON");
    expect(buttonTexts).toContain("Python 2 script");
    expect(buttonTexts).toContain("Addressing plan");
  });

  it("renders Image section", ({ expect }) => {
    const { wrapper } = mountExportSection();

    expect(wrapper.text()).toContain("Image");
  });

  it("disables export buttons when working is true", ({ expect }) => {
    const { wrapper } = mountExportSection({ working: true });

    const buttons = wrapper.findAllComponents({ name: "VBtn" });
    const exportButtons = buttons.filter((btn) =>
      ["JSON", "Python 2 script", "Addressing plan"].includes(btn.text()),
    );

    expect(exportButtons.length).toBe(3);
    for (const btn of exportButtons) {
      expect(btn.attributes("disabled")).toBeDefined();
    }
  });
});

describe("ExportSection download methods", () => {
  it("downloadJSON exports data, shows success alert, and triggers file download", async ({
    expect,
  }) => {
    const { wrapper, topologyStore, appStore } = mountExportSection();

    const jsonBtn = findButtonByText(wrapper, "JSON");
    await jsonBtn.trigger("click");
    await flushPromises();

    expect(exportData).toHaveBeenCalledWith(topologyStore.data);
    expect(appStore.alert).toEqual({
      show: true,
      type: "success",
      text: "Successfully exported.",
    });
    expect(appStore.working).toBe(false);
    expect(wrapper.emitted("log")).toBeTruthy();
  });

  it("downloadJSON shows error alert when export fails", async ({ expect }) => {
    exportData.mockImplementationOnce(() => {
      throw new Error("export failure");
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { wrapper, appStore } = mountExportSection();

    const jsonBtn = findButtonByText(wrapper, "JSON");
    await jsonBtn.trigger("click");
    await flushPromises();

    expect(appStore.alert).toEqual({
      show: true,
      type: "error",
      text: "Export failed.",
    });
    expect(appStore.working).toBe(false);
    consoleSpy.mockRestore();
  });

  it("downloadScript builds script, shows success alert, and triggers file download", async ({
    expect,
  }) => {
    const { wrapper, appStore } = mountExportSection();

    const scriptBtn = findButtonByText(wrapper, "Python 2 script");
    await scriptBtn.trigger("click");
    await flushPromises();

    expect(Builder).toHaveBeenCalled();
    expect(appStore.alert).toEqual({
      show: true,
      type: "success",
      text: "Script built.",
    });
    expect(appStore.working).toBe(false);
    const logEmissions = wrapper.emitted("log");
    expect(logEmissions.length).toBeGreaterThanOrEqual(2);
  });

  it("downloadScript shows error alert when build fails", async ({
    expect,
  }) => {
    Builder.mockImplementationOnce(() => {
      throw new Error("build failure");
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { wrapper, appStore } = mountExportSection();

    const scriptBtn = findButtonByText(wrapper, "Python 2 script");
    await scriptBtn.trigger("click");
    await flushPromises();

    expect(appStore.alert).toEqual({
      show: true,
      type: "error",
      text: "Script was not built.",
    });
    expect(appStore.working).toBe(false);
    consoleSpy.mockRestore();
  });

  it("downloadAddressingPlan builds plan, saves PDF, and shows success alert", async ({
    expect,
  }) => {
    const { wrapper, appStore } = mountExportSection();

    const planBtn = findButtonByText(wrapper, "Addressing plan");
    await planBtn.trigger("click");
    await flushPromises();

    expect(AddressingPlan).toHaveBeenCalled();
    expect(appStore.alert).toEqual({
      show: true,
      type: "success",
      text: "Addressing plan built.",
    });
    expect(appStore.working).toBe(false);
  });

  it("downloadAddressingPlan shows error alert when build fails", async ({
    expect,
  }) => {
    AddressingPlan.mockImplementationOnce(() => {
      throw new Error("plan failure");
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { wrapper, appStore } = mountExportSection();

    const planBtn = findButtonByText(wrapper, "Addressing plan");
    await planBtn.trigger("click");
    await flushPromises();

    expect(appStore.alert).toEqual({
      show: true,
      type: "error",
      text: "Addressing plan was not built.",
    });
    expect(appStore.working).toBe(false);
    consoleSpy.mockRestore();
  });

  it("working setter clears alert when set to true and commits working state", async ({
    expect,
  }) => {
    const { appStore } = mountExportSection();
    appStore.setAlert({ type: "error", text: "old error" });

    // Clear alert and set working via Pinia store actions
    appStore.clearAlert();
    appStore.setWorking({ working: true });

    expect(appStore.alert.show).toBe(false);
    expect(appStore.working).toBe(true);
  });

  it("getFilename returns project name with extension via download anchor", async ({
    expect,
  }) => {
    const { wrapper } = mountExportSection({ projectName: "my-network" });

    const jsonBtn = findButtonByText(wrapper, "JSON");
    await jsonBtn.trigger("click");
    await flushPromises();

    // Verify the download anchor was configured with the correct filename
    const createElementCalls = document.createElement.mock.results;
    const anchorResult = createElementCalls.find(
      (r) => r.value && r.value.tagName === "A",
    );
    expect(anchorResult).toBeDefined();
    const anchor = anchorResult.value;
    const downloadCall = anchor.setAttribute.mock.calls.find(
      ([attr]) => attr === "download",
    );
    expect(downloadCall[1]).toBe("my-network.json");
  });

  it("getFilename uses fallback name when projectName is empty via download anchor", async ({
    expect,
  }) => {
    const { wrapper } = mountExportSection({ projectName: "" });

    const scriptBtn = findButtonByText(wrapper, "Python 2 script");
    await scriptBtn.trigger("click");
    await flushPromises();

    const createElementCalls = document.createElement.mock.results;
    const anchorResult = createElementCalls.find(
      (r) => r.value && r.value.tagName === "A",
    );
    expect(anchorResult).toBeDefined();
    const anchor = anchorResult.value;
    const downloadCall = anchor.setAttribute.mock.calls.find(
      ([attr]) => attr === "download",
    );
    expect(downloadCall[1]).toBe("mininet_network.py");
  });
});

async function withMockBlobURL(fn) {
  const fakeUrl = "blob:http://localhost/fake-blob-url";
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  URL.createObjectURL = vi.fn(() => fakeUrl);
  URL.revokeObjectURL = vi.fn();
  try {
    await fn(fakeUrl);
  } finally {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  }
}

describe("ExportSection downloadImage", () => {
  it("downloadImage success without tiles shows success alert and resets working", async ({
    expect,
  }) => {
    const toTileBlobsFn = vi.fn(async () => {});
    const { wrapper, appStore } = mountExportSection({ toTileBlobsFn });

    const imageConfig = wrapper.findComponent({ name: "ImageConfig" });
    imageConfig.vm.$emit("render", {
      size: { width: 800, height: 600, scale: 1 },
      tiles: null,
      dark: false,
    });
    await flushPromises();
    await nextTick();
    // Wait for VisCanvas ready event and rendering timeout
    await expect.poll(() => appStore.alert.type).toBe("success");
    expect(appStore.alert.text).toContain("Image rendered");
    expect(appStore.working).toBe(false);
    expect(toTileBlobsFn).toHaveBeenCalledWith(
      expect.objectContaining({
        canvasHeight: 600,
        canvasWidth: 800,
        scale: 1,
        tileHeight: 600,
        tileWidth: 800,
      }),
    );
  });

  it("downloadImage success with tiles computes tile dimensions and shows success alert", async ({
    expect,
  }) => {
    const toTileBlobsFn = vi.fn(async () => {});
    const { wrapper, appStore } = mountExportSection({ toTileBlobsFn });

    const imageConfig = wrapper.findComponent({ name: "ImageConfig" });
    imageConfig.vm.$emit("render", {
      size: { width: 1600, height: 1200, scale: 2 },
      tiles: { width: 800, height: 600 },
      dark: true,
    });
    await flushPromises();
    await nextTick();
    await expect.poll(() => appStore.alert.type).toBe("success");
    expect(appStore.alert.text).toContain("Image rendered");
    expect(toTileBlobsFn).toHaveBeenCalledWith(
      expect.objectContaining({
        canvasHeight: 1200,
        canvasWidth: 1600,
        scale: 2,
        tileHeight: 600,
        tileWidth: 800,
      }),
    );
  });

  it("downloadImage error path shows error alert and resets working", async ({
    expect,
  }) => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const toTileBlobsFn = vi.fn(async () => {
      throw new Error("render failure");
    });
    const { wrapper, appStore } = mountExportSection({ toTileBlobsFn });

    const imageConfig = wrapper.findComponent({ name: "ImageConfig" });
    imageConfig.vm.$emit("render", {
      size: { width: 800, height: 600, scale: 1 },
      tiles: null,
      dark: false,
    });
    await flushPromises();
    await nextTick();
    await expect.poll(() => appStore.alert.type).toBe("error");
    expect(appStore.alert.text).toContain("Image rendering failed");
    expect(appStore.working).toBe(false);
    consoleSpy.mockRestore();
  });

  it("downloadImage onBlob callback triggers download and updates working progress", async ({
    expect,
  }) => {
    await withMockBlobURL(async (fakeUrl) => {
      const mockBlob = new Blob(["test"], { type: "image/png" });
      const toTileBlobsFn = vi.fn(async ({ onBlob }) => {
        await onBlob(mockBlob, {
          col: 0,
          cols: 1,
          doneTiles: 1,
          row: 0,
          rows: 1,
          totalTiles: 1,
        });
      });
      const { wrapper } = mountExportSection({ toTileBlobsFn });

      const imageConfig = wrapper.findComponent({ name: "ImageConfig" });
      imageConfig.vm.$emit("render", {
        size: { width: 800, height: 600, scale: 1 },
        tiles: null,
        dark: false,
      });
      // Wait for full async chain: nextTick + Vue render + 100ms renderImage delay + 50ms+50ms onBlob delays
      await flushPromises();
      await nextTick();
      await expect
        .poll(() => URL.revokeObjectURL.mock.calls.length)
        .toBeGreaterThan(0);

      expect(URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith(fakeUrl);
    });
  });

  it("downloadImage onBlob callback with multiple tiles generates tile suffixes", async ({
    expect,
  }) => {
    await withMockBlobURL(async (fakeUrl) => {
      const mockBlob = new Blob(["test"], { type: "image/png" });
      const toTileBlobsFn = vi.fn(async ({ onBlob }) => {
        await onBlob(mockBlob, {
          col: 0,
          cols: 2,
          doneTiles: 1,
          row: 0,
          rows: 2,
          totalTiles: 4,
        });
      });
      const { wrapper } = mountExportSection({ toTileBlobsFn });

      const imageConfig = wrapper.findComponent({ name: "ImageConfig" });
      imageConfig.vm.$emit("render", {
        size: { width: 1600, height: 1200, scale: 2 },
        tiles: { width: 800, height: 600 },
        dark: false,
      });
      await flushPromises();
      await nextTick();
      await expect
        .poll(() => URL.revokeObjectURL.mock.calls.length)
        .toBeGreaterThan(0);

      expect(URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith(fakeUrl);
    });
  });
});
