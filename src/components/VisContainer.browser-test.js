import { describe, it, vi } from "vitest";
import { defineComponent, h, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import { createStore } from "vuex";
import VisContainer from "@/components/VisContainer.vue";

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

function createMockStore({ loading = false, undoThrows = false, redoThrows = false } = {}) {
  return createStore({
    state() {
      return {
        loading,
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
            data: { items: {} },
            past: [],
            future: [],
          };
        },
        getters: {
          data: (s) => s.data,
          canUndo: () => 0,
          canRedo: () => 0,
          boundingBox:
            () => () => ({
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
          undo() {
            if (undoThrows) throw new Error("nothing to undo");
          },
          redo() {
            if (redoThrows) throw new Error("nothing to redo");
          },
        },
      },
    },
  });
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

function mountVisContainer({ loading = false } = {}) {
  const vuetify = createVuetify();
  const store = createMockStore({ loading });
  const mockRouter = {
    push: vi.fn(() => Promise.resolve()),
  };
  const mockRoute = {
    params: {},
    meta: { isView: false },
  };
  return { wrapper: mount(VisContainer, {
    global: {
      plugins: [vuetify, store],
      stubs: {
        VisCanvas: VisCanvasStub,
      },
      mocks: {
        $router: mockRouter,
        $route: mockRoute,
      },
    },
  }), store, mockRouter };
}

function mountWithNet({ undoThrows = false, redoThrows = false, items = {}, nodeItems = [], edgeItems = [] } = {}) {
  const vuetify = createVuetify();
  const store = createMockStore({ loading: false, undoThrows, redoThrows });
  if (Object.keys(items).length > 0) {
    store.state.topology.data.items = items;
  }
  const mockRouter = {
    push: vi.fn(() => Promise.resolve()),
  };
  const mockRoute = {
    params: {},
    meta: { isView: false },
  };
  const wrapper = mount(VisContainer, {
    global: {
      plugins: [vuetify, store],
      stubs: {
        VisCanvas: VisCanvasStub,
      },
      mocks: {
        $router: mockRouter,
        $route: mockRoute,
      },
    },
  });

  const net = createMockNet();
  const nodes = createMockDataSet(nodeItems);
  const edges = createMockDataSet(edgeItems);
  const container = document.createElement("div");

  // Wire via the ready event emitted by VisCanvasStub (same path as production)
  const visCanvasStub = wrapper.findComponent({ name: "VisCanvas" });
  visCanvasStub.vm.emitReady({ container, net, nodes, edges });

  return { wrapper, net, nodes, edges, store, mockRouter };
}

describe.concurrent("VisContainer", () => {
  it("renders root div with tabindex=0 and class component-container", ({ expect }) => {
    const { wrapper } = mountVisContainer({ loading: false });

    const root = wrapper.find(".component-container");
    expect(root.exists()).toBe(true);
    expect(root.attributes("tabindex")).toBe("0");
  });

  it("renders LoadingSpinner when loading is true", ({ expect }) => {
    const { wrapper } = mountVisContainer({ loading: true });

    const spinner = wrapper.findComponent({ name: "LoadingSpinner" });
    expect(spinner.exists()).toBe(true);

    expect(wrapper.find(".vis-canvas-stub").exists()).toBe(false);
  });

  it("renders VisCanvas when loading is false", ({ expect }) => {
    const { wrapper } = mountVisContainer({ loading: false });

    const spinner = wrapper.findComponent({ name: "LoadingSpinner" });
    expect(spinner.exists()).toBe(false);

    expect(wrapper.find(".vis-canvas-stub").exists()).toBe(true);
  });

  describe("newItem.set", () => {
    it("sets type, connectTo, label, noEdit fields on the data object", ({ expect }) => {
      const { wrapper } = mountWithNet();

      wrapper.vm.newItem.set("controller", ["switch"], "myLabel", true);

      expect(wrapper.vm.newItem.type).toBe("controller");
      expect(wrapper.vm.newItem.connectTo).toEqual(["switch"]);
      expect(wrapper.vm.newItem.label).toBe("myLabel");
      expect(wrapper.vm.newItem.noEdit).toBe(true);
    });

    it("resets all fields to null/false when called with no arguments", ({ expect }) => {
      const { wrapper } = mountWithNet();

      wrapper.vm.newItem.set("host", ["port"], "h1", true);
      wrapper.vm.newItem.set();

      expect(wrapper.vm.newItem.type).toBeNull();
      expect(wrapper.vm.newItem.connectTo).toBeNull();
      expect(wrapper.vm.newItem.label).toBeNull();
      expect(wrapper.vm.newItem.noEdit).toBe(false);
    });
  });

  describe("moveMouseTag", () => {
    it("updates mouseTag x and y from clientX and clientY", ({ expect }) => {
      const { wrapper } = mountWithNet();

      wrapper.vm.moveMouseTag({ clientX: 150, clientY: 250 });

      expect(wrapper.vm.mouseTag.x).toBe(150);
      expect(wrapper.vm.mouseTag.y).toBe(250);
    });
  });

  describe("add* methods", () => {
    it("addEdge sets newItem type to edge and calls net.addEdgeMode", ({ expect }) => {
      const { wrapper, net } = mountWithNet();

      wrapper.vm.addEdge();

      expect(wrapper.vm.newItem.type).toBe("edge");
      expect(net.addEdgeMode).toHaveBeenCalledOnce();
    });

    it("addController sets newItem type to controller and calls net.addNodeMode", ({ expect }) => {
      const { wrapper, net } = mountWithNet();

      wrapper.vm.addController();

      expect(wrapper.vm.newItem.type).toBe("controller");
      expect(net.addNodeMode).toHaveBeenCalledOnce();
    });

    it("addDummy sets newItem type to dummy and calls net.addNodeMode", ({ expect }) => {
      const { wrapper, net } = mountWithNet();

      wrapper.vm.addDummy();

      expect(wrapper.vm.newItem.type).toBe("dummy");
      expect(wrapper.vm.newItem.connectTo).toBeNull();
      expect(wrapper.vm.newItem.label).toBeNull();
      expect(wrapper.vm.newItem.noEdit).toBe(false);
      expect(net.addNodeMode).toHaveBeenCalledOnce();
    });

    it("addIPsDummy sets newItem with IPS label, connectTo list, and noEdit true", ({ expect }) => {
      const { wrapper, net } = mountWithNet();

      wrapper.vm.addIPsDummy();

      expect(wrapper.vm.newItem.type).toBe("dummy");
      expect(wrapper.vm.newItem.connectTo).toEqual(["port", "host", "switch", "controller"]);
      expect(wrapper.vm.newItem.label).toBe("{{IPS}}");
      expect(wrapper.vm.newItem.noEdit).toBe(true);
      expect(net.addNodeMode).toHaveBeenCalledOnce();
    });

    it("addTypesDummy sets newItem with TYPES label and connectTo for switch and controller", ({ expect }) => {
      const { wrapper, net } = mountWithNet();

      wrapper.vm.addTypesDummy();

      expect(wrapper.vm.newItem.type).toBe("dummy");
      expect(wrapper.vm.newItem.connectTo).toEqual(["switch", "controller"]);
      expect(wrapper.vm.newItem.label).toBe("{{TYPES}}");
      expect(wrapper.vm.newItem.noEdit).toBe(true);
      expect(net.addNodeMode).toHaveBeenCalledOnce();
    });

    it("addHost sets newItem type to host and calls net.addNodeMode", ({ expect }) => {
      const { wrapper, net } = mountWithNet();

      wrapper.vm.addHost();

      expect(wrapper.vm.newItem.type).toBe("host");
      expect(net.addNodeMode).toHaveBeenCalledOnce();
    });

    it("addPort sets newItem type to port with connectTo host and switch", ({ expect }) => {
      const { wrapper, net } = mountWithNet();

      wrapper.vm.addPort();

      expect(wrapper.vm.newItem.type).toBe("port");
      expect(wrapper.vm.newItem.connectTo).toEqual(["host", "switch"]);
      expect(net.addNodeMode).toHaveBeenCalledOnce();
    });

    it("addSwitch sets newItem type to switch and calls net.addNodeMode", ({ expect }) => {
      const { wrapper, net } = mountWithNet();

      wrapper.vm.addSwitch();

      expect(wrapper.vm.newItem.type).toBe("switch");
      expect(net.addNodeMode).toHaveBeenCalledOnce();
    });
  });

  describe("deleteSelected", () => {
    it("removes items and shows snackbar when selection exists", ({ expect }) => {
      const { wrapper, net, store } = mountWithNet();
      net.getSelection.mockReturnValue({ nodes: ["n1", "n2"], edges: ["e1"] });
      const dispatchSpy = vi.spyOn(store, "dispatch");

      wrapper.vm.deleteSelected();

      expect(dispatchSpy).toHaveBeenCalledWith("topology/removeItems", ["n1", "n2", "e1"]);
      expect(wrapper.vm.snackbar.type).toBe("items-deleted");
      expect(wrapper.vm.snackbar.values).toEqual([3]);
    });

    it("still shows snackbar when store dispatch rejects", ({ expect }) => {
      const { wrapper, net, store } = mountWithNet();
      net.getSelection.mockReturnValue({ nodes: ["n1"], edges: [] });
      vi.spyOn(store, "dispatch").mockRejectedValue(new Error("store failure"));

      wrapper.vm.deleteSelected();

      expect(wrapper.vm.snackbar.type).toBe("items-deleted");
      expect(wrapper.vm.snackbar.values).toEqual([1]);
    });

    it("does nothing when selection is empty", ({ expect }) => {
      const { wrapper, net, store } = mountWithNet();
      net.getSelection.mockReturnValue({ nodes: [], edges: [] });
      const dispatchSpy = vi.spyOn(store, "dispatch");

      wrapper.vm.deleteSelected();

      expect(dispatchSpy).not.toHaveBeenCalledWith(
        "topology/removeItems",
        expect.anything(),
      );
    });
  });

  describe("selectAll", () => {
    it("selects all nodes and edges via net.setSelection", ({ expect }) => {
      const { wrapper, net, nodes, edges } = mountWithNet();
      nodes.getIds.mockReturnValue(["n1", "n2"]);
      edges.getIds.mockReturnValue(["e1", "e2"]);

      wrapper.vm.selectAll();

      expect(net.setSelection).toHaveBeenCalledWith({
        nodes: ["n1", "n2"],
        edges: ["e1", "e2"],
      });
    });
  });

  describe("fitAll", () => {
    it("calls net.fit with animation and clears URL position", ({ expect }) => {
      const { wrapper, net, mockRouter } = mountWithNet();

      wrapper.vm.fitAll();

      expect(net.fit).toHaveBeenCalledWith({ animation: true });
      expect(mockRouter.push).toHaveBeenCalled();
    });
  });

  describe("fitSelected", () => {
    it("fits to selected nodes with animation", ({ expect }) => {
      const { wrapper, net } = mountWithNet();
      net.getSelectedNodes.mockReturnValue(["n1"]);

      wrapper.vm.fitSelected();

      expect(net.fit).toHaveBeenCalledWith({
        nodes: ["n1"],
        animation: true,
      });
    });

    it("fits to selected nodes without animation when animate is false", ({ expect }) => {
      const { wrapper, net } = mountWithNet();
      net.getSelectedNodes.mockReturnValue(["n1"]);

      wrapper.vm.fitSelected(false);

      expect(net.fit).toHaveBeenCalledWith({
        nodes: ["n1"],
        animation: false,
      });
    });
  });

  describe("setScale", () => {
    it("calls net.moveTo with the given scale and animation", ({ expect }) => {
      const { wrapper, net } = mountWithNet();

      wrapper.vm.setScale(2.5);

      expect(net.moveTo).toHaveBeenCalledWith({
        scale: 2.5,
        animation: true,
      });
    });

    it("defaults scale to 1 when called with null", ({ expect }) => {
      const { wrapper, net } = mountWithNet();

      wrapper.vm.setScale(null);

      expect(net.moveTo).toHaveBeenCalledWith({
        scale: 1,
        animation: true,
      });
    });
  });

  describe("undo", () => {
    it("dispatches undo and shows undone snackbar on success", ({ expect }) => {
      const { wrapper, store } = mountWithNet({ undoThrows: false });
      const dispatchSpy = vi.spyOn(store, "dispatch");

      wrapper.vm.undo();

      expect(dispatchSpy).toHaveBeenCalledWith("topology/undo", undefined);
      expect(wrapper.vm.snackbar.type).toBe("undone");
    });

    it("shows nothing-to-undo snackbar when undo throws", ({ expect }) => {
      const { wrapper } = mountWithNet({ undoThrows: true });

      wrapper.vm.undo();

      expect(wrapper.vm.snackbar.type).toBe("nothing-to-undo");
    });
  });

  describe("redo", () => {
    it("dispatches redo and shows redone snackbar on success", ({ expect }) => {
      const { wrapper, store } = mountWithNet({ redoThrows: false });
      const dispatchSpy = vi.spyOn(store, "dispatch");

      wrapper.vm.redo();

      expect(dispatchSpy).toHaveBeenCalledWith("topology/redo", undefined);
      expect(wrapper.vm.snackbar.type).toBe("redone");
    });

    it("shows nothing-to-redo snackbar when redo throws", ({ expect }) => {
      const { wrapper } = mountWithNet({ redoThrows: true });

      wrapper.vm.redo();

      expect(wrapper.vm.snackbar.type).toBe("nothing-to-redo");
    });
  });

  describe("showSnackbar", () => {
    it("sets snackbar type, values, actionName, and actionFunction", ({ expect }) => {
      const { wrapper } = mountWithNet();
      const customAction = vi.fn();

      wrapper.vm.showSnackbar("items-deleted", [5], "Undo", customAction);

      expect(wrapper.vm.snackbar.type).toBe("items-deleted");
      expect(wrapper.vm.snackbar.values).toEqual([5]);
      expect(wrapper.vm.snackbar.actionName).toBe("Undo");
      expect(wrapper.vm.snackbar.actionFunction).toBe(customAction);
    });

    it("defaults to Close action and empty values when not provided", ({ expect }) => {
      const { wrapper } = mountWithNet();

      wrapper.vm.showSnackbar("undone");

      expect(wrapper.vm.snackbar.type).toBe("undone");
      expect(wrapper.vm.snackbar.values).toEqual([]);
      expect(wrapper.vm.snackbar.actionName).toBe("Close");
      expect(typeof wrapper.vm.snackbar.actionFunction).toBe("function");
    });

    it("snackbar.message returns correct text for known types", ({ expect }) => {
      const { wrapper } = mountWithNet();

      wrapper.vm.showSnackbar("undone");
      expect(wrapper.vm.snackbar.message).toBe("Undone.");

      wrapper.vm.showSnackbar("redone");
      expect(wrapper.vm.snackbar.message).toBe("Redone.");

      wrapper.vm.showSnackbar("nothing-to-undo");
      expect(wrapper.vm.snackbar.message).toBe("Nothing more to undo.");

      wrapper.vm.showSnackbar("nothing-to-redo");
      expect(wrapper.vm.snackbar.message).toBe("Nothing more to redo.");

      wrapper.vm.showSnackbar("items-deleted", [1]);
      expect(wrapper.vm.snackbar.message).toBe("1 item deleted.");

      wrapper.vm.showSnackbar("items-deleted", [3]);
      expect(wrapper.vm.snackbar.message).toBe("3 items deleted.");
    });

    it("snackbar.message returns fallback for unknown type", ({ expect }) => {
      const { wrapper } = mountWithNet();

      wrapper.vm.showSnackbar("unknown-type");

      expect(wrapper.vm.snackbar.message).toBe("Unknown message type.");
    });
  });

  describe("keypress handler", () => {
    it("dispatches non-ctrl keybindings to the correct methods", ({ expect }) => {
      const { wrapper } = mountWithNet();

      const testCases = [
        { key: "d", method: "deleteSelected" },
        { key: "e", method: "addEdge" },
        { key: "c", method: "addController" },
        { key: "l", method: "addDummy" },
        { key: "i", method: "addIPsDummy" },
        { key: "t", method: "addTypesDummy" },
        { key: "h", method: "addHost" },
        { key: "p", method: "addPort" },
        { key: "s", method: "addSwitch" },
        { key: "a", method: "fitAll" },
        { key: "f", method: "fitSelected" },
        { key: "z", method: "setScale" },
      ];

      for (const { key, method } of testCases) {
        const spy = vi.spyOn(wrapper.vm, method);
        const event = { key, ctrlKey: false, preventDefault: vi.fn() };

        wrapper.vm.keypress(event);

        expect(spy).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
        spy.mockRestore();
      }
    });

    it("dispatches ctrl keybindings to the correct methods", ({ expect }) => {
      const { wrapper } = mountWithNet();

      const ctrlCases = [
        { key: "a", method: "selectAll" },
        { key: "z", method: "undo" },
        { key: "y", method: "redo" },
      ];

      for (const { key, method } of ctrlCases) {
        const spy = vi.spyOn(wrapper.vm, method);
        const event = { key, ctrlKey: true, preventDefault: vi.fn() };

        wrapper.vm.keypress(event);

        expect(spy).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
        spy.mockRestore();
      }
    });

    it("does not call preventDefault for unmapped keys", ({ expect }) => {
      const { wrapper } = mountWithNet();
      const event = { key: "q", ctrlKey: false, preventDefault: vi.fn() };

      wrapper.vm.keypress(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it("dispatches Delete key to deleteSelected", ({ expect }) => {
      const { wrapper } = mountWithNet();
      const spy = vi.spyOn(wrapper.vm, "deleteSelected");
      const event = { key: "Delete", ctrlKey: false, preventDefault: vi.fn() };

      wrapper.vm.keypress(event);

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it("dispatches Escape key to stopEditMode", ({ expect }) => {
      const { wrapper, net } = mountWithNet();
      const event = { key: "Escape", ctrlKey: false, preventDefault: vi.fn() };

      wrapper.vm.keypress(event);

      expect(wrapper.vm.newItem.type).toBeNull();
      expect(net.disableEditMode).toHaveBeenCalled();
    });
  });

  describe("init", () => {
    it("wires vis-network events and sets manipulation options", ({ expect }) => {
      const { wrapper, mockRouter } = mountVisContainer({ loading: false });
      const net = createMockNet();
      const nodes = createMockDataSet();
      const edges = createMockDataSet();
      const container = document.createElement("div");

      // applyURL will call fitSelected which needs getSelectedNodes
      net.getSelectedNodes.mockReturnValue([]);

      // Wire via the ready event (same path as production)
      const visCanvasStub = wrapper.findComponent({ name: "VisCanvas" });
      visCanvasStub.vm.emitReady({ container, net, nodes, edges });

      expect(wrapper.vm.net).toBe(net);
      expect(wrapper.vm.nodes).toBe(nodes);
      expect(wrapper.vm.edges).toBe(edges);

      // setOptions called with manipulation config
      expect(net.setOptions).toHaveBeenCalledOnce();
      const optionsArg = net.setOptions.mock.calls[0][0];
      expect(optionsArg.manipulation).toBeDefined();
      expect(optionsArg.manipulation.enabled).toBe(false);
      expect(typeof optionsArg.manipulation.addNode).toBe("function");
      expect(typeof optionsArg.manipulation.addEdge).toBe("function");
      expect(typeof optionsArg.manipulation.editNode).toBe("function");
      expect(typeof optionsArg.manipulation.editEdge).toBe("function");

      // Verify events registered
      const registeredEvents = net.on.mock.calls.map((c) => c[0]);
      expect(registeredEvents).toContain("deselectNode");
      expect(registeredEvents).toContain("deselectEdge");
      expect(registeredEvents).toContain("doubleClick");
      expect(registeredEvents).toContain("hold");
      expect(registeredEvents).toContain("dragEnd");
      expect(registeredEvents).toContain("dragStart");
      expect(registeredEvents).toContain("select");
      expect(registeredEvents).toContain("zoom");
    });
  });

  describe("stopEditMode", () => {
    it("resets newItem and disables edit mode on the network", ({ expect }) => {
      const { wrapper, net } = mountWithNet();

      wrapper.vm.newItem.set("host", ["port"], "h1", true);
      wrapper.vm.stopEditMode();

      expect(wrapper.vm.newItem.type).toBeNull();
      expect(wrapper.vm.newItem.connectTo).toBeNull();
      expect(wrapper.vm.newItem.label).toBeNull();
      expect(wrapper.vm.newItem.noEdit).toBe(false);
      expect(net.disableEditMode).toHaveBeenCalledOnce();
    });
  });

  describe("commit method", () => {
    it("dispatches vuex action with type and payload", ({ expect }) => {
      const { wrapper, store } = mountWithNet();
      const dispatchSpy = vi.spyOn(store, "dispatch");

      wrapper.vm.commit("replaceItems", [{ id: "x", type: "host" }]);

      expect(dispatchSpy).toHaveBeenCalledWith("topology/replaceItems", [{ id: "x", type: "host" }]);
    });
  });

  describe("mouseTagIcon computed", () => {
    it("returns $net- prefixed newItem type", ({ expect }) => {
      const { wrapper } = mountWithNet();

      wrapper.vm.newItem.set("controller");

      expect(wrapper.vm.mouseTagIcon).toBe("$net-controller");
    });
  });

  describe("updateURL", () => {
    it("pushes Canvas with position route including view position, scale, and selection", ({ expect }) => {
      const { wrapper, net, mockRouter } = mountWithNet();
      net.getViewPosition.mockReturnValue({ x: 100.4, y: 200.6 });
      net.getScale.mockReturnValue(1.5);
      net.getSelection.mockReturnValue({ nodes: ["n1"], edges: ["e1"] });

      wrapper.vm.updateURL();

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
  });

  describe("clearURLPosition", () => {
    it("pushes Canvas without position route", ({ expect }) => {
      const { wrapper, mockRouter } = mountWithNet();

      wrapper.vm.clearURLPosition();

      expect(mockRouter.push).toHaveBeenCalledWith({
        name: "Canvas without position",
        params: { ids: undefined },
      });
    });
  });

  describe("applyURL", () => {
    it("calls fitSelected when no position params in route", ({ expect }) => {
      const { wrapper, net } = mountWithNet();
      net.getSelectedNodes.mockReturnValue([]);

      wrapper.vm.applyURL();

      expect(net.fit).toHaveBeenCalled();
    });
  });

  describe("commitPositions", () => {
    it("dispatches updateItems with positions from the network", ({ expect }) => {
      const { wrapper, net, store } = mountWithNet();
      net.getPositions.mockReturnValue({
        n1: { x: 10, y: 20 },
        n2: { x: 30, y: 40 },
      });
      const dispatchSpy = vi.spyOn(store, "dispatch");

      wrapper.vm.commitPositions(["n1", "n2"]);

      expect(dispatchSpy).toHaveBeenCalledWith("topology/updateItems", [
        { x: 10, y: 20, id: "n1" },
        { x: 30, y: 40, id: "n2" },
      ]);
    });
  });

  describe("commitUncommitedPositions", () => {
    it("commits positions for nodes with null x or y", ({ expect }) => {
      const { wrapper, net, nodes, store } = mountWithNet();
      const testItems = [
        { id: "n1", x: null, y: null },
        { id: "n2", x: 10, y: 20 },
        { id: "n3", x: 5, y: null },
      ];
      nodes.get.mockImplementation((id) => {
        if (id == null) return testItems;
        return testItems.find((i) => i.id === id) || null;
      });
      nodes.getIds.mockReturnValue(testItems.map((i) => i.id));
      net.getPositions.mockReturnValue({
        n1: { x: 100, y: 200 },
        n3: { x: 50, y: 60 },
      });
      const dispatchSpy = vi.spyOn(store, "dispatch");

      wrapper.vm.commitUncommitedPositions();


      expect(dispatchSpy).toHaveBeenCalledWith("topology/updateItems", [
        { x: 100, y: 200, id: "n1" },
        { x: 50, y: 60, id: "n3" },
      ]);
    });
  });

  describe("orderNodes", () => {
    it("swaps from/to when source has higher priority than destination", ({ expect }) => {
      const items = {
        n1: { type: "host" },
        n2: { type: "controller" },
      };
      const { wrapper } = mountWithNet({ items });

      const edge = { from: "n1", to: "n2" };
      wrapper.vm.orderNodes(edge);

      // host has higher index than controller in nodePriorities, so swap
      expect(edge.from).toBe("n2");
      expect(edge.to).toBe("n1");
    });

    it("does not swap when source has lower priority", ({ expect }) => {
      const items = {
        n1: { type: "controller" },
        n2: { type: "host" },
      };
      const { wrapper } = mountWithNet({ items });

      const edge = { from: "n1", to: "n2" };
      wrapper.vm.orderNodes(edge);

      expect(edge.from).toBe("n1");
      expect(edge.to).toBe("n2");
    });
  });

  describe("getEdgeType", () => {
    it("returns existing item type if edge already has an item", ({ expect }) => {
      const items = {
        e1: { type: "association" },
        n1: { type: "port" },
        n2: { type: "port" },
      };
      const { wrapper } = mountWithNet({ items });

      const result = wrapper.vm.getEdgeType({ id: "e1", from: "n1", to: "n2" });

      expect(result).toBe("association");
    });

    it("returns link when both endpoints are ports", ({ expect }) => {
      const items = {
        n1: { type: "port" },
        n2: { type: "port" },
      };
      const { wrapper } = mountWithNet({ items });

      const result = wrapper.vm.getEdgeType({ id: "new-edge", from: "n1", to: "n2" });

      expect(result).toBe("link");
    });

    it("returns association when endpoints are not both ports", ({ expect }) => {
      const items = {
        n1: { type: "controller" },
        n2: { type: "switch" },
      };
      const { wrapper } = mountWithNet({ items });

      const result = wrapper.vm.getEdgeType({ id: "new-edge", from: "n1", to: "n2" });

      expect(result).toBe("association");
    });
  });

  describe("isEdgeValid", () => {
    it("validates link edge between two ports", ({ expect }) => {
      const items = {
        n1: { type: "port" },
        n2: { type: "port" },
      };
      const { wrapper } = mountWithNet({ items });

      expect(wrapper.vm.isEdgeValid({ from: "n1", to: "n2" }, "link")).toBe(true);
    });

    it("rejects link edge when endpoints are not both ports", ({ expect }) => {
      const items = {
        n1: { type: "host" },
        n2: { type: "port" },
      };
      const { wrapper } = mountWithNet({ items });

      expect(wrapper.vm.isEdgeValid({ from: "n1", to: "n2" }, "link")).toBe(false);
    });

    it("validates association between controller and switch", ({ expect }) => {
      const items = {
        n1: { type: "controller" },
        n2: { type: "switch" },
      };
      const { wrapper } = mountWithNet({ items });

      expect(wrapper.vm.isEdgeValid({ from: "n1", to: "n2" }, "association")).toBe(true);
    });
  });

  describe("generateOrganizedPortCoors", () => {
    it("generates correct port coordinates for small port counts", ({ expect }) => {
      const { wrapper } = mountWithNet();

      const coords = wrapper.vm.generateOrganizedPortCoors({ x: 100, y: 200 }, 2);

      expect(coords).toHaveLength(2);
      expect(coords[0].y).toBe(270); // y + 70
      expect(coords[1].y).toBe(270);
    });

    it("generates offset y for large port counts", ({ expect }) => {
      const { wrapper } = mountWithNet();

      const coords = wrapper.vm.generateOrganizedPortCoors({ x: 100, y: 200 }, 10);

      expect(coords).toHaveLength(10);
      // Even indices get yEvenOffset=25
      expect(coords[0].y).toBe(295); // 270 + 25
      expect(coords[1].y).toBe(270); // no offset for odd
    });
  });

  describe("getNextHostname", () => {
    it("returns fallback when hostnames array is empty", ({ expect }) => {
      const { wrapper } = mountWithNet();

      expect(wrapper.vm.getNextHostname([], "h1")).toBe("h1");
    });

    it("increments the numeric part of the last hostname", ({ expect }) => {
      const { wrapper } = mountWithNet();

      expect(wrapper.vm.getNextHostname(["h1", "h2", "h3"], "h1")).toBe("h4");
    });

    it("returns fallback when hostname has no numeric suffix", ({ expect }) => {
      const { wrapper } = mountWithNet();

      expect(wrapper.vm.getNextHostname(["abc"], "h1")).toBe("h1");
    });
  });

  describe("getConnectedNodes", () => {
    it("returns connected nodes filtered by type", ({ expect }) => {
      const testItems = [
        { id: "p1", group: "port" },
        { id: "p2", group: "port" },
        { id: "h1", group: "host" },
      ];
      const { wrapper, net, nodes } = mountWithNet();
      net.getConnectedNodes.mockReturnValue(["p1", "p2", "h1"]);
      nodes.get.mockImplementation((id) => {
        if (id == null) return testItems;
        return testItems.find((i) => i.id === id) || null;
      });
      nodes.getIds.mockReturnValue(testItems.map((i) => i.id));

      const result = wrapper.vm.getConnectedNodes("s1", "port");

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("p1");
      expect(result[1].id).toBe("p2");
    });
  });

  describe("organizePorts", () => {
    it("commits updated positions for connected ports", ({ expect }) => {
      const items = {
        s1: { type: "switch", hostname: "s1" },
        p1: { type: "port", hostname: "eth0" },
        p2: { type: "port", hostname: "eth1" },
      };
      const testNodeItems = [
        { id: "p1", group: "port", label: "eth0" },
        { id: "p2", group: "port", label: "eth1" },
      ];
      const { wrapper, net, nodes, store } = mountWithNet({ items });
      net.getConnectedNodes.mockReturnValue(["p1", "p2"]);
      nodes.get.mockImplementation((id) => {
        if (id == null) return testNodeItems;
        return testNodeItems.find((i) => i.id === id) || null;
      });
      nodes.getIds.mockReturnValue(testNodeItems.map((i) => i.id));
      net.getPositions.mockReturnValue({
        s1: { x: 100, y: 200 },
      });
      const dispatchSpy = vi.spyOn(store, "dispatch");

      wrapper.vm.organizePorts({ id: "s1" });

      expect(dispatchSpy).toHaveBeenCalledWith(
        "topology/updateItems",
        expect.arrayContaining([
          expect.objectContaining({ id: "p1" }),
          expect.objectContaining({ id: "p2" }),
        ]),
      );
    });
  });

  describe("getNextFreeHostname", () => {
    it("returns base hostname for port type when rootNodeId is null", ({ expect }) => {
      const { wrapper } = mountWithNet();

      const result = wrapper.vm.getNextFreeHostname("port", null);

      expect(result).toBe("eth0");
    });

    it("returns next hostname for port based on connected nodes", ({ expect }) => {
      const items = {
        p1: { type: "port", hostname: "eth0" },
        p2: { type: "port", hostname: "eth1" },
      };
      const testNodeItems = [
        { id: "p1", group: "port" },
        { id: "p2", group: "port" },
      ];
      const { wrapper, net, nodes } = mountWithNet({ items });
      net.getConnectedNodes.mockReturnValue(["p1", "p2"]);
      nodes.get.mockImplementation((id) => {
        if (id == null) return testNodeItems;
        return testNodeItems.find((i) => i.id === id) || null;
      });
      nodes.getIds.mockReturnValue(testNodeItems.map((i) => i.id));

      const result = wrapper.vm.getNextFreeHostname("port", "s1");

      expect(result).toBe("eth2");
    });

    it("returns next hostname for global namespace types like host", ({ expect }) => {
      const items = {
        h1: { type: "host", hostname: "h1" },
        h2: { type: "host", hostname: "h2" },
      };
      const testNodeItems = [
        { id: "h1", group: "host" },
        { id: "h2", group: "host" },
      ];
      const { wrapper, nodes } = mountWithNet({ items });
      nodes.get.mockImplementation((id) => {
        if (id == null) return testNodeItems;
        return testNodeItems.find((i) => i.id === id) || null;
      });
      nodes.getIds.mockReturnValue(testNodeItems.map((i) => i.id));

      const result = wrapper.vm.getNextFreeHostname("host");

      expect(result).toBe("h3");
    });
  });

  describe("getClosestId", () => {
    it("returns closest node within maxDistance", ({ expect }) => {
      const items = {
        n1: { type: "host" },
        n2: { type: "host" },
      };
      const testNodeItems = [
        { id: "n1" },
        { id: "n2" },
      ];
      const { wrapper, net, nodes } = mountWithNet({ items });
      nodes.get.mockImplementation((id) => {
        if (id == null) return testNodeItems;
        return testNodeItems.find((i) => i.id === id) || null;
      });
      nodes.getIds.mockReturnValue(testNodeItems.map((i) => i.id));
      net.getPositions.mockReturnValue({
        n1: { x: 10, y: 10 },
        n2: { x: 100, y: 100 },
      });

      const result = wrapper.vm.getClosestId(12, 12, ["host"], 500);

      expect(result).toBe("n1");
    });

    it("returns null when no node is within maxDistance", ({ expect }) => {
      const items = {
        n1: { type: "host" },
      };
      const testNodeItems = [
        { id: "n1" },
      ];
      const { wrapper, net, nodes } = mountWithNet({ items });
      nodes.get.mockImplementation((id) => {
        if (id == null) return testNodeItems;
        return testNodeItems.find((i) => i.id === id) || null;
      });
      nodes.getIds.mockReturnValue(testNodeItems.map((i) => i.id));
      net.getPositions.mockReturnValue({
        n1: { x: 1000, y: 1000 },
      });

      const result = wrapper.vm.getClosestId(0, 0, ["host"], 10);

      expect(result).toBeNull();
    });
  });

  describe("editItem", () => {
    it("emits edit-item event and returns item when resolved with data", async ({ expect }) => {
      const { wrapper, store, net } = mountWithNet();
      const dispatchSpy = vi.spyOn(store, "dispatch");

      const editPromise = wrapper.vm.editItem(
        { id: "n1", group: "host", label: "h1" },
      );

      // The component emits edit-item with a resolve callback
      const emitted = wrapper.emitted("edit-item");
      expect(emitted).toHaveLength(1);
      const [oldItem, resolve] = emitted[0];
      expect(oldItem.id).toBe("n1");

      // Resolve with an item to simulate user completing edit
      resolve({ id: "n1", type: "host", hostname: "h1" });

      const result = await editPromise;
      expect(result.item.id).toBe("n1");
      expect(dispatchSpy).toHaveBeenCalledWith(
        "topology/replaceItems",
        [{ id: "n1", type: "host", hostname: "h1" }],
      );
    });

    it("returns empty object and stops edit mode when resolved with null", async ({ expect }) => {
      const { wrapper, net } = mountWithNet();

      const editPromise = wrapper.vm.editItem(
        { id: "n1", group: "host", label: "h1" },
      );

      const [, resolve] = wrapper.emitted("edit-item")[0];
      resolve(null);

      const result = await editPromise;
      expect(result).toEqual({});
      expect(net.disableEditMode).toHaveBeenCalled();
    });

    it("does not commit when commit parameter is false", async ({ expect }) => {
      const { wrapper, store } = mountWithNet();
      const dispatchSpy = vi.spyOn(store, "dispatch");

      const editPromise = wrapper.vm.editItem(
        { id: "n1", group: "host", label: "h1" },
        false,
      );

      const [, resolve] = wrapper.emitted("edit-item")[0];
      resolve({ id: "n1", type: "host", hostname: "h1" });

      const result = await editPromise;
      expect(result.item.id).toBe("n1");
      expect(dispatchSpy).not.toHaveBeenCalledWith(
        "topology/replaceItems",
        expect.anything(),
      );
    });

    it("sets from/to on item when node has from and to", async ({ expect }) => {
      const { wrapper } = mountWithNet();

      const editPromise = wrapper.vm.editItem(
        { id: "e1", from: "n1", to: "n2", group: "link", label: "" },
      );

      const [, resolve] = wrapper.emitted("edit-item")[0];
      resolve({ id: "e1", type: "link" });

      const result = await editPromise;
      expect(result.item.from).toBe("n1");
      expect(result.item.to).toBe("n2");
    });

    it("uses existing data item if present in store", async ({ expect }) => {
      const items = {
        n1: { id: "n1", type: "host", hostname: "existingHost" },
      };
      const { wrapper } = mountWithNet({ items });

      const editPromise = wrapper.vm.editItem(
        { id: "n1", group: "host", label: "h1" },
      );

      const [oldItem, resolve] = wrapper.emitted("edit-item")[0];
      expect(oldItem.hostname).toBe("existingHost");
      resolve({ id: "n1", type: "host", hostname: "existingHost" });

      await editPromise;
    });
  });

  describe("applyURL", () => {
    it("selects nodes/edges and moves to position when URL has params", ({ expect }) => {
      const vuetify = createVuetify();
      const store = createMockStore({ loading: false });
      const mockRouter = { push: vi.fn(() => Promise.resolve()) };
      const mockRoute = {
        params: { ids: "n1,e1", x: "100", y: "200", scale: "1.5" },
        meta: { isView: false },
      };
      const wrapper = mount(VisContainer, {
        global: {
          plugins: [vuetify, store],
          stubs: { VisCanvas: VisCanvasStub },
          mocks: { $router: mockRouter, $route: mockRoute },
        },
      });

      const net = createMockNet();
      const nodes = createMockDataSet([{ id: "n1", group: "host" }]);
      const edges = createMockDataSet([{ id: "e1" }]);
      const container = document.createElement("div");

      // Wire via the ready event (same path as production)
      const visCanvasStub = wrapper.findComponent({ name: "VisCanvas" });
      visCanvasStub.vm.emitReady({ container, net, nodes, edges });

      // init already calls applyURL, but call again to test with fresh mocks
      net.setSelection.mockClear();
      net.moveTo.mockClear();
      wrapper.vm.applyURL();

      expect(net.setSelection).toHaveBeenCalledWith({
        nodes: ["n1"],
        edges: ["e1"],
      });
      expect(net.moveTo).toHaveBeenCalledWith({
        position: { x: 100, y: 200 },
        scale: 1.5,
      });
    });
  });

  describe("init event handlers", () => {
    function initWithHandlers() {
      const vuetify = createVuetify();
      const store = createMockStore({ loading: false });
      store.state.topology.data.items = {
        n1: { type: "host", hostname: "h1" },
        n2: { type: "switch", hostname: "s1" },
        p1: { type: "port", hostname: "eth0" },
      };
      const mockRouter = { push: vi.fn(() => Promise.resolve()) };
      const mockRoute = { params: {}, meta: { isView: false } };
      const wrapper = mount(VisContainer, {
        global: {
          plugins: [vuetify, store],
          stubs: { VisCanvas: VisCanvasStub },
          mocks: { $router: mockRouter, $route: mockRoute },
        },
      });

      const net = createMockNet();
      const nodes = createMockDataSet([
        { id: "n1", group: "host" },
        { id: "n2", group: "switch" },
        { id: "p1", group: "port" },
      ]);
      const edges = createMockDataSet([]);
      const container = document.createElement("div");

      net.getSelectedNodes.mockReturnValue([]);

      // Wire via the ready event (same path as production)
      const visCanvasStub = wrapper.findComponent({ name: "VisCanvas" });
      visCanvasStub.vm.emitReady({ container, net, nodes, edges });

      // Extract event handlers from net.on calls
      const handlers = {};
      net.on.mock.calls.forEach(([event, handler]) => {
        if (!handlers[event]) handlers[event] = [];
        handlers[event].push(handler);
      });

      return { wrapper, net, nodes, edges, store, handlers, mockRouter };
    }

    it("dragEnd with nodes commits positions", ({ expect }) => {
      const { store, handlers } = initWithHandlers();
      const dispatchSpy = vi.spyOn(store, "dispatch");

      // Find the dragEnd handler that commits positions (the first one)
      const dragEndHandler = handlers.dragEnd[0];
      dragEndHandler({ nodes: ["n1"] });

      expect(dispatchSpy).toHaveBeenCalledWith(
        "topology/updateItems",
        expect.anything(),
      );
    });

    it("dragEnd with no nodes does not commit positions", ({ expect }) => {
      const { store, handlers } = initWithHandlers();
      const dispatchSpy = vi.spyOn(store, "dispatch");

      const dragEndHandler = handlers.dragEnd[0];
      dragEndHandler({ nodes: [] });

      expect(dispatchSpy).not.toHaveBeenCalledWith(
        "topology/updateItems",
        expect.anything(),
      );
    });

    it("dragStart with single host selects connected ports", ({ expect }) => {
      const { net, handlers, edges } = initWithHandlers();
      net.getSelectedEdges.mockReturnValue(["e1"]);
      edges.get.mockImplementation((id) => {
        if (id == null) return [];
        return { id: "e1", from: "n1", to: "p1" };
      });

      const dragStartHandler = handlers.dragStart[0];
      dragStartHandler({ nodes: ["n1"] });

      expect(net.selectNodes).toHaveBeenCalledWith(["n1", "p1"]);
    });

    it("dragStart with non-host/switch does not select ports", ({ expect }) => {
      const { net, handlers, store } = initWithHandlers();
      store.state.topology.data.items.n3 = { type: "controller" };

      const dragStartHandler = handlers.dragStart[0];
      dragStartHandler({ nodes: ["n3"] });

      expect(net.selectNodes).not.toHaveBeenCalled();
    });

    it("dragStart with multiple nodes returns early", ({ expect }) => {
      const { net, handlers } = initWithHandlers();

      const dragStartHandler = handlers.dragStart[0];
      dragStartHandler({ nodes: ["n1", "n2"] });

      expect(net.selectNodes).not.toHaveBeenCalled();
    });

    it("hold on edge triggers editEdgeMode", ({ expect }) => {
      const { net, handlers } = initWithHandlers();

      const holdHandler = handlers.hold[0];
      holdHandler({ nodes: [], edges: ["e1"] });

      expect(net.editEdgeMode).toHaveBeenCalledOnce();
    });

    it("hold on host/switch node triggers organizePorts", ({ expect }) => {
      const { store, handlers, net, nodes } = initWithHandlers();
      const dispatchSpy = vi.spyOn(store, "dispatch");
      net.getConnectedNodes.mockReturnValue(["p1"]);
      net.getPositions.mockReturnValue({
        n1: { x: 100, y: 200 },
      });

      const holdHandler = handlers.hold[0];
      holdHandler({ nodes: ["n1"], edges: [] });

      expect(dispatchSpy).toHaveBeenCalled();
    });

    it("doubleClick on single edge edits the edge item", ({ expect }) => {
      const { wrapper, handlers, edges } = initWithHandlers();
      edges.get.mockImplementation((id) => {
        if (id == null) return [];
        return { id: "e1", from: "n1", to: "p1", group: "association" };
      });

      const doubleClickHandler = handlers.doubleClick[0];
      doubleClickHandler({ nodes: [], edges: ["e1"] });

      // editItem emits edit-item event
      const emitted = wrapper.emitted("edit-item");
      expect(emitted).toBeTruthy();
    });

    it("doubleClick on single node triggers editNode", ({ expect }) => {
      const { net, handlers } = initWithHandlers();

      const doubleClickHandler = handlers.doubleClick[0];
      doubleClickHandler({ nodes: ["n1"], edges: [] });

      expect(net.editNode).toHaveBeenCalledOnce();
    });
  });

  describe("routerPush", () => {
    it("suppresses NavigationDuplicated errors", async ({ expect }) => {
      const { wrapper, mockRouter } = mountWithNet();
      const navError = new Error("NavigationDuplicated");
      navError.name = "NavigationDuplicated";
      mockRouter.push.mockRejectedValueOnce(navError);

      // Should not throw
      await expect(wrapper.vm.routerPush({ name: "test" })).resolves.toBeUndefined();
    });

    it("re-throws non-NavigationDuplicated errors", async ({ expect }) => {
      const { wrapper, mockRouter } = mountWithNet();
      mockRouter.push.mockRejectedValueOnce(new Error("Other error"));

      await expect(wrapper.vm.routerPush({ name: "test" })).rejects.toThrow("Other error");
    });
  });
});
