import { describe, it, vi, beforeEach } from "vitest";
import RectangularSelection from "@/components/vis/RectangularSelection.js";

/**
 * Black-box tests for RectangularSelection.
 *
 * Behaviors covered:
 *   1. attach() registers documented listeners; detach() removes them and triggers redraw.
 *   2. Right-drag flow selects in-rect nodes and emits the select event.
 *   3. Non-right mousedown does not start a drag.
 *   4. Mid-drag mousemove with non-right button aborts the drag.
 *   5. Modifier-key outcomes on mouseup: set / add (shift) / del (ctrl).
 *   6. afterDrawing draws the rect during a drag and is a no-op otherwise.
 *   7. contextmenu listener calls preventDefault.
 *   8. select event payload shape: nodes, edges, event, pointer (DOM and canvas).
 */

function createContainer({ offsetLeft = 0, offsetTop = 0 } = {}) {
  const handlers = {};
  return {
    addEventListener: vi.fn((name, fn) => {
      handlers[name] = fn;
    }),
    removeEventListener: vi.fn(),
    offsetLeft,
    offsetTop,
    handlers,
  };
}

function createNetwork(overrides = {}) {
  const handlers = {};
  return {
    DOMtoCanvas: vi.fn(({ x, y }) => ({ x, y })),
    getPositions: vi.fn((id) => ({ [id]: { x: 0, y: 0 } })),
    selectNodes: vi.fn(),
    getSelectedNodes: vi.fn().mockReturnValue([]),
    getSelection: vi.fn().mockReturnValue({ nodes: [], edges: [] }),
    emit: vi.fn(),
    on: vi.fn((name, fn) => {
      handlers[name] = fn;
    }),
    off: vi.fn(),
    redraw: vi.fn(),
    handlers,
    ...overrides,
  };
}

function createNodes(list = [{ id: "n1" }, { id: "n2" }]) {
  return { get: vi.fn().mockReturnValue(list) };
}

function createColors() {
  return { border: "#0000ff", background: "rgba(0,0,255,0.1)" };
}

function createCtx() {
  return {
    strokeRect: vi.fn(),
    fillRect: vi.fn(),
    lineWidth: 0,
    strokeStyle: "",
    fillStyle: "",
  };
}

/**
 * Fire a right-button mousedown then mousemove (drag in progress, no release).
 */
function startRightDrag(container, { sx = 0, sy = 0, ex = 10, ey = 10 } = {}) {
  container.handlers.mousedown({ which: 3, offsetX: sx, offsetY: sy });
  container.handlers.mousemove({ which: 3, offsetX: ex, offsetY: ey });
}

/**
 * Run a complete right-button drag from (sx,sy) to (ex,ey) and release with
 * the supplied modifier keys. Returns the mouseup event reference.
 */
function performRightDrag(
  container,
  { sx = 0, sy = 0, ex = 10, ey = 10, ctrlKey = false, shiftKey = false } = {},
) {
  startRightDrag(container, { sx, sy, ex, ey });
  const upEvent = {
    which: 3,
    ctrlKey,
    shiftKey,
    offsetX: ex,
    offsetY: ey,
  };
  container.handlers.mouseup(upEvent);
  return upEvent;
}

/**
 * Wire `network.getPositions` to return positions from an {id: {x,y}} map.
 */
function setNodePositions(network, positions) {
  network.getPositions.mockImplementation((id) => ({ [id]: positions[id] }));
}

