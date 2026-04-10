import { describe, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import { createPinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import TopologyToolbar from "@/components/TopologyToolbar.vue";
import { useTopologyStore } from "@/store/topologyStore";

function createTestPinia({ canUndo = 0, canRedo = 0 } = {}) {
  const pinia = createPinia();
  pinia.state.value.app = {
    loading: false,
    working: false,
    isUpdateAvailable: false,
    alert: { show: false },
  };
  pinia.state.value.topology = {
    data: { items: {}, projectName: "Test", startScript: "" },
    past: Array(canUndo).fill(null),
    future: Array(canRedo).fill(null),
  };
  return pinia;
}

function createMockRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: "/canvas",
        name: "CanvasEditor",
        component: { template: "<div />" },
      },
      {
        path: "/canvas/:id",
        name: "CanvasEditorWithId",
        component: { template: "<div />" },
      },
      { path: "/home", name: "HomePage", component: { template: "<div />" } },
      {
        path: "/view/canvas",
        name: "ViewCanvas",
        component: { template: "<div />" },
      },
      {
        path: "/view/canvas/:id",
        name: "ViewCanvasWithId",
        component: { template: "<div />" },
      },
    ],
  });
}

async function mountToolbar({
  undoRedo = false,
  canUndo = 0,
  canRedo = 0,
  routeFullPath = "/canvas",
} = {}) {
  const vuetify = createVuetify();
  const pinia = createTestPinia({ canUndo, canRedo });
  const router = createMockRouter();
  await router.push(routeFullPath);
  await router.isReady();
  const wrapper = mount(TopologyToolbar, {
    props: { undoRedo },
    global: {
      plugins: [vuetify, pinia, router],
    },
  });
  const topologyStore = useTopologyStore(pinia);
  return { wrapper, topologyStore, router };
}

describe("TopologyToolbar", () => {
  it("mounts successfully in Vuetify context with Pinia store", async ({
    expect,
  }) => {
    const { wrapper } = await mountToolbar();

    expect(wrapper.exists()).toBe(true);
  });

  it("renders undo and redo buttons when undoRedo prop is true", async ({
    expect,
  }) => {
    const { wrapper } = await mountToolbar({ undoRedo: true });

    const buttons = wrapper.findAllComponents({ name: "VBtn" });
    const buttonTexts = buttons.map((btn) => {
      const icon = btn.findComponent({ name: "VIcon" });
      return icon.exists() ? icon.attributes("alt") : "";
    });

    expect(buttonTexts).toContain("Undo");
    expect(buttonTexts).toContain("Redo");
  });

  it("does not render undo and redo buttons when undoRedo prop is false", async ({
    expect,
  }) => {
    const { wrapper } = await mountToolbar({ undoRedo: false });

    const buttons = wrapper.findAllComponents({ name: "VBtn" });
    const buttonTexts = buttons.map((btn) => {
      const icon = btn.findComponent({ name: "VIcon" });
      return icon.exists() ? icon.attributes("alt") : "";
    });

    expect(buttonTexts).not.toContain("Undo");
    expect(buttonTexts).not.toContain("Redo");
  });

  it("disables undo button when canUndo is falsy and enables when truthy", async ({
    expect,
  }) => {
    const { wrapper: wrapperDisabled } = await mountToolbar({
      undoRedo: true,
      canUndo: 0,
      canRedo: 0,
    });
    const buttonsDisabled = wrapperDisabled.findAllComponents({ name: "VBtn" });
    const undoDisabled = buttonsDisabled.find((btn) => {
      const icon = btn.findComponent({ name: "VIcon" });
      return icon.exists() && icon.attributes("alt") === "Undo";
    });
    expect(undoDisabled).toBeDefined();
    expect(undoDisabled.attributes("disabled")).toBeDefined();

    const { wrapper: wrapperEnabled } = await mountToolbar({
      undoRedo: true,
      canUndo: 3,
      canRedo: 0,
    });
    const buttonsEnabled = wrapperEnabled.findAllComponents({ name: "VBtn" });
    const undoEnabled = buttonsEnabled.find((btn) => {
      const icon = btn.findComponent({ name: "VIcon" });
      return icon.exists() && icon.attributes("alt") === "Undo";
    });
    expect(undoEnabled).toBeDefined();
    expect(undoEnabled.attributes("disabled")).toBeUndefined();
  });

  it("renders toolbar buttons when items exist", async ({ expect }) => {
    const { wrapper } = await mountToolbar();

    const buttons = wrapper.findAllComponents({ name: "VBtn" });
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("calls topologyStore.undo when undo button is clicked", async ({
    expect,
  }) => {
    const { wrapper, topologyStore } = await mountToolbar({
      undoRedo: true,
      canUndo: 3,
    });
    const undoSpy = vi
      .spyOn(topologyStore, "undo")
      .mockImplementation(() => {});

    const buttons = wrapper.findAllComponents({ name: "VBtn" });
    const undoBtn = buttons.find((btn) => {
      const icon = btn.findComponent({ name: "VIcon" });
      return icon.exists() && icon.attributes("alt") === "Undo";
    });
    await undoBtn.trigger("click");

    expect(undoSpy).toHaveBeenCalled();
  });

  it("calls topologyStore.redo when redo button is clicked", async ({
    expect,
  }) => {
    const { wrapper, topologyStore } = await mountToolbar({
      undoRedo: true,
      canRedo: 2,
    });
    const redoSpy = vi
      .spyOn(topologyStore, "redo")
      .mockImplementation(() => {});

    const buttons = wrapper.findAllComponents({ name: "VBtn" });
    const redoBtn = buttons.find((btn) => {
      const icon = btn.findComponent({ name: "VIcon" });
      return icon.exists() && icon.attributes("alt") === "Redo";
    });
    await redoBtn.trigger("click");

    expect(redoSpy).toHaveBeenCalled();
  });

  it("opens view URL based on route when open view popup button is clicked", async ({
    expect,
  }) => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    const { wrapper: canvasWrapper } = await mountToolbar({
      routeName: "CanvasEditorWithId",
      routeFullPath: "/canvas/123",
    });
    const canvasButtons = canvasWrapper.findAllComponents({ name: "VBtn" });
    const canvasOpenBtn = canvasButtons.find((btn) => {
      const icon = btn.findComponent({ name: "VIcon" });
      return icon.exists() && icon.attributes("alt") === "Open a new view";
    });
    await canvasOpenBtn.trigger("click");
    expect(openSpy).toHaveBeenCalledWith("/view/canvas/123", "", "_blank");

    openSpy.mockClear();

    const { wrapper: otherWrapper } = await mountToolbar({
      routeName: "HomePage",
      routeFullPath: "/home",
    });
    const otherButtons = otherWrapper.findAllComponents({ name: "VBtn" });
    const otherOpenBtn = otherButtons.find((btn) => {
      const icon = btn.findComponent({ name: "VIcon" });
      return icon.exists() && icon.attributes("alt") === "Open a new view";
    });
    await otherOpenBtn.trigger("click");
    expect(openSpy).toHaveBeenCalledWith("/view/canvas", "", "_blank");

    openSpy.mockRestore();
  });
});
