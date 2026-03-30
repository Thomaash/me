import { describe, it, vi, beforeEach, afterEach } from "vitest";
import RectangularSelection from "@/components/vis/RectangularSelection.js";

/**
 * Test Budget: 8 distinct behaviors x 2 = 16 max
 * Behaviors:
 *   1. Full drag-select workflow (acceptance)
 *   2. attach registers listeners
 *   3. detach removes listeners and restores state
 *   4. mousedown right-click initializes drag
 *   5. mousemove updates rect during drag / aborts if released outside
 *   6. mouseup triggers selection with correct mode
 *   7. _selectNodes filters by bounds and emits select event
 *   8. _afterDrawingListener draws rect when dragging
 */

function createMockContainer() {
  return {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    offsetLeft: 0,
    offsetTop: 0,
  };
}

function createMockNetwork() {
  return {
    DOMtoCanvas: vi.fn(({ x, y }) => ({ x, y })),
    getPositions: vi.fn((id) => ({ [id]: { x: 5, y: 5 } })),
    selectNodes: vi.fn(),
    getSelectedNodes: vi.fn().mockReturnValue([]),
    getSelection: vi.fn().mockReturnValue({ nodes: [], edges: [] }),
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    redraw: vi.fn(),
  };
}

function createMockNodes(nodeList = [{ id: "n1" }, { id: "n2" }]) {
  return {
    get: vi.fn().mockReturnValue(nodeList),
  };
}

function createColors() {
  return { border: "#0000ff", background: "rgba(0,0,255,0.1)" };
}

function createMockCanvasContext() {
  return {
    strokeRect: vi.fn(),
    fillRect: vi.fn(),
    lineWidth: 0,
    strokeStyle: "",
    fillStyle: "",
  };
}