describe("RectangularSelection", () => {
  let container;
  let network;
  let nodes;
  let colors;
  let rs;

  beforeEach(() => {
    container = createContainer();
    network = createNetwork();
    nodes = createNodes();
    colors = createColors();
    rs = new RectangularSelection(container, network, nodes, colors);
  });

  describe("attach / detach", () => {
    it("attach registers mousedown, mousemove, mouseup, contextmenu on container and afterDrawing on network", ({
      expect,
    }) => {
      rs.attach();

      const containerEvents = container.addEventListener.mock.calls.map(
        ([name]) => name,
      );
      expect(containerEvents).toEqual(
        expect.arrayContaining([
          "mousedown",
          "mousemove",
          "mouseup",
          "contextmenu",
        ]),
      );
      expect(container.addEventListener).toHaveBeenCalledTimes(4);
      expect(network.on).toHaveBeenCalledWith(
        "afterDrawing",
        expect.any(Function),
      );
    });

    it("detach removes the listeners it registered and triggers a redraw", ({
      expect,
    }) => {
      rs.attach();
      rs.detach();

      const removed = container.removeEventListener.mock.calls.map(
        ([name]) => name,
      );
      expect(removed).toEqual(
        expect.arrayContaining([
          "mousedown",
          "mousemove",
          "mouseup",
          "contextmenu",
        ]),
      );
      expect(container.removeEventListener).toHaveBeenCalledTimes(4);
      expect(network.off).toHaveBeenCalledWith(
        "afterDrawing",
        expect.any(Function),
      );

      // Listener identity is preserved between attach and detach.
      for (const name of ["mousedown", "mousemove", "mouseup", "contextmenu"]) {
        const added = container.addEventListener.mock.calls.find(
          ([evt]) => evt === name,
        )[1];
        const removedFn = container.removeEventListener.mock.calls.find(
          ([evt]) => evt === name,
        )[1];
        expect(removedFn).toBe(added);
      }

      expect(network.redraw).toHaveBeenCalled();
    });
  });

  describe("right-drag selection flow", () => {
    beforeEach(() => {
      // n1 at (5,5) is inside (0,0)-(10,10); n2 at (50,50) is outside.
      setNodePositions(network, {
        n1: { x: 5, y: 5 },
        n2: { x: 50, y: 50 },
      });
      rs.attach();
    });

    it("selects nodes whose positions fall inside the dragged rectangle and redraws while dragging", ({
      expect,
    }) => {
      performRightDrag(container, { sx: 0, sy: 0, ex: 10, ey: 10 });

      // Redraw fires during mousemove and on mouseup.
      expect(network.redraw.mock.calls.length).toBeGreaterThanOrEqual(2);
      expect(network.selectNodes).toHaveBeenCalledWith(["n1"]);
    });

    it("emits 'select' with nodes, edges, the originating event, and pointer (DOM + canvas)", ({
      expect,
    }) => {
      network.getSelection.mockReturnValue({ nodes: ["n1"], edges: ["e1"] });
      // Make canvas mapping distinguishable from DOM coords.
      network.DOMtoCanvas.mockImplementation(({ x, y }) => ({
        x: x * 2,
        y: y * 2,
      }));

      const upEvent = performRightDrag(container, {
        sx: 0,
        sy: 0,
        ex: 10,
        ey: 10,
      });

      expect(network.emit).toHaveBeenCalledWith("select", {
        nodes: ["n1"],
        edges: ["e1"],
        event: upEvent,
        pointer: {
          DOM: { x: 10, y: 10 },
          canvas: { x: 20, y: 20 },
        },
      });
    });

    it("normalizes a reverse drag (end before start) so in-rect nodes are still selected", ({
      expect,
    }) => {
      // Drag from (10,10) back to (0,0) -- start > end on both axes.
      performRightDrag(container, { sx: 10, sy: 10, ex: 0, ey: 0 });

      expect(network.selectNodes).toHaveBeenCalledWith(["n1"]);
    });

    it("subtracts container offsetLeft/offsetTop when computing the rectangle", ({
      expect,
    }) => {
      // Re-create with non-zero offsets; then drag at offsets that, after
      // subtraction, still cover n1 at (5,5).
      container = createContainer({ offsetLeft: 100, offsetTop: 200 });
      rs = new RectangularSelection(container, network, nodes, colors);
      rs.attach();

      performRightDrag(container, {
        sx: 100,
        sy: 200,
        ex: 110,
        ey: 210,
      });

      expect(network.selectNodes).toHaveBeenCalledWith(["n1"]);
    });
  });

  describe("non-right mousedown", () => {
    it("does not start a drag: no redraw on subsequent move and no selection on up", ({
      expect,
    }) => {
      rs.attach();

      container.handlers.mousedown({ which: 1, offsetX: 0, offsetY: 0 });
      container.handlers.mousemove({ which: 1, offsetX: 10, offsetY: 10 });
      container.handlers.mouseup({
        which: 1,
        ctrlKey: false,
        shiftKey: false,
        offsetX: 10,
        offsetY: 10,
      });

      expect(network.redraw).not.toHaveBeenCalled();
      expect(network.selectNodes).not.toHaveBeenCalled();
      expect(network.emit).not.toHaveBeenCalled();
    });
  });

  describe("mid-drag abort", () => {
    it("aborts when a non-right-button mousemove arrives during a drag (mouseup occurred outside container)", ({
      expect,
    }) => {
      rs.attach();

      startRightDrag(container, { sx: 0, sy: 0, ex: 5, ey: 5 });

      network.redraw.mockClear();

      // Released outside; next move arrives without right button.
      container.handlers.mousemove({ which: 0, offsetX: 8, offsetY: 8 });

      expect(network.redraw).toHaveBeenCalledTimes(1);
      expect(network.selectNodes).not.toHaveBeenCalled();

      // A subsequent mouseup with a non-right button must not select either.
      container.handlers.mouseup({
        which: 0,
        ctrlKey: false,
        shiftKey: false,
        offsetX: 8,
        offsetY: 8,
      });
      expect(network.selectNodes).not.toHaveBeenCalled();
    });
  });

  describe("modifier-key selection modes", () => {
    beforeEach(() => {
      // Three nodes; n1 and n3 are inside (0,0)-(10,10), n2 is outside.
      setNodePositions(network, {
        n1: { x: 5, y: 5 },
        n2: { x: 50, y: 50 },
        n3: { x: 8, y: 8 },
      });
      nodes.get.mockReturnValue([{ id: "n1" }, { id: "n2" }, { id: "n3" }]);
      rs.attach();
    });

    it("no modifier -> set: selectNodes called with exactly the in-rect ids", ({
      expect,
    }) => {
      performRightDrag(container, { sx: 0, sy: 0, ex: 10, ey: 10 });

      const arg = network.selectNodes.mock.calls[0][0];
      expect(arg).toEqual(expect.arrayContaining(["n1", "n3"]));
      expect(arg).toHaveLength(2);
    });

    it("shift held -> add: union of previously selected and in-rect ids", ({
      expect,
    }) => {
      network.getSelectedNodes.mockReturnValue(["n2"]);

      performRightDrag(container, {
        sx: 0,
        sy: 0,
        ex: 10,
        ey: 10,
        shiftKey: true,
      });

      const arg = network.selectNodes.mock.calls[0][0];
      expect(arg).toEqual(expect.arrayContaining(["n1", "n2", "n3"]));
      expect(arg).toHaveLength(3);
    });

    it("ctrl held -> del: previous selection minus in-rect ids", ({
      expect,
    }) => {
      network.getSelectedNodes.mockReturnValue(["n1", "n2", "n3"]);

      performRightDrag(container, {
        sx: 0,
        sy: 0,
        ex: 10,
        ey: 10,
        ctrlKey: true,
      });

      expect(network.selectNodes).toHaveBeenCalledWith(["n2"]);
    });

    it("ctrl + shift -> set (overrides del/add): in-rect ids only", ({
      expect,
    }) => {
      network.getSelectedNodes.mockReturnValue(["n2"]);

      performRightDrag(container, {
        sx: 0,
        sy: 0,
        ex: 10,
        ey: 10,
        ctrlKey: true,
        shiftKey: true,
      });

      const arg = network.selectNodes.mock.calls[0][0];
      expect(arg).toEqual(expect.arrayContaining(["n1", "n3"]));
      expect(arg).toHaveLength(2);
    });
  });

  describe("afterDrawing rendering", () => {
    it("draws the selection rectangle with colors.border / colors.background while dragging", ({
      expect,
    }) => {
      rs.attach();
      const afterDrawing = network.handlers.afterDrawing;

      // Start a drag and move to define a rectangle.
      startRightDrag(container, { sx: 10, sy: 20, ex: 50, ey: 60 });

      const ctx = createCtx();
      afterDrawing(ctx);

      expect(ctx.lineWidth).toBe(4);
      expect(ctx.strokeStyle).toBe(colors.border);
      expect(ctx.fillStyle).toBe(colors.background);
      expect(ctx.strokeRect).toHaveBeenCalledWith(10, 20, 40, 40);
      expect(ctx.fillRect).toHaveBeenCalledWith(10, 20, 40, 40);
    });

    it("draws nothing when no drag is active", ({ expect }) => {
      rs.attach();
      const afterDrawing = network.handlers.afterDrawing;

      const ctx = createCtx();
      afterDrawing(ctx);

      expect(ctx.strokeRect).not.toHaveBeenCalled();
      expect(ctx.fillRect).not.toHaveBeenCalled();
    });
  });

  describe("contextmenu", () => {
    it("calls preventDefault on the contextmenu event so the browser menu is suppressed", ({
      expect,
    }) => {
      rs.attach();

      const contextHandler = container.addEventListener.mock.calls.find(
        ([name]) => name === "contextmenu",
      )[1];
      const preventDefault = vi.fn();
      contextHandler({ preventDefault });

      expect(preventDefault).toHaveBeenCalled();
    });
  });
});
