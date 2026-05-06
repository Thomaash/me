import { describe, it, vi, beforeEach } from "vitest";
import deselectHandler from "@/components/vis/deselectHandler.js";

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

  it("removes items from selection when ctrlKey is true and all selected items are already in previousSelection", ({
    expect,
  }) => {
    const srcEvent = { ctrlKey: true };
    const event = {
      event: Object.assign(Object.create(null), {
        srcEvent,
        _id: "remove-test",
      }),
      nodes: ["n1"],
      edges: ["e1"],
      previousSelection: { nodes: ["n1", "n2"], edges: ["e1", "e2"] },
    };

    deselectHandler(net, event);

    expect(net.setSelection).toHaveBeenCalledWith({
      nodes: ["n2"],
      edges: ["e2"],
    });
  });

  it("adds new items to previousSelection when ctrlKey is true and items are not all in previousSelection", ({
    expect,
  }) => {
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

  it("ignores duplicate events (same event.event object reference)", ({
    expect,
  }) => {
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

    expect(net.setSelection).toHaveBeenCalledTimes(1);
  });
});
