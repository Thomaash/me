import { describe, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import { createStore } from "vuex";
import TopologyToolbar from "@/components/TopologyToolbar.vue";

function createMockStore({ canUndo = 0, canRedo = 0 } = {}) {
  return createStore({
    state() {
      return {
        loading: false,
        working: false,
        isUpdateAvailable: false,
        alert: { show: false },
      };
    },
    modules: {
      topology: {
        namespaced: true,
        state() {
          return {
            data: { items: {} },
            past: Array(canUndo).fill(null),
            future: Array(canRedo).fill(null),
          };
        },
        getters: {
          canUndo: (s) => s.past.length,
          canRedo: (s) => s.future.length,
          data: (s) => s.data,
        },
        actions: {
          undo() {},
          redo() {},
        },
      },
    },
  });
}

function mountToolbar({
  undoRedo = false,
  canUndo = 0,
  canRedo = 0,
  routeName = "CanvasEditor",
  routeFullPath = "/canvas",
} = {}) {
  const vuetify = createVuetify();
  const store = createMockStore({ canUndo, canRedo });
  const wrapper = mount(TopologyToolbar, {
    props: { undoRedo },
    global: {
      plugins: [vuetify, store],
      mocks: {
        $route: {
          name: routeName,
          fullPath: routeFullPath,
        },
        $router: {
          options: {
            history: {
              createHref: (url) => url,
            },
          },
        },
      },
    },
  });
  return { wrapper, store };
}

describe.concurrent("TopologyToolbar", () => {
  it("mounts successfully in Vuetify context with mock Vuex store", ({ expect }) => {
    const { wrapper } = mountToolbar();

    expect(wrapper.exists()).toBe(true);
  });

  it("renders undo and redo buttons when undoRedo prop is true", ({ expect }) => {
    const { wrapper } = mountToolbar({ undoRedo: true });

    const buttons = wrapper.findAllComponents({ name: "VBtn" });
    const buttonTexts = buttons.map((btn) => {
      const icon = btn.findComponent({ name: "VIcon" });
      return icon.exists() ? icon.attributes("alt") : "";
    });

    expect(buttonTexts).toContain("Undo");
    expect(buttonTexts).toContain("Redo");
  });

  it("does not render undo and redo buttons when undoRedo prop is false", ({ expect }) => {
    const { wrapper } = mountToolbar({ undoRedo: false });

    const buttons = wrapper.findAllComponents({ name: "VBtn" });
    const buttonTexts = buttons.map((btn) => {
      const icon = btn.findComponent({ name: "VIcon" });
      return icon.exists() ? icon.attributes("alt") : "";
    });

    expect(buttonTexts).not.toContain("Undo");
    expect(buttonTexts).not.toContain("Redo");
  });

  it("disables undo button when canUndo is falsy and enables when truthy", ({ expect }) => {
    const { wrapper: wrapperDisabled } = mountToolbar({
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

    const { wrapper: wrapperEnabled } = mountToolbar({
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

  it("renders toolbar buttons when items exist", ({ expect }) => {
    const { wrapper } = mountToolbar();

    const buttons = wrapper.findAllComponents({ name: "VBtn" });
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("dispatches topology/undo when undo button is clicked", async ({ expect }) => {
    const { wrapper, store } = mountToolbar({
      undoRedo: true,
      canUndo: 3,
    });
    const dispatchSpy = vi.spyOn(store, "dispatch");

    const buttons = wrapper.findAllComponents({ name: "VBtn" });
    const undoBtn = buttons.find((btn) => {
      const icon = btn.findComponent({ name: "VIcon" });
      return icon.exists() && icon.attributes("alt") === "Undo";
    });
    await undoBtn.trigger("click");

    expect(dispatchSpy).toHaveBeenCalledWith("topology/undo");
  });

  it("dispatches topology/redo when redo button is clicked", async ({ expect }) => {
    const { wrapper, store } = mountToolbar({
      undoRedo: true,
      canRedo: 2,
    });
    const dispatchSpy = vi.spyOn(store, "dispatch");

    const buttons = wrapper.findAllComponents({ name: "VBtn" });
    const redoBtn = buttons.find((btn) => {
      const icon = btn.findComponent({ name: "VIcon" });
      return icon.exists() && icon.attributes("alt") === "Redo";
    });
    await redoBtn.trigger("click");

    expect(dispatchSpy).toHaveBeenCalledWith("topology/redo");
  });

  it("opens view URL based on route when open view popup button is clicked", async ({ expect }) => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    const { wrapper: canvasWrapper } = mountToolbar({
      routeName: "CanvasEditor",
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

    const { wrapper: otherWrapper } = mountToolbar({
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
