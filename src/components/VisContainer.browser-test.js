import { describe, it, vi, afterEach } from "vitest";
import { defineComponent, h, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import { createPinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import VisContainer from "@/components/VisContainer.vue";
import { useTopologyStore } from "@/store/topologyStore";

// VisCanvas stub: production-shaped, exposes emitReady so a test can drive `init`.
const VisCanvasStub = defineComponent({
  name: "VisCanvas",
  props: ["dark"],
  emits: ["ready"],
  setup(_props, { emit }) {
    return { emitReady: (payload) => emit("ready", payload) };
  },
  render() {
    return h("div", { class: "vis-canvas-stub" }, "VisCanvas");
  },
});

function createTestPinia({
  loading = false,
  undoThrows = false,
  redoThrows = false,
} = {}) {
  const pinia = createPinia();
  pinia.state.value.app = {
    loading,
    working: false,
    isUpdateAvailable: false,
    alert: { show: false },
  };
  pinia.state.value.topology = {
    data: { items: {}, projectName: "Test", startScript: "" },
    past: [],
    future: [],
  };
  const topologyStore = useTopologyStore(pinia);
  if (undoThrows) {
    topologyStore.undo = () => {
      throw new Error("nothing to undo");
    };
  }
  if (redoThrows) {
    topologyStore.redo = () => {
      throw new Error("nothing to redo");
    };
  }
  return pinia;
}

function createMockNet() {
  return {
    addEdgeMode: vi.fn(),
    addNodeMode: vi.fn(),
    disableEditMode: vi.fn(),
    getSelection: vi.fn(() => ({ nodes: [], edges: [] })),
    setSelection: vi.fn(),
    getSelectedNodes: vi.fn(() => []),
    getSelectedEdges: vi.fn(() => []),
    fit: vi.fn(),
    moveTo: vi.fn(),
    getViewPosition: vi.fn(() => ({ x: 10, y: 20 })),
    getScale: vi.fn(() => 1),
    setOptions: vi.fn(),
    on: vi.fn(),
    getPositions: vi.fn(() => ({})),
    getConnectedNodes: vi.fn(() => []),
    editNode: vi.fn(),
    editEdgeMode: vi.fn(),
    selectNodes: vi.fn(),
  };
}

function createMockDataSet(items = []) {
  return {
    getIds: vi.fn(() => items.map((i) => i.id)),
    get: vi.fn((id) => {
      if (id == null) return items;
      return items.find((i) => i.id === id) || null;
    }),
  };
}

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: "/:ids?",
        name: "Canvas without position",
        component: { template: "<div />" },
      },
      {
        path: "/:x/:y/:scale/:ids?",
        name: "Canvas with position",
        component: { template: "<div />" },
      },
    ],
  });
}

async function mountVisContainer({ loading = false, initialPath = "/" } = {}) {
  const vuetify = createVuetify();
  const pinia = createTestPinia({ loading });
  const router = createTestRouter();
  await router.push(initialPath);
  await router.isReady();
  const mockRouterPush = vi.spyOn(router, "push");
  const topologyStore = useTopologyStore(pinia);
  const wrapper = trackWrapper(
    mount(VisContainer, {
      global: {
        plugins: [vuetify, pinia, router],
        stubs: {
          VisCanvas: VisCanvasStub,
        },
      },
    }),
  );
  return {
    wrapper,
    topologyStore,
    mockRouter: { push: mockRouterPush },
    router,
  };
}

async function mountWithNet({
  undoThrows = false,
  redoThrows = false,
  items = {},
  nodeItems = [],
  edgeItems = [],
  initialPath = "/",
} = {}) {
  const vuetify = createVuetify();
  const pinia = createTestPinia({ loading: false, undoThrows, redoThrows });
  const topologyStore = useTopologyStore(pinia);
  if (Object.keys(items).length > 0) {
    topologyStore.data.items = items;
  }
  const router = createTestRouter();
  await router.push(initialPath);
  await router.isReady();
  const mockRouterPush = vi.spyOn(router, "push");
  const wrapper = trackWrapper(
    mount(VisContainer, {
      global: {
        plugins: [vuetify, pinia, router],
        stubs: {
          VisCanvas: VisCanvasStub,
        },
      },
    }),
  );

  const net = createMockNet();
  const nodes = createMockDataSet(nodeItems);
  const edges = createMockDataSet(edgeItems);
  const container = document.createElement("div");

  // applyURL fitSelected fallback path needs this
  net.getSelectedNodes.mockReturnValue([]);

  // Wire via the ready event emitted by VisCanvasStub (same path as production).
  const visCanvasStub = wrapper.findComponent({ name: "VisCanvas" });
  visCanvasStub.vm.emitReady({ container, net, nodes, edges });

  // Capture handlers registered via net.on for direct invocation in tests
  // that need to drive vis-network callbacks (a public boundary even though
  // the registration happens inside `init`).
  const handlers = {};
  net.on.mock.calls.forEach(([event, handler]) => {
    if (!handlers[event]) handlers[event] = [];
    handlers[event].push(handler);
  });

  // Capture manipulation callbacks passed to net.setOptions.
  const manipulation = net.setOptions.mock.calls[0]?.[0]?.manipulation;

  return {
    wrapper,
    net,
    nodes,
    edges,
    topologyStore,
    handlers,
    manipulation,
    mockRouter: { push: mockRouterPush },
    router,
  };
}