describe("RectangularSelection", () => {
  let container;
  let network;
  let nodes;
  let colors;
  let rs;
  let savedGlobalEvent;

  beforeEach(() => {
    container = createMockContainer();
    network = createMockNetwork();
    nodes = createMockNodes();
    colors = createColors();
    rs = new RectangularSelection(container, network, nodes, colors);
    savedGlobalEvent = globalThis.event;
  });

  afterEach(() => {
    globalThis.event = savedGlobalEvent;
  });

  // --- ACCEPTANCE TEST: Full drag-select workflow ---
  describe("full drag-select workflow", () => {
    it("attaches, performs right-click drag, selects nodes within bounds, and emits select event", ({
      expect,
    }) => {
      // Node n1 at (5,5) is inside rect (0,0)-(10,10), n2 at (50,50) is outside
      network.getPositions.mockImplementation((id) => {
        const positions = { n1: { x: 5, y: 5 }, n2: { x: 50, y: 50 } };
        return { [id]: positions[id] };
      });

      rs.attach();

      // Extract the registered mousedown/mousemove/mouseup listeners
      const listenerCalls = container.addEventListener.mock.calls;
      const mousedownHandler = listenerCalls.find(
        ([evt]) => evt === "mousedown",
      )[1];
      const mousemoveHandler = listenerCalls.find(
        ([evt]) => evt === "mousemove",
      )[1];
      const mouseupHandler = listenerCalls.find(
        ([evt]) => evt === "mouseup",
      )[1];

      // Right-click mousedown at (0, 0)
      mousedownHandler({ which: 3, offsetX: 0, offsetY: 0 });

      // Mousemove to (10, 10) while still holding right button
      mousemoveHandler({ which: 3, offsetX: 10, offsetY: 10 });

      // Mouseup at (10, 10) -- no modifier keys -> "set" mode
      const mouseupEvent = {
        which: 3,
        ctrlKey: false,
        shiftKey: false,
        offsetX: 10,
        offsetY: 10,
      };
      // Set globalThis.event to simulate browser's current event
      globalThis.event = mouseupEvent;
      mouseupHandler(mouseupEvent);

      // Verify selectNodes was called with only n1 (within bounds)
      expect(network.selectNodes).toHaveBeenCalledWith(["n1"]);
      // Verify select event was emitted
      expect(network.emit).toHaveBeenCalledWith(
        "select",
        expect.objectContaining({
          event: mouseupEvent,
          pointer: expect.objectContaining({
            DOM: expect.objectContaining({ x: 10, y: 10 }),
          }),
        }),
      );
    });
  });

  // --- UNIT TESTS ---

  describe("attach", () => {
    it("registers mousedown, mousemove, mouseup, contextmenu on container and afterDrawing on network", ({
      expect,
    }) => {
      rs.attach();

      // Container listeners registered
      const eventNames = container.addEventListener.mock.calls.map(
        ([name]) => name,
      );
      expect(eventNames).toEqual(
        expect.arrayContaining([
          "mousedown",
          "mousemove",
          "mouseup",
          "contextmenu",
        ]),
      );
      expect(container.addEventListener).toHaveBeenCalledTimes(4);

      // Network listener registered
      expect(network.on).toHaveBeenCalledWith(
        "afterDrawing",
        expect.any(Function),
      );
    });
  });

  describe("detach", () => {
    it("removes all listeners and triggers redraw", ({ expect }) => {
      rs.attach();

      rs.detach();

      // Container listeners removed
      const removeEventNames = container.removeEventListener.mock.calls.map(
        ([name]) => name,
      );
      expect(removeEventNames).toEqual(
        expect.arrayContaining([
          "mousedown",
          "mousemove",
          "mouseup",
          "contextmenu",
        ]),
      );
      expect(container.removeEventListener).toHaveBeenCalledTimes(4);

      // Network listener removed
      expect(network.off).toHaveBeenCalledWith(
        "afterDrawing",
        expect.any(Function),
      );

      // Redraw called to clear leftovers
      expect(network.redraw).toHaveBeenCalled();
    });
  });

  describe("_mousedownListener", () => {
    it("initializes drag state and rectDOM on right-click (which === 3)", ({
      expect,
    }) => {
      rs._mousedownListener({ which: 3, offsetX: 100, offsetY: 200 });

      expect(rs._drag).toBe(true);
      expect(rs._rectDOM).toEqual({
        startX: 100,
        startY: 200,
        endX: 100,
        endY: 200,
      });
    });

    it("ignores non-right-click events", ({ expect }) => {
      rs._mousedownListener({ which: 1, offsetX: 100, offsetY: 200 });

      expect(rs._drag).toBe(false);
    });
  });

  describe("_mousemoveListener", () => {
    beforeEach(() => {
      // Start a drag first
      rs._mousedownListener({ which: 3, offsetX: 10, offsetY: 20 });
    });

    it("updates rectDOM endX/endY and triggers redraw during right-button drag", ({
      expect,
    }) => {
      rs._mousemoveListener({ which: 3, offsetX: 50, offsetY: 60 });

      expect(rs._rectDOM.endX).toBe(50);
      expect(rs._rectDOM.endY).toBe(60);
      expect(network.redraw).toHaveBeenCalled();
    });

    it("aborts drag and redraws when mouse button is released outside container (which !== 3 while dragging)", ({
      expect,
    }) => {
      rs._mousemoveListener({ which: 0, offsetX: 50, offsetY: 60 });

      expect(rs._drag).toBe(false);
      expect(network.redraw).toHaveBeenCalled();
      expect(network.selectNodes).not.toHaveBeenCalled();
    });

    it("does nothing when not dragging and which !== 3", ({ expect }) => {
      rs._drag = false;
      network.redraw.mockClear();

      rs._mousemoveListener({ which: 1, offsetX: 50, offsetY: 60 });

      expect(rs._drag).toBe(false);
      expect(network.redraw).not.toHaveBeenCalled();
    });
  });

  describe("_mouseupListener", () => {
    it("stops drag, redraws, and calls _selectNodes on right-click release", ({
      expect,
    }) => {
      // Setup: position nodes, set rectDOM so n1 is inside
      network.getPositions.mockImplementation((id) => ({
        [id]: { x: 5, y: 5 },
      }));
      nodes.get.mockReturnValue([{ id: "n1" }]);
      rs._rectDOM = { startX: 0, startY: 0, endX: 10, endY: 10 };
      rs._drag = true;

      const mouseupEvent = {
        which: 3,
        ctrlKey: false,
        shiftKey: false,
        offsetX: 10,
        offsetY: 10,
      };
      globalThis.event = mouseupEvent;

      rs._mouseupListener(mouseupEvent);

      expect(rs._drag).toBe(false);
      expect(network.redraw).toHaveBeenCalled();
      expect(network.selectNodes).toHaveBeenCalledWith(["n1"]);
    });

    it("ignores non-right-click events", ({ expect }) => {
      rs._drag = true;

      rs._mouseupListener({ which: 1, ctrlKey: false, shiftKey: false });

      expect(rs._drag).toBe(true);
      expect(network.selectNodes).not.toHaveBeenCalled();
    });
  });

  describe("_selectNodes", () => {
    beforeEach(() => {
      rs._rectDOM = { startX: 0, startY: 0, endX: 10, endY: 10 };
      network.getPositions.mockImplementation((id) => {
        const positions = {
          n1: { x: 5, y: 5 },
          n2: { x: 50, y: 50 },
          n3: { x: 8, y: 8 },
        };
        return { [id]: positions[id] };
      });
      nodes.get.mockReturnValue([{ id: "n1" }, { id: "n2" }, { id: "n3" }]);
    });

    it("selects only nodes within rectangular bounds and emits select event", ({
      expect,
    }) => {
      const fakeEvent = { offsetX: 10, offsetY: 10 };

      rs._selectNodes("set", fakeEvent);

      // n1 (5,5) and n3 (8,8) are inside (0,0)-(10,10), n2 (50,50) is outside
      expect(network.selectNodes).toHaveBeenCalledWith(
        expect.arrayContaining(["n1", "n3"]),
      );
      expect(network.selectNodes.mock.calls[0][0]).toHaveLength(2);
      expect(network.emit).toHaveBeenCalledWith(
        "select",
        expect.objectContaining({
          event: fakeEvent,
          pointer: {
            DOM: { x: 10, y: 10 },
            canvas: { x: 10, y: 10 },
          },
        }),
      );
    });

    it("uses 'add' mode to union with previously selected nodes", ({
      expect,
    }) => {
      network.getSelectedNodes.mockReturnValue(["n2"]);
      const fakeEvent = { offsetX: 10, offsetY: 10 };

      rs._selectNodes("add", fakeEvent);

      // Should be union of prev [n2] and curr [n1, n3]
      const selectedArg = network.selectNodes.mock.calls[0][0];
      expect(selectedArg).toEqual(expect.arrayContaining(["n1", "n2", "n3"]));
      expect(selectedArg).toHaveLength(3);
    });

    it("uses 'del' mode to remove selected nodes from previous selection", ({
      expect,
    }) => {
      network.getSelectedNodes.mockReturnValue(["n1", "n2", "n3"]);
      const fakeEvent = { offsetX: 10, offsetY: 10 };

      rs._selectNodes("del", fakeEvent);

      // n1 and n3 are in bounds, so remove them from prev [n1, n2, n3] -> [n2]
      expect(network.selectNodes).toHaveBeenCalledWith(["n2"]);
    });
  });

  describe("_afterDrawingListener", () => {
    it("draws rectangle on canvas context when dragging", ({ expect }) => {
      rs._drag = true;
      rs._rectDOM = { startX: 10, startY: 20, endX: 50, endY: 60 };

      const ctx = createMockCanvasContext();

      rs._afterDrawingListener(ctx);

      expect(ctx.lineWidth).toBe(4);
      expect(ctx.strokeStyle).toBe(colors.border);
      expect(ctx.fillStyle).toBe(colors.background);
      expect(ctx.strokeRect).toHaveBeenCalledWith(10, 20, 40, 40);
      expect(ctx.fillRect).toHaveBeenCalledWith(10, 20, 40, 40);
    });

    it("does not draw when not dragging", ({ expect }) => {
      rs._drag = false;

      const ctx = createMockCanvasContext();

      rs._afterDrawingListener(ctx);

      expect(ctx.strokeRect).not.toHaveBeenCalled();
      expect(ctx.fillRect).not.toHaveBeenCalled();
    });
  });
});
