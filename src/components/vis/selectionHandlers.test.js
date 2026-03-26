import { describe, it, expect, vi, beforeEach } from "vitest";
import deselectHandler from "@/components/vis/deselectHandler.js";
import RectangularSelection from "@/components/vis/RectangularSelection.js";

describe("deselectHandler", () => {
  let net;

  beforeEach(() => {
    net = { setSelection: vi.fn() };
  });

  it("does nothing when ctrlKey is false", ({ expect }) => {
    const event = {
      event: { srcEvent: { ctrlKey: false } },
      nodes: ["n1"],
      edges: ["e1"],
      previousSelection: { nodes: [], edges: [] },
    };

    deselectHandler(net, event);

    expect(net.setSelection).not.toHaveBeenCalled();
  });

  it("removes items from selection when ctrlKey is true and all selected items are already in previousSelection", ({ expect }) => {
    const srcEvent = { ctrlKey: true };
    const event = {
      event: { srcEvent, _id: "remove-test" },
      nodes: ["n1"],
      edges: ["e1"],
      previousSelection: { nodes: ["n1", "n2"], edges: ["e1", "e2"] },
    };
    // Make event.event unique to avoid duplicate detection
    event.event = Object.create(null);
    Object.assign(event.event, { srcEvent, _id: "remove-test" });

    deselectHandler(net, event);

    expect(net.setSelection).toHaveBeenCalledWith({
      nodes: ["n2"],
      edges: ["e2"],
    });
  });

  it("adds new items to previousSelection when ctrlKey is true and items are not all in previousSelection", ({ expect }) => {
    const srcEvent = { ctrlKey: true };
    const event = {
      event: { srcEvent },
      nodes: ["n3"],
      edges: ["e3"],
      previousSelection: { nodes: ["n1"], edges: ["e1"] },
    };

    deselectHandler(net, event);

    expect(net.setSelection).toHaveBeenCalledWith({
      nodes: expect.arrayContaining(["n1", "n3"]),
      edges: expect.arrayContaining(["e1", "e3"]),
    });
    const call = net.setSelection.mock.calls[0][0];
    expect(call.nodes).toHaveLength(2);
    expect(call.edges).toHaveLength(2);
  });

  it("ignores duplicate events (same event.event object reference)", ({ expect }) => {
    const sharedInnerEvent = { srcEvent: { ctrlKey: true } };
    const event1 = {
      event: sharedInnerEvent,
      nodes: ["n1"],
      edges: [],
      previousSelection: { nodes: [], edges: [] },
    };
    const event2 = {
      event: sharedInnerEvent,
      nodes: ["n2"],
      edges: [],
      previousSelection: { nodes: [], edges: [] },
    };

    deselectHandler(net, event1);
    deselectHandler(net, event2);

    // First call should go through, second should be ignored
    expect(net.setSelection).toHaveBeenCalledTimes(1);
  });
});

describe("RectangularSelection", () => {
  describe("_orderPair", () => {
    it.each([
      { a: 1, b: 5, expected: [1, 5], desc: "a < b" },
      { a: 10, b: 3, expected: [3, 10], desc: "a > b" },
      { a: 4, b: 4, expected: [4, 4], desc: "a === b" },
    ])("returns [$expected] when $desc (a=$a, b=$b)", ({ a, b, expected }) => {
      const rs = new RectangularSelection({}, {}, {}, {});
      expect(rs._orderPair(a, b)).toEqual(expected);
    });
  });

  describe("_prepareNodeSelection", () => {
    let rs;
    let mockNetwork;

    beforeEach(() => {
      mockNetwork = { getSelectedNodes: vi.fn() };
      rs = new RectangularSelection({}, mockNetwork, {}, {});
    });

    it("returns curr array as-is when mode is 'set'", ({ expect }) => {
      const curr = ["n1", "n2"];

      const result = rs._prepareNodeSelection(curr, "set");

      expect(result).toBe(curr);
    });

    it("returns union of prev and curr when mode is 'add'", ({ expect }) => {
      mockNetwork.getSelectedNodes.mockReturnValue(["n1", "n2"]);
      const curr = ["n2", "n3"];

      const result = rs._prepareNodeSelection(curr, "add");

      expect(result).toEqual(expect.arrayContaining(["n1", "n2", "n3"]));
      expect(result).toHaveLength(3);
    });

    it("returns prev filtered by curr when mode is 'del'", ({ expect }) => {
      mockNetwork.getSelectedNodes.mockReturnValue(["n1", "n2", "n3"]);
      const curr = ["n2"];

      const result = rs._prepareNodeSelection(curr, "del");

      expect(result).toEqual(["n1", "n3"]);
    });
  });

  describe("keysModeMap (via _mouseupListener)", () => {
    it.each([
      { ctrlKey: false, shiftKey: false, expectedMode: "set" },
      { ctrlKey: false, shiftKey: true, expectedMode: "add" },
      { ctrlKey: true, shiftKey: false, expectedMode: "del" },
      { ctrlKey: true, shiftKey: true, expectedMode: "set" },
    ])(
      "maps ctrl=$ctrlKey, shift=$shiftKey to mode '$expectedMode'",
      ({ ctrlKey, shiftKey, expectedMode }) => {
        const mockNetwork = {
          getSelectedNodes: vi.fn().mockReturnValue([]),
          redraw: vi.fn(),
          DOMtoCanvas: vi.fn().mockReturnValue({ x: 0, y: 0 }),
          getPositions: vi.fn().mockReturnValue({}),
          selectNodes: vi.fn(),
          getSelection: vi.fn().mockReturnValue({ nodes: [], edges: [] }),
          emit: vi.fn(),
        };
        const mockNodes = { get: vi.fn().mockReturnValue([]) };
        const rs = new RectangularSelection({}, mockNetwork, mockNodes, {});
        rs._rectDOM = { startX: 0, startY: 0, endX: 10, endY: 10 };

        const selectNodesSpy = vi
          .spyOn(rs, "_selectNodes")
          .mockImplementation(() => {});

        rs._mouseupListener({ which: 3, ctrlKey, shiftKey });

        expect(selectNodesSpy.mock.calls[0][0]).toBe(expectedMode);
      },
    );
  });
});
