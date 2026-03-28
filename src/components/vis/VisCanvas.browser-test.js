import { describe, it, vi } from "vitest";
import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import { createStore } from "vuex";
import VisCanvas from "@/components/vis/VisCanvas.vue";
import { canvasDark, canvasLight, itemsDark, itemsLight } from "@/theme";

function createMockStore({ items, zeroBoundingBox = false } = {}) {
  const defaultItems = {
    h1: {
      id: "h1",
      type: "host",
      hostname: "h1",
      x: 0,
      y: 0,
    },
  };
  return createStore({
    state() {
      return {
        loading: false,
        working: false,
        isUpdateAvailable: false,
        alert: { show: false },
      };
    },
    mutations: {
      clearAlert() {},
      setWorking() {},
    },
    modules: {
      topology: {
        namespaced: true,
        state() {
          return {
            data: {
              items: items || defaultItems,
            },
            past: [],
            future: [],
          };
        },
        getters: {
          data: (s) => s.data,
          canUndo: () => 0,
          canRedo: () => 0,
          boundingBox: () =>
            zeroBoundingBox
              ? () => ({
                  sX: 0,
                  eX: 0,
                  sY: 0,
                  eY: 0,
                  width: 0,
                  height: 0,
                  empty: true,
                })
              : () => ({
                  sX: 0,
                  eX: 100,
                  sY: 0,
                  eY: 100,
                  width: 100,
                  height: 100,
                  empty: false,
                }),
        },
        mutations: {
          importData() {},
          applyChange() {},
        },
        actions: {
          updateItems() {},
          removeItems() {},
          replaceItems() {},
        },
      },
    },
  });
}

function mountVisCanvas({ dark = false, items, zeroBoundingBox = false } = {}) {
  const vuetify = createVuetify();
  const store = createMockStore({ items, zeroBoundingBox });
  return mount(VisCanvas, {
    attachTo: document.body,
    props: {
      dark,
    },
    global: {
      plugins: [vuetify, store],
    },
  });
}