// Dispatch a real keydown on the component-container root element so the
// component's `@keydown` listener (a public DOM handle) is exercised.
function pressKey(wrapper, key, { ctrlKey = false } = {}) {
  const root = wrapper.find(".component-container");
  return root.trigger("keydown", { key, ctrlKey });
}

// Vuetify teleports v-snackbar to <body>; query the document for it.
function getSnackbarEl() {
  return document.querySelector('[data-cy="vis-snackbar"]');
}

function getSnackbarType() {
  const el = getSnackbarEl();
  return el ? el.getAttribute("data-cy-type") : null;
}

function getSnackbarValues() {
  const el = getSnackbarEl();
  if (!el) return null;
  const raw = el.getAttribute("data-cy-values");
  return raw ? JSON.parse(raw) : null;
}

function getSnackbarText() {
  const el = getSnackbarEl();
  return el ? el.textContent.trim() : null;
}

// Wait for the snackbar to render with the given type. The component opens
// the snackbar from a setTimeout so we need a microtask + timer flush.
async function waitForSnackbar(type) {
  for (let i = 0; i < 20; ++i) {
    await new Promise((r) => setTimeout(r, 0));
    await nextTick();
    if (getSnackbarType() === type) return;
  }
}

// Track every wrapper we mount so we can tear them down between tests.
// Vuetify teleports v-snackbar to <body>, so without unmount the snackbar
// element from a previous test would linger and pollute the next test's
// document-level queries.
const mountedWrappers = [];
function trackWrapper(wrapper) {
  mountedWrappers.push(wrapper);
  return wrapper;
}

// NOTE: not concurrent — Vuetify teleports v-snackbar to document.body, so
// concurrent tests would step on each other's rendered snackbar. Running this
// suite sequentially keeps DOM snackbar assertions reliable.
describe("VisContainer", () => {
  afterEach(() => {
    while (mountedWrappers.length) {
      const w = mountedWrappers.pop();
      try {
        w.unmount();
      } catch {
        // ignore — already unmounted
      }
    }
    // Belt-and-braces: any teleported snackbar elements left in body get
    // removed so document-level queries are clean for the next test.
    document
      .querySelectorAll('[data-cy="vis-snackbar"]')
      .forEach((el) => el.remove());
  });
  describe("rendering", () => {
    it("renders root div with tabindex=0 and class component-container", async ({
      expect,
    }) => {
      const { wrapper } = await mountVisContainer({ loading: false });

      const root = wrapper.find(".component-container");
      expect(root.exists()).toBe(true);
      expect(root.attributes("tabindex")).toBe("0");
    });

    it("renders LoadingSpinner when loading is true", async ({ expect }) => {
      const { wrapper } = await mountVisContainer({ loading: true });

      const spinner = wrapper.findComponent({ name: "LoadingSpinner" });
      expect(spinner.exists()).toBe(true);
      expect(wrapper.find(".vis-canvas-stub").exists()).toBe(false);
    });

    it("renders VisCanvas when loading is false", async ({ expect }) => {
      const { wrapper } = await mountVisContainer({ loading: false });

      const spinner = wrapper.findComponent({ name: "LoadingSpinner" });
      expect(spinner.exists()).toBe(false);
      expect(wrapper.find(".vis-canvas-stub").exists()).toBe(true);
    });

    it("renders no mouse-tag by default", async ({ expect }) => {
      const { wrapper } = await mountWithNet();

      expect(wrapper.find(".mouse-tag").exists()).toBe(false);
    });

    it("renders mouse-tag when an add-mode is active", async ({ expect }) => {
      const { wrapper } = await mountWithNet();

      // Enter add-mode through a parent-facing method.
      wrapper.vm.addController();
      await nextTick();

      const tag = wrapper.find(".mouse-tag");
      expect(tag.exists()).toBe(true);
    });

    it("updates mouse-tag position when the root receives mousemove", async ({
      expect,
    }) => {
      const { wrapper } = await mountWithNet();

      wrapper.vm.addController();
      await nextTick();

      await wrapper
        .find(".component-container")
        .trigger("mousemove", { clientX: 150, clientY: 250 });

      const tag = wrapper.find(".mouse-tag");
      expect(tag.exists()).toBe(true);
      expect(tag.attributes("style")).toContain("left: 150px");
      expect(tag.attributes("style")).toContain("top: 250px");
    });
  });

  // Parent-facing FAB methods exposed via wrapper ref. These are part of the
  // public contract consumed by CanvasPage.vue.
  describe("parent-facing add* / delete commands", () => {
    it("addEdge enters edge add-mode", async ({ expect }) => {
      const { wrapper, net } = await mountWithNet();

      wrapper.vm.addEdge();
      await nextTick();

      expect(net.addEdgeMode).toHaveBeenCalledOnce();
      // Public signal: mouse-tag visible (newItem.type set).
      expect(wrapper.find(".mouse-tag").exists()).toBe(true);
    });

    it("addController enters node add-mode", async ({ expect }) => {
      const { wrapper, net } = await mountWithNet();

      wrapper.vm.addController();
      await nextTick();

      expect(net.addNodeMode).toHaveBeenCalledOnce();
      expect(wrapper.find(".mouse-tag").exists()).toBe(true);
    });

    it("addDummy enters node add-mode", async ({ expect }) => {
      const { wrapper, net } = await mountWithNet();

      wrapper.vm.addDummy();
      await nextTick();

      expect(net.addNodeMode).toHaveBeenCalledOnce();
      expect(wrapper.find(".mouse-tag").exists()).toBe(true);
    });

    it("addHost enters node add-mode", async ({ expect }) => {
      const { wrapper, net } = await mountWithNet();

      wrapper.vm.addHost();
      await nextTick();

      expect(net.addNodeMode).toHaveBeenCalledOnce();
      expect(wrapper.find(".mouse-tag").exists()).toBe(true);
    });

    it("addPort enters node add-mode", async ({ expect }) => {
      const { wrapper, net } = await mountWithNet();

      wrapper.vm.addPort();
      await nextTick();

      expect(net.addNodeMode).toHaveBeenCalledOnce();
      expect(wrapper.find(".mouse-tag").exists()).toBe(true);
    });

    it("addSwitch enters node add-mode", async ({ expect }) => {
      const { wrapper, net } = await mountWithNet();

      wrapper.vm.addSwitch();
      await nextTick();

      expect(net.addNodeMode).toHaveBeenCalledOnce();
      expect(wrapper.find(".mouse-tag").exists()).toBe(true);
    });

    it("deleteSelected removes selection, shows undo snackbar, and updates URL", async ({
      expect,
    }) => {
      const { wrapper, net, topologyStore, mockRouter } = await mountWithNet();
      net.getSelection.mockReturnValue({ nodes: ["n1", "n2"], edges: ["e1"] });
      const removeItemsSpy = vi.spyOn(topologyStore, "removeItems");
      mockRouter.push.mockClear();

      wrapper.vm.deleteSelected();

      expect(removeItemsSpy).toHaveBeenCalledWith(["n1", "n2", "e1"]);

      await waitForSnackbar("items-deleted");
      expect(getSnackbarType()).toBe("items-deleted");
      expect(getSnackbarValues()).toEqual([3]);
      expect(getSnackbarText()).toContain("3 items deleted.");

      // URL updated after delete
      expect(mockRouter.push).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Canvas with position" }),
      );
    });

    it("deleteSelected with empty selection is a no-op", async ({ expect }) => {
      const { wrapper, net, topologyStore } = await mountWithNet();
      net.getSelection.mockReturnValue({ nodes: [], edges: [] });
      const removeItemsSpy = vi.spyOn(topologyStore, "removeItems");

      wrapper.vm.deleteSelected();

      expect(removeItemsSpy).not.toHaveBeenCalled();
      expect(getSnackbarType()).not.toBe("items-deleted");
    });
  });

  // Keyboard shortcuts: assert by driving keydown on the root (a true public
  // signal). For Slice 3 we will narrow defineExpose, so non-FAB methods are
  // exercised here exclusively via keydown.
  describe("keyboard shortcuts", () => {
    it("a triggers fitAll (net.fit + clearURLPosition)", async ({ expect }) => {
      const { wrapper, net, mockRouter } = await mountWithNet();
      mockRouter.push.mockClear();

      await pressKey(wrapper, "a");

      expect(net.fit).toHaveBeenCalledWith({ animation: true });
      expect(mockRouter.push).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Canvas without position" }),
      );
    });

    it("f triggers fitSelected (net.fit on selected nodes + clearURLPosition)", async ({
      expect,
    }) => {
      const { wrapper, net, mockRouter } = await mountWithNet();
      net.getSelectedNodes.mockReturnValue(["n1"]);
      mockRouter.push.mockClear();

      await pressKey(wrapper, "f");

      expect(net.fit).toHaveBeenCalledWith({
        nodes: ["n1"],
        animation: true,
      });
      expect(mockRouter.push).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Canvas without position" }),
      );
    });

    it("z triggers setScale (net.moveTo with scale)", async ({ expect }) => {
      const { wrapper, net } = await mountWithNet();

      await pressKey(wrapper, "z");

      expect(net.moveTo).toHaveBeenCalledWith({
        scale: 1,
        animation: true,
      });
    });

    it("c/h/i/l/p/s/t each enter a node-add mode", async ({ expect }) => {
      for (const key of ["c", "h", "i", "l", "p", "s", "t"]) {
        const { wrapper, net } = await mountWithNet();

        await pressKey(wrapper, key);

        expect(
          net.addNodeMode,
          `key ${key} should call addNodeMode`,
        ).toHaveBeenCalledOnce();
        // Public signal of add-mode: mouse-tag is rendered.
        expect(wrapper.find(".mouse-tag").exists()).toBe(true);
      }
    });

    it("e enters edge-add mode (net.addEdgeMode)", async ({ expect }) => {
      const { wrapper, net } = await mountWithNet();

      await pressKey(wrapper, "e");

      expect(net.addEdgeMode).toHaveBeenCalledOnce();
      expect(wrapper.find(".mouse-tag").exists()).toBe(true);
    });

    it("d triggers deleteSelected (net.getSelection consulted)", async ({
      expect,
    }) => {
      const { wrapper, net } = await mountWithNet();
      net.getSelection.mockReturnValue({ nodes: ["n1"], edges: [] });

      await pressKey(wrapper, "d");

      expect(net.getSelection).toHaveBeenCalled();
      await waitForSnackbar("items-deleted");
      expect(getSnackbarType()).toBe("items-deleted");
    });

    it("Delete also triggers deleteSelected", async ({ expect }) => {
      const { wrapper, net } = await mountWithNet();
      net.getSelection.mockReturnValue({ nodes: ["n1"], edges: [] });

      await pressKey(wrapper, "Delete");

      expect(net.getSelection).toHaveBeenCalled();
    });

    it("Escape leaves any add-mode (mouse-tag disappears, edit mode disabled)", async ({
      expect,
    }) => {
      const { wrapper, net } = await mountWithNet();

      wrapper.vm.addHost();
      await nextTick();
      expect(wrapper.find(".mouse-tag").exists()).toBe(true);

      await pressKey(wrapper, "Escape");
      await nextTick();

      expect(wrapper.find(".mouse-tag").exists()).toBe(false);
      expect(net.disableEditMode).toHaveBeenCalled();
    });

    it("ctrl+a selects all and updates URL", async ({ expect }) => {
      const { wrapper, net, nodes, edges, mockRouter } = await mountWithNet();
      nodes.getIds.mockReturnValue(["n1", "n2"]);
      edges.getIds.mockReturnValue(["e1"]);
      mockRouter.push.mockClear();

      await pressKey(wrapper, "a", { ctrlKey: true });

      expect(net.setSelection).toHaveBeenCalledWith({
        nodes: ["n1", "n2"],
        edges: ["e1"],
      });
      expect(mockRouter.push).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Canvas with position" }),
      );
    });

    it("ctrl+z calls undo and shows the undone snackbar", async ({
      expect,
    }) => {
      const { wrapper, topologyStore } = await mountWithNet();
      const undoSpy = vi
        .spyOn(topologyStore, "undo")
        .mockImplementation(() => {});

      await pressKey(wrapper, "z", { ctrlKey: true });

      expect(undoSpy).toHaveBeenCalled();
      await waitForSnackbar("undone");
      expect(getSnackbarType()).toBe("undone");
      expect(getSnackbarText()).toContain("Undone.");
    });

    it("ctrl+z shows nothing-to-undo snackbar when undo throws", async ({
      expect,
    }) => {
      const { wrapper } = await mountWithNet({ undoThrows: true });

      await pressKey(wrapper, "z", { ctrlKey: true });

      await waitForSnackbar("nothing-to-undo");
      expect(getSnackbarType()).toBe("nothing-to-undo");
      expect(getSnackbarText()).toContain("Nothing more to undo.");
    });

    it("ctrl+y calls redo and shows the redone snackbar", async ({
      expect,
    }) => {
      const { wrapper, topologyStore } = await mountWithNet();
      const redoSpy = vi
        .spyOn(topologyStore, "redo")
        .mockImplementation(() => {});

      await pressKey(wrapper, "y", { ctrlKey: true });

      expect(redoSpy).toHaveBeenCalled();
      await waitForSnackbar("redone");
      expect(getSnackbarType()).toBe("redone");
      expect(getSnackbarText()).toContain("Redone.");
    });

    it("ctrl+y shows nothing-to-redo snackbar when redo throws", async ({
      expect,
    }) => {
      const { wrapper } = await mountWithNet({ redoThrows: true });

      await pressKey(wrapper, "y", { ctrlKey: true });

      await waitForSnackbar("nothing-to-redo");
      expect(getSnackbarType()).toBe("nothing-to-redo");
      expect(getSnackbarText()).toContain("Nothing more to redo.");
    });

    it("unmapped keys do not interact with the network", async ({ expect }) => {
      const { wrapper, net } = await mountWithNet();
      // init() calls applyURL -> fitSelected -> net.fit. Clear any side
      // effects from initialization so we only observe what `q` triggers.
      Object.values(net).forEach(
        (fn) => typeof fn?.mockClear === "function" && fn.mockClear(),
      );

      await pressKey(wrapper, "q");

      expect(net.addEdgeMode).not.toHaveBeenCalled();
      expect(net.addNodeMode).not.toHaveBeenCalled();
      expect(net.fit).not.toHaveBeenCalled();
      expect(net.moveTo).not.toHaveBeenCalled();
      expect(net.getSelection).not.toHaveBeenCalled();
    });
  });

  describe("snackbar message text", () => {
    it("renders 'Undone.' for the undone type", async ({ expect }) => {
      const { wrapper, topologyStore } = await mountWithNet();
      vi.spyOn(topologyStore, "undo").mockImplementation(() => {});
      await pressKey(wrapper, "z", { ctrlKey: true });
      await waitForSnackbar("undone");
      expect(getSnackbarText()).toContain("Undone.");
    });

    it("renders 'Redone.' for the redone type", async ({ expect }) => {
      const { wrapper, topologyStore } = await mountWithNet();
      vi.spyOn(topologyStore, "redo").mockImplementation(() => {});
      await pressKey(wrapper, "y", { ctrlKey: true });
      await waitForSnackbar("redone");
      expect(getSnackbarText()).toContain("Redone.");
    });

    it("renders 'Nothing more to undo.' when undo throws", async ({
      expect,
    }) => {
      const { wrapper } = await mountWithNet({ undoThrows: true });
      await pressKey(wrapper, "z", { ctrlKey: true });
      await waitForSnackbar("nothing-to-undo");
      expect(getSnackbarText()).toContain("Nothing more to undo.");
    });

    it("renders 'Nothing more to redo.' when redo throws", async ({
      expect,
    }) => {
      const { wrapper } = await mountWithNet({ redoThrows: true });
      await pressKey(wrapper, "y", { ctrlKey: true });
      await waitForSnackbar("nothing-to-redo");
      expect(getSnackbarText()).toContain("Nothing more to redo.");
    });

    it("renders singular '1 item deleted.' for a single-item delete", async ({
      expect,
    }) => {
      const { wrapper, net } = await mountWithNet();
      net.getSelection.mockReturnValue({ nodes: ["n1"], edges: [] });
      wrapper.vm.deleteSelected();
      await waitForSnackbar("items-deleted");
      expect(getSnackbarText()).toContain("1 item deleted.");
    });

    it("renders plural 'N items deleted.' for multi-item deletes", async ({
      expect,
    }) => {
      const { wrapper, net } = await mountWithNet();
      net.getSelection.mockReturnValue({ nodes: ["n1", "n2"], edges: ["e1"] });
      wrapper.vm.deleteSelected();
      await waitForSnackbar("items-deleted");
      expect(getSnackbarText()).toContain("3 items deleted.");
    });
  });

  // URL sync: assert via the mocked router push (a public signal: navigation
  // is what production observers see).
  describe("URL sync", () => {
    it("updateURL via ctrl+a includes rounded view position, scale, and selected ids", async ({
      expect,
    }) => {
      const { wrapper, net, nodes, edges, mockRouter } = await mountWithNet();
      net.getViewPosition.mockReturnValue({ x: 100.4, y: 200.6 });
      net.getScale.mockReturnValue(1.5);
      net.getSelection.mockReturnValue({ nodes: ["n1"], edges: ["e1"] });
      nodes.getIds.mockReturnValue(["n1"]);
      edges.getIds.mockReturnValue(["e1"]);
      mockRouter.push.mockClear();

      await pressKey(wrapper, "a", { ctrlKey: true });

      expect(mockRouter.push).toHaveBeenCalledWith({
        name: "Canvas with position",
        params: {
          ids: "n1,e1",
          x: 100,
          y: 201,
          scale: 1.5,
        },
      });
    });

    it("clearURLPosition pushes Canvas without position on fitAll (key a)", async ({
      expect,
    }) => {
      const { wrapper, mockRouter } = await mountWithNet();
      mockRouter.push.mockClear();

      await pressKey(wrapper, "a");

      expect(mockRouter.push).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Canvas without position" }),
      );
    });

    it("setScale (key z) updates URL with Canvas with position", async ({
      expect,
    }) => {
      const { wrapper, mockRouter } = await mountWithNet();
      mockRouter.push.mockClear();

      await pressKey(wrapper, "z");

      expect(mockRouter.push).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Canvas with position" }),
      );
    });

    it("on init, when the route already has params, applyURL selects ids and moves to the position", async ({
      expect,
    }) => {
      const vuetify = createVuetify();
      const pinia = createTestPinia({ loading: false });
      const router = createTestRouter();
      await router.push("/100/200/1.5/n1,e1");
      await router.isReady();
      const wrapper = trackWrapper(
        mount(VisContainer, {
          global: {
            plugins: [vuetify, pinia, router],
            stubs: { VisCanvas: VisCanvasStub },
          },
        }),
      );

      const net = createMockNet();
      const nodes = createMockDataSet([{ id: "n1", group: "host" }]);
      const edges = createMockDataSet([{ id: "e1" }]);
      const container = document.createElement("div");

      wrapper
        .findComponent({ name: "VisCanvas" })
        .vm.emitReady({ container, net, nodes, edges });

      expect(net.setSelection).toHaveBeenCalledWith({
        nodes: ["n1"],
        edges: ["e1"],
      });
      expect(net.moveTo).toHaveBeenCalledWith({
        position: { x: 100, y: 200 },
        scale: 1.5,
      });
    });

    it("on init with no position params, applyURL falls back to fitSelected", async ({
      expect,
    }) => {
      // Default mountWithNet path is "/" with no params; init triggers applyURL
      // which calls fitSelected (no animation) -> net.fit + clearURLPosition.
      const { net, mockRouter } = await mountWithNet();

      expect(net.fit).toHaveBeenCalled();
      // clearURLPosition pushes Canvas without position
      expect(mockRouter.push).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Canvas without position" }),
      );
    });
  });

  // init-time orchestration: vis-network event registration and manipulation
  // wiring. These cross the boundary between VisContainer and the (stubbed)
  // VisCanvas via the `ready` payload, so they remain public-ish even though
  // the assertions touch the captured callbacks.
  describe("init wires vis-network", () => {
    it("registers the expected vis-network events", async ({ expect }) => {
      const { net } = await mountWithNet();

      const registered = net.on.mock.calls.map((c) => c[0]);
      expect(registered).toContain("deselectNode");
      expect(registered).toContain("deselectEdge");
      expect(registered).toContain("doubleClick");
      expect(registered).toContain("hold");
      expect(registered).toContain("dragEnd");
      expect(registered).toContain("dragStart");
      expect(registered).toContain("select");
      expect(registered).toContain("zoom");
    });

    it("configures manipulation callbacks (addNode/addEdge/editNode/editEdge)", async ({
      expect,
    }) => {
      const { net, manipulation } = await mountWithNet();

      expect(net.setOptions).toHaveBeenCalledOnce();
      expect(manipulation).toBeDefined();
      expect(manipulation.enabled).toBe(false);
      expect(typeof manipulation.addNode).toBe("function");
      expect(typeof manipulation.addEdge).toBe("function");
      expect(typeof manipulation.editNode).toBe("function");
      expect(typeof manipulation.editEdge).toBe("function");
    });

    it("on init with uncommitted node positions, persists them to the store", async ({
      expect,
    }) => {
      // Drive the production code path: nodes returned from .get() that lack
      // x/y should be committed via topologyStore.updateItems during init.
      const vuetify = createVuetify();
      const pinia = createTestPinia({ loading: false });
      const topologyStore = useTopologyStore(pinia);
      const router = createTestRouter();
      await router.push("/");
      await router.isReady();
      const wrapper = trackWrapper(
        mount(VisContainer, {
          global: {
            plugins: [vuetify, pinia, router],
            stubs: { VisCanvas: VisCanvasStub },
          },
        }),
      );

      const net = createMockNet();
      const nodeItems = [
        { id: "n1", x: null, y: null },
        { id: "n2", x: 10, y: 20 },
      ];
      const nodes = createMockDataSet(nodeItems);
      const edges = createMockDataSet([]);
      net.getPositions.mockReturnValue({ n1: { x: 100, y: 200 } });
      const updateItemsSpy = vi
        .spyOn(topologyStore, "updateItems")
        .mockImplementation(() => {});

      wrapper.findComponent({ name: "VisCanvas" }).vm.emitReady({
        container: document.createElement("div"),
        net,
        nodes,
        edges,
      });

      expect(updateItemsSpy).toHaveBeenCalledWith([
        { x: 100, y: 200, id: "n1" },
      ]);
    });
  });

  describe("vis-network event handlers", () => {
    async function initWithHandlers() {
      return mountWithNet({
        items: {
          n1: { type: "host", hostname: "h1" },
          n2: { type: "switch", hostname: "s1" },
          p1: { type: "port", hostname: "eth0" },
        },
        nodeItems: [
          { id: "n1", group: "host" },
          { id: "n2", group: "switch" },
          { id: "p1", group: "port" },
        ],
      });
    }

    it("dragEnd with nodes commits node positions to the store", async ({
      expect,
    }) => {
      const { topologyStore, handlers, net } = await initWithHandlers();
      const updateItemsSpy = vi.spyOn(topologyStore, "updateItems");
      net.getPositions.mockReturnValue({ n1: { x: 5, y: 6 } });

      handlers.dragEnd[0]({ nodes: ["n1"] });

      expect(updateItemsSpy).toHaveBeenCalledWith([{ x: 5, y: 6, id: "n1" }]);
    });

    it("dragEnd with no nodes does not commit positions", async ({
      expect,
    }) => {
      const { topologyStore, handlers } = await initWithHandlers();
      const updateItemsSpy = vi.spyOn(topologyStore, "updateItems");
      updateItemsSpy.mockClear();

      handlers.dragEnd[0]({ nodes: [] });

      expect(updateItemsSpy).not.toHaveBeenCalled();
    });

    it("dragStart on a host with selected port-edges expands selection to ports", async ({
      expect,
    }) => {
      const { net, handlers, edges } = await initWithHandlers();
      net.getSelectedEdges.mockReturnValue(["e1"]);
      edges.get.mockImplementation((id) => {
        if (id == null) return [];
        return { id: "e1", from: "n1", to: "p1" };
      });

      handlers.dragStart[0]({ nodes: ["n1"] });

      expect(net.selectNodes).toHaveBeenCalledWith(["n1", "p1"]);
    });

    it("dragStart on non-host/switch is a no-op", async ({ expect }) => {
      const { net, handlers, topologyStore } = await initWithHandlers();
      topologyStore.data.items.n3 = { type: "controller" };

      handlers.dragStart[0]({ nodes: ["n3"] });

      expect(net.selectNodes).not.toHaveBeenCalled();
    });

    it("dragStart with multiple nodes is a no-op", async ({ expect }) => {
      const { net, handlers } = await initWithHandlers();

      handlers.dragStart[0]({ nodes: ["n1", "n2"] });

      expect(net.selectNodes).not.toHaveBeenCalled();
    });

    it("hold on a single edge enters editEdgeMode", async ({ expect }) => {
      const { net, handlers } = await initWithHandlers();

      handlers.hold[0]({ nodes: [], edges: ["e1"] });

      expect(net.editEdgeMode).toHaveBeenCalledOnce();
    });

    it("hold on a host node organizes its connected ports", async ({
      expect,
    }) => {
      const { topologyStore, handlers, net } = await initWithHandlers();
      const updateItemsSpy = vi.spyOn(topologyStore, "updateItems");
      net.getConnectedNodes.mockReturnValue(["p1"]);
      net.getPositions.mockReturnValue({ n1: { x: 100, y: 200 } });

      handlers.hold[0]({ nodes: ["n1"], edges: [] });

      expect(updateItemsSpy).toHaveBeenCalled();
    });

    it("doubleClick on a single edge emits edit-item", async ({ expect }) => {
      const { wrapper, handlers, edges } = await initWithHandlers();
      edges.get.mockImplementation((id) => {
        if (id == null) return [];
        return { id: "e1", from: "n1", to: "p1", group: "association" };
      });

      handlers.doubleClick[0]({ nodes: [], edges: ["e1"] });
      await nextTick();

      expect(wrapper.emitted("edit-item")).toBeTruthy();
    });

    it("doubleClick on a single node triggers net.editNode", async ({
      expect,
    }) => {
      const { net, handlers } = await initWithHandlers();

      handlers.doubleClick[0]({ nodes: ["n1"], edges: [] });
      await nextTick();

      expect(net.editNode).toHaveBeenCalledOnce();
    });
  });

  // Editing flow: production observable behavior is the `edit-item` emission
  // and (on resolve with an item) a topologyStore.replaceItems call.
  describe("editItem flow via doubleClick", () => {
    it("emits edit-item and commits replaceItems when resolved with an item", async ({
      expect,
    }) => {
      const { wrapper, handlers, edges, topologyStore } = await mountWithNet({
        nodeItems: [{ id: "n1", group: "host" }],
        edgeItems: [{ id: "e1", from: "n1", to: "n2" }],
      });
      edges.get.mockImplementation((id) =>
        id == null
          ? []
          : { id: "e1", from: "n1", to: "n2", group: "association" },
      );
      const replaceItemsSpy = vi.spyOn(topologyStore, "replaceItems");

      handlers.doubleClick[0]({ nodes: [], edges: ["e1"] });

      // The component emits edit-item with (oldItem, resolveCallback)
      const emitted = wrapper.emitted("edit-item");
      expect(emitted).toBeTruthy();
      const [oldItem, resolve] = emitted[0];
      expect(oldItem.id).toBe("e1");

      resolve({ id: "e1", type: "association", from: "n1", to: "n2" });
      await nextTick();
      await nextTick();

      expect(replaceItemsSpy).toHaveBeenCalledWith([
        { id: "e1", type: "association", from: "n1", to: "n2" },
      ]);
    });

    it("emits edit-item and disables edit mode when resolved with null", async ({
      expect,
    }) => {
      const { wrapper, handlers, edges, net } = await mountWithNet({
        edgeItems: [{ id: "e1", from: "n1", to: "n2" }],
      });
      edges.get.mockImplementation((id) =>
        id == null
          ? []
          : { id: "e1", from: "n1", to: "n2", group: "association" },
      );

      handlers.doubleClick[0]({ nodes: [], edges: ["e1"] });

      const [, resolve] = wrapper.emitted("edit-item")[0];
      resolve(null);
      await nextTick();

      expect(net.disableEditMode).toHaveBeenCalled();
    });
  });

  // addNode manipulation flow: when a node is dropped, the component must
  // generate hostnames, connect to the closest matching node, fan out ports
  // for hosts/switches, and commit everything via replaceItems.
  describe("addNode manipulation flow", () => {
    it("for a host: assigns hostname, generates ports, and commits via replaceItems", async ({
      expect,
    }) => {
      const items = {};
      const { wrapper, manipulation, topologyStore } = await mountWithNet({
        items,
      });
      const replaceItemsSpy = vi.spyOn(topologyStore, "replaceItems");

      // Enter host add-mode (parent-facing method).
      wrapper.vm.addHost();

      const callback = vi.fn();
      const node = { id: "newHost", x: 0, y: 0 };
      // editItem path will emit edit-item; resolve it immediately with the
      // proposed item so the manipulation continues.
      const addNodePromise = manipulation.addNode(node, callback);

      // The component emits edit-item once it has shaped the proposed item.
      // Wait until the emission appears.
      for (let i = 0; i < 20 && !wrapper.emitted("edit-item"); ++i) {
        await new Promise((r) => setTimeout(r, 0));
        await nextTick();
      }
      const emitted = wrapper.emitted("edit-item");
      expect(emitted).toBeTruthy();
      const [, resolve] = emitted[0];

      // Resolve with the proposed item to allow commit.
      resolve({
        id: "newHost",
        type: "host",
        hostname: "h1",
      });

      await addNodePromise;

      expect(callback).toHaveBeenCalled();
      expect(replaceItemsSpy).toHaveBeenCalled();
      const committed = replaceItemsSpy.mock.calls[0][0];
      // The committed payload should include the host plus its generated ports.
      const types = committed.map((i) => i.type);
      expect(types).toContain("host");
      expect(types).toContain("port");
    });

    it("for a port near a host: associates the new port with the closest matching node", async ({
      expect,
    }) => {
      const items = {
        host1: { type: "host", hostname: "h1" },
      };
      const nodeItems = [{ id: "host1", group: "host" }];
      const { wrapper, net, manipulation, topologyStore } = await mountWithNet({
        items,
        nodeItems,
      });
      net.getPositions.mockImplementation((ids) => {
        const out = {};
        for (const id of ids) {
          if (id === "host1") out[id] = { x: 5, y: 5 };
        }
        return out;
      });
      const replaceItemsSpy = vi.spyOn(topologyStore, "replaceItems");

      wrapper.vm.addPort();

      const node = { id: "newPort", x: 6, y: 6 };
      const callback = vi.fn();
      const addNodePromise = manipulation.addNode(node, callback);

      for (let i = 0; i < 20 && !wrapper.emitted("edit-item"); ++i) {
        await new Promise((r) => setTimeout(r, 0));
        await nextTick();
      }
      const [, resolve] = wrapper.emitted("edit-item")[0];
      resolve({ id: "newPort", type: "port", hostname: "eth0" });

      await addNodePromise;

      expect(replaceItemsSpy).toHaveBeenCalled();
      const committed = replaceItemsSpy.mock.calls[0][0];
      // Should include an association to host1.
      const association = committed.find((i) => i.type === "association");
      expect(association).toBeDefined();
      expect(association.from === "host1" || association.to === "host1").toBe(
        true,
      );
    });
  });

  // addEdge / editEdge manipulation: ordering, validity, and editItem hand-off.
  describe("addEdge / editEdge manipulation flow", () => {
    it("addEdge: emits edit-item for a valid port-to-port link", async ({
      expect,
    }) => {
      const items = {
        n1: { type: "port" },
        n2: { type: "port" },
      };
      const { wrapper, manipulation } = await mountWithNet({ items });

      const callback = vi.fn();
      const edge = { from: "n1", to: "n2" };
      const promise = manipulation.addEdge(edge, callback);

      // edit-item should be emitted because the link is valid.
      for (let i = 0; i < 20 && !wrapper.emitted("edit-item"); ++i) {
        await new Promise((r) => setTimeout(r, 0));
        await nextTick();
      }
      expect(wrapper.emitted("edit-item")).toBeTruthy();
      const [, resolve] = wrapper.emitted("edit-item")[0];
      resolve(null);

      await promise;
      expect(callback).toHaveBeenCalled();
    });

    it("editEdge: emits edit-item when the edge is valid", async ({
      expect,
    }) => {
      const items = {
        n1: { type: "port" },
        n2: { type: "port" },
      };
      const { wrapper, manipulation } = await mountWithNet({ items });

      const callback = vi.fn();
      const edge = { id: "e1", from: "n1", to: "n2" };
      const promise = manipulation.editEdge(edge, callback);

      for (let i = 0; i < 20 && !wrapper.emitted("edit-item"); ++i) {
        await new Promise((r) => setTimeout(r, 0));
        await nextTick();
      }
      expect(wrapper.emitted("edit-item")).toBeTruthy();
      const [, resolve] = wrapper.emitted("edit-item")[0];
      resolve(null);

      await promise;
      expect(callback).toHaveBeenCalled();
    });
  });
});