describe.concurrent("VisCanvas", () => {
  it("mounts in Vuetify context and renders container with class vis-container", ({
    expect,
  }) => {
    const wrapper = mountVisCanvas();

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find(".vis-container").exists()).toBe(true);
    wrapper.unmount();
  });

  it("renders inner div with class vis-root", ({ expect }) => {
    const wrapper = mountVisCanvas();

    expect(wrapper.find(".vis-root").exists()).toBe(true);
    wrapper.unmount();
  });

  it("emits ready event after mounting", ({ expect }) => {
    const wrapper = mountVisCanvas();

    expect(wrapper.emitted("ready")).toBeTruthy();
    expect(wrapper.emitted("ready").length).toBe(1);

    const payload = wrapper.emitted("ready")[0][0];
    expect(payload).toHaveProperty("container");
    expect(payload).toHaveProperty("net");
    expect(payload).toHaveProperty("nodes");
    expect(payload).toHaveProperty("edges");
    wrapper.unmount();
  });

  describe("theme computed", () => {
    it("selects dark theme colors and dark item colors when dark=true", ({
      expect,
    }) => {
      const wrapper = mountVisCanvas({ dark: true });
      const vm = wrapper.vm;

      // Dark theme should use canvasDark foreground/background
      expect(vm.theme.foreground).toBe(canvasDark.foreground);
      expect(vm.theme.background).toBe(canvasDark.background);

      // Dark theme should use itemsDark colors
      expect(vm.theme.items.controller).toBe(itemsDark.controller);
      expect(vm.theme.items.host).toBe(itemsDark.host);
      expect(vm.theme.items.port).toBe(itemsDark.port);
      expect(vm.theme.items.switch).toBe(itemsDark.switch);
      expect(vm.theme.items.dummy).toBe(itemsDark.dummy);

      // Images should be defined
      expect(vm.theme.images.controller).toBeDefined();
      expect(vm.theme.images.host).toBeDefined();
      expect(vm.theme.images.port).toBeDefined();
      expect(vm.theme.images.switch).toBeDefined();

      wrapper.unmount();
    });

    it("selects light theme colors and light item colors when dark=false", ({
      expect,
    }) => {
      const wrapper = mountVisCanvas({ dark: false });
      const vm = wrapper.vm;

      // Light theme should use canvasLight foreground/background
      expect(vm.theme.foreground).toBe(canvasLight.foreground);
      expect(vm.theme.background).toBe(canvasLight.background);

      // Light theme should use itemsLight colors
      expect(vm.theme.items.controller).toBe(itemsLight.controller);
      expect(vm.theme.items.host).toBe(itemsLight.host);
      expect(vm.theme.items.port).toBe(itemsLight.port);
      expect(vm.theme.items.switch).toBe(itemsLight.switch);
      expect(vm.theme.items.dummy).toBe(itemsLight.dummy);

      wrapper.unmount();
    });

    it("produces different images for dark vs light themes", ({ expect }) => {
      const wrapperDark = mountVisCanvas({ dark: true });
      const wrapperLight = mountVisCanvas({ dark: false });

      const darkImages = wrapperDark.vm.theme.images;
      const lightImages = wrapperLight.vm.theme.images;

      // Dark and light should use different image references
      expect(darkImages.controller).not.toBe(lightImages.controller);
      expect(darkImages.host).not.toBe(lightImages.host);
      expect(darkImages.port).not.toBe(lightImages.port);
      expect(darkImages.switch).not.toBe(lightImages.switch);

      wrapperDark.unmount();
      wrapperLight.unmount();
    });
  });

  describe("options computed", () => {
    it("generates vis-network configuration with physics disabled and correct groups", ({
      expect,
    }) => {
      const wrapper = mountVisCanvas({ dark: false });
      const vm = wrapper.vm;
      const opts = vm.options;

      expect(opts.physics.enabled).toBe(false);
      expect(opts.nodes.borderWidth).toBeCloseTo(0.0001);
      expect(opts.nodes.borderWidthSelected).toBe(2);
      expect(opts.nodes.font.align).toBe("center");
      expect(opts.nodes.font.face).toBe("Source Sans 3");
      expect(opts.nodes.font.strokeWidth).toBe(0);
      expect(opts.nodes.shapeProperties.borderRadius).toBe(6);
      expect(opts.nodes.shapeProperties.useBorderWithImage).toBe(true);
      expect(opts.nodes.scaling.label.maxVisible).toBe(Number.MAX_SAFE_INTEGER);

      expect(opts.edges.smooth).toBe(false);
      expect(opts.edges.font.align).toBe("top");
      expect(opts.edges.font.face).toBe("Source Sans 3");

      expect(opts.interaction.hover).toBe(true);
      expect(opts.interaction.navigationButtons).toBe(false);
      expect(opts.interaction.keyboard).toBe(false);

      expect(opts.manipulation.enabled).toBe(false);

      expect(opts.groups.controller.shape).toBe("image");
      expect(opts.groups.host.shape).toBe("image");
      expect(opts.groups.port.shape).toBe("image");
      expect(opts.groups.switch.shape).toBe("image");
      expect(opts.groups.dummy.shape).toBe("box");

      expect(opts.groups.controller.size).toBe(25);
      expect(opts.groups.host.size).toBe(25);
      expect(opts.groups.port.size).toBe(10);
      expect(opts.groups.switch.size).toBe(25);

      expect(opts.groups.dummy.font.face).toBe("Source Code Pro");
      expect(opts.groups.dummy.font.align).toBe("left");
      expect(opts.groups.dummy.borderWidth).toBe(1);

      wrapper.unmount();
    });

    it("uses theme foreground color in node and edge fonts", ({ expect }) => {
      const wrapper = mountVisCanvas({ dark: true });
      const vm = wrapper.vm;
      const opts = vm.options;
      const fg = vm.theme.foreground;

      expect(opts.nodes.font.color).toBe(fg);
      expect(opts.edges.font.color).toBe(fg);
      expect(opts.groups.dummy.font.color).toBe(fg);

      wrapper.unmount();
    });
  });

  describe("widthStyle and heightStyle computed", () => {
    it("returns undefined when width/height are null", ({ expect }) => {
      const wrapper = mountVisCanvas();
      const vm = wrapper.vm;

      expect(vm.widthStyle).toBeUndefined();
      expect(vm.heightStyle).toBeUndefined();

      wrapper.unmount();
    });

    it("returns pixel string when width/height are numeric", async ({
      expect,
    }) => {
      const wrapper = mountVisCanvas();
      const vm = wrapper.vm;

      vm.width = 500;
      vm.height = 300;
      await nextTick();

      expect(vm.widthStyle).toBe("500px");
      expect(vm.heightStyle).toBe("300px");

      wrapper.unmount();
    });
  });

  describe("replaceItems method", () => {
    it("populates nodes and edges datasets from store items", ({ expect }) => {
      const items = {
        s1: {
          id: "s1",
          type: "switch",
          hostname: "s1",
          x: 0,
          y: 0,
        },
        h1: {
          id: "h1",
          type: "host",
          hostname: "h1",
          x: 10,
          y: 10,
        },
        e1: {
          id: "e1",
          type: "link",
          from: "s1",
          to: "h1",
          hostname: "link-1",
        },
      };
      const wrapper = mountVisCanvas({ items });
      const vm = wrapper.vm;

      // After mount, replaceItems was called; check datasets
      const nodeIds = vm.nodes.getIds();
      const edgeIds = vm.edges.getIds();

      expect(nodeIds).toContain("s1");
      expect(nodeIds).toContain("h1");
      expect(edgeIds).toContain("e1");

      wrapper.unmount();
    });

    it("calls updateLabels when net exists during replaceItems", ({
      expect,
    }) => {
      const items = {
        d1: {
          id: "d1",
          type: "dummy",
          hostname: "dummy-label",
          x: 0,
          y: 0,
        },
      };
      const wrapper = mountVisCanvas({ items });
      const vm = wrapper.vm;

      const updateLabelsSpy = vi.spyOn(vm, "updateLabels");

      // Call replaceItems -- net exists, so updateLabels should be called
      vm.replaceItems();

      expect(updateLabelsSpy).toHaveBeenCalled();

      wrapper.unmount();
    });
  });

  describe("updateLabels method", () => {
    it("updates only dummy nodes in the dataset", ({ expect }) => {
      const items = {
        d1: {
          id: "d1",
          type: "dummy",
          hostname: "dummy-label",
          x: 0,
          y: 0,
        },
        h1: {
          id: "h1",
          type: "host",
          hostname: "h1",
          x: 10,
          y: 10,
        },
      };
      const wrapper = mountVisCanvas({ items });
      const vm = wrapper.vm;

      // Spy on nodes.update to see what gets called
      const updateSpy = vi.spyOn(vm.nodes, "update");
      vm.updateLabels();

      expect(updateSpy).toHaveBeenCalledOnce();
      const updateArg = updateSpy.mock.calls[0][0];
      // Only dummy items should be in the update
      const dummyUpdate = updateArg.find((n) => n.id === "d1");
      expect(dummyUpdate).toBeDefined();
      expect(dummyUpdate.group).toBe("dummy");
      // Non-dummy should not be included
      const hostUpdate = updateArg.find((n) => n.id === "h1");
      expect(hostUpdate).toBeUndefined();

      wrapper.unmount();
    });

    it("updates only specific ids when ids parameter is provided", ({
      expect,
    }) => {
      const items = {
        d1: {
          id: "d1",
          type: "dummy",
          hostname: "dummy-label-1",
          x: 0,
          y: 0,
        },
        d2: {
          id: "d2",
          type: "dummy",
          hostname: "dummy-label-2",
          x: 5,
          y: 5,
        },
        h1: {
          id: "h1",
          type: "host",
          hostname: "h1",
          x: 10,
          y: 10,
        },
      };
      const wrapper = mountVisCanvas({ items });
      const vm = wrapper.vm;

      const updateSpy = vi.spyOn(vm.nodes, "update");
      vm.updateLabels(["d1"]);

      expect(updateSpy).toHaveBeenCalledOnce();
      const updateArg = updateSpy.mock.calls[0][0];
      expect(updateArg.length).toBe(1);
      expect(updateArg[0].id).toBe("d1");

      wrapper.unmount();
    });
  });

  describe("mounted lifecycle", () => {
    it("creates Network instance and subscribes to store mutations", ({
      expect,
    }) => {
      const wrapper = mountVisCanvas();
      const vm = wrapper.vm;

      // net should be a vis Network instance
      expect(vm.net).toBeDefined();
      expect(typeof vm.net.destroy).toBe("function");

      // nodes and edges should be DataSet instances
      expect(vm.nodes).toBeDefined();
      expect(typeof vm.nodes.add).toBe("function");
      expect(typeof vm.nodes.clear).toBe("function");
      expect(vm.edges).toBeDefined();
      expect(typeof vm.edges.add).toBe("function");

      // cleanUpCallbacks should have at least 2 entries (destroy + unsubscribe)
      expect(vm.cleanUpCallbacks.length).toBeGreaterThanOrEqual(2);

      wrapper.unmount();
    });
  });

  describe("beforeUnmount cleanup", () => {
    it("calls all cleanup callbacks and handles errors gracefully", ({
      expect,
    }) => {
      const wrapper = mountVisCanvas();
      const vm = wrapper.vm;

      const callOrder = [];
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // Add a normal callback and an error-throwing callback
      vm.cleanUpCallbacks.push(() => callOrder.push("normal"));
      vm.cleanUpCallbacks.push(() => {
        throw new Error("cleanup error");
      });
      vm.cleanUpCallbacks.push(() => callOrder.push("after-error"));

      wrapper.unmount();

      // All callbacks should have been called despite the error
      expect(callOrder).toContain("normal");
      expect(callOrder).toContain("after-error");
      expect(errorSpy).toHaveBeenCalled();

      errorSpy.mockRestore();
    });
  });

  describe("storeActions computed", () => {
    it("topology/importData action calls replaceItems", ({ expect }) => {
      const items = {
        s1: {
          id: "s1",
          type: "switch",
          hostname: "s1",
          x: 0,
          y: 0,
        },
      };
      const wrapper = mountVisCanvas({ items });
      const vm = wrapper.vm;

      const replaceItemsSpy = vi.spyOn(vm, "replaceItems");

      // Trigger the importData action handler
      vm.storeActions["topology/importData"]();

      expect(replaceItemsSpy).toHaveBeenCalledOnce();

      wrapper.unmount();
    });

    it("topology/applyChange action updates, replaces and removes items", ({
      expect,
    }) => {
      const items = {
        s1: {
          id: "s1",
          type: "switch",
          hostname: "s1",
          x: 0,
          y: 0,
        },
        h1: {
          id: "h1",
          type: "host",
          hostname: "h1",
          x: 10,
          y: 10,
        },
        h2: {
          id: "h2",
          type: "host",
          hostname: "h2",
          x: 20,
          y: 20,
        },
        e1: {
          id: "e1",
          type: "link",
          from: "s1",
          to: "h1",
          hostname: "link-1",
        },
        e2: {
          id: "e2",
          type: "link",
          from: "s1",
          to: "h2",
          hostname: "link-2",
        },
      };
      const wrapper = mountVisCanvas({ items });
      const vm = wrapper.vm;

      const nodesRemoveSpy = vi.spyOn(vm.nodes, "remove");
      const edgesRemoveSpy = vi.spyOn(vm.edges, "remove");
      const nodesAddSpy = vi.spyOn(vm.nodes, "add");
      const edgesAddSpy = vi.spyOn(vm.edges, "add");

      // Update includes both a node-type (switch) and an edge-type (link e1)
      // Replace includes both a node-type (host h2) and an edge-type (link e2)
      // This covers both branches: isEdge true and false in update and replace
      vm.storeActions["topology/applyChange"]({
        update: [
          {
            id: "s1",
            hostname: "s1-updated",
          },
          {
            id: "e1",
            hostname: "link-1-updated",
          },
        ],
        replace: [
          {
            id: "h2",
            type: "host",
            hostname: "h2-replaced",
            x: 20,
            y: 20,
          },
          {
            id: "e2",
            type: "link",
            from: "s1",
            to: "h2",
            hostname: "link-2-replaced",
          },
        ],
        remove: [],
      });

      expect(nodesRemoveSpy).toHaveBeenCalled();
      expect(edgesRemoveSpy).toHaveBeenCalled();
      expect(nodesAddSpy).toHaveBeenCalled();
      expect(edgesAddSpy).toHaveBeenCalled();

      wrapper.unmount();
    });
  });

  describe("toTileBlobs method", () => {
    /**
     * Installs mock net event/redraw/view plumbing needed by toTileBlobs.
     * Returns { eventHandlers } so callers can inspect captured handlers.
     */
    /**
     * Installs mock net event/redraw/view plumbing needed by toTileBlobs.
     * Returns { eventHandlers, allHandlers } -- allHandlers preserves every
     * registered handler even after off() removes it from eventHandlers.
     */
    function stubNetForTiling(vm, { canvasSize = 100, view } = {}) {
      const eventHandlers = {};
      const allHandlers = {};

      vm.net.on = (event, handler) => {
        eventHandlers[event] = handler;
        allHandlers[event] = handler;
        if (event === "resize") {
          Promise.resolve().then(() => handler());
        }
      };

      vm.net.off = (event, handler) => {
        if (eventHandlers[event] === handler) {
          delete eventHandlers[event];
        }
      };

      vm.net.moveTo = vi.fn();

      vm.net.redraw = () => {
        if (eventHandlers["afterDrawing"]) {
          const handler = eventHandlers["afterDrawing"];
          const fakeCanvas = {
            width: canvasSize,
            height: canvasSize,
            toBlob: (cb, type) => cb(new Blob(["tile"], { type })),
          };
          handler({ canvas: fakeCanvas });
        }
      };

      vm.net.view = view || {
        targetTranslation: { x: 0, y: 0 },
        targetScale: 1,
      };

      return { eventHandlers, allHandlers };
    }

    it("throws RangeError when bounding box has zero dimensions", async ({
      expect,
    }) => {
      const wrapper = mountVisCanvas({ zeroBoundingBox: true });
      const vm = wrapper.vm;

      await expect(
        vm.toTileBlobs({
          onBlob: () => {},
          scale: 1,
          tileWidth: 100,
          tileHeight: 100,
        }),
      ).rejects.toThrow("Image has to have non-zero size.");

      wrapper.unmount();
    });

    it("renders tiles and calls onBlob for each tile", async ({ expect }) => {
      const wrapper = mountVisCanvas();
      const vm = wrapper.vm;
      stubNetForTiling(vm, { canvasSize: 200 });

      const tileBlobs = [];
      await vm.toTileBlobs({
        canvasWidth: 200,
        canvasHeight: 200,
        onBlob: (blob, info) => {
          tileBlobs.push({ blob, info });
        },
        scale: 1,
        tileWidth: 200,
        tileHeight: 200,
      });

      // 200/200 = 1x1 = 1 tile
      expect(tileBlobs.length).toBe(1);
      expect(tileBlobs[0].blob).toBeInstanceOf(Blob);
      expect(tileBlobs[0].info.totalTiles).toBe(1);
      expect(tileBlobs[0].info.cols).toBe(1);
      expect(tileBlobs[0].info.rows).toBe(1);
      expect(tileBlobs[0].info.doneTiles).toBe(1);
      expect(vm.net.moveTo).toHaveBeenCalled();

      wrapper.unmount();
    });

    it("renders multiple tiles for large canvases", async ({ expect }) => {
      const wrapper = mountVisCanvas();
      const vm = wrapper.vm;
      stubNetForTiling(vm, { canvasSize: 100 });

      const tileBlobs = [];
      await vm.toTileBlobs({
        canvasWidth: 200,
        canvasHeight: 200,
        onBlob: (blob, info) => {
          tileBlobs.push({ blob, info });
        },
        scale: 1,
        tileWidth: 100,
        tileHeight: 100,
      });

      // 200/100 = 2 cols, 200/100 = 2 rows = 4 tiles
      expect(tileBlobs.length).toBe(4);
      expect(tileBlobs[3].info.totalTiles).toBe(4);
      expect(tileBlobs[3].info.doneTiles).toBe(4);
      expect(tileBlobs[3].info.row).toBe(1);
      expect(tileBlobs[3].info.col).toBe(1);

      wrapper.unmount();
    });

    it("invokes beforeDrawing handler that fills white background", async ({
      expect,
    }) => {
      const wrapper = mountVisCanvas();
      const vm = wrapper.vm;
      const { allHandlers } = stubNetForTiling(vm, {
        canvasSize: 100,
        view: { targetTranslation: { x: 10, y: 20 }, targetScale: 2 },
      });

      await vm.toTileBlobs({
        canvasWidth: 100,
        canvasHeight: 100,
        onBlob: () => {},
        scale: 1,
        tileWidth: 100,
        tileHeight: 100,
      });

      // Now test the beforeDrawing handler (preserved in allHandlers after off() cleanup)
      const beforeDrawingHandler = allHandlers["beforeDrawing"];
      expect(beforeDrawingHandler).toBeDefined();
      const fillRectCalls = [];
      const fakeCtx = {
        fillStyle: "",
        fillRect: (...args) => fillRectCalls.push(args),
        canvas: { width: 100, height: 100 },
      };
      beforeDrawingHandler(fakeCtx);

      expect(fakeCtx.fillStyle).toBe("#fff");
      expect(fillRectCalls.length).toBe(1);

      wrapper.unmount();
    });
  });

  describe("options watcher", () => {
    it("calls net.setOptions when options change due to theme change", async ({
      expect,
    }) => {
      const wrapper = mountVisCanvas({ dark: false });
      const vm = wrapper.vm;

      const setOptionsSpy = vi.spyOn(vm.net, "setOptions");

      await wrapper.setProps({ dark: true });
      await nextTick();

      expect(setOptionsSpy).toHaveBeenCalled();

      wrapper.unmount();
    });
  });
});
