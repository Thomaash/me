import { describe, it, expect, beforeEach } from "vitest";
import { topology, MAX_UNDO_LENGTH } from "@/store/topology.js";

const { mutations, actions, getters } = topology;

function createState(overrides = {}) {
  return {
    data: {
      items: {},
      ...overrides.data,
    },
    past: overrides.past || [],
    future: overrides.future || [],
  };
}

function createItems(entries) {
  return Object.fromEntries(
    entries.map(([id, props]) => [id, { id, ...props }]),
  );
}

describe("topology store module", () => {
  it("is namespaced", ({ expect }) => {
    expect(topology.namespaced).toBe(true);
  });

  describe("mutations", () => {
    describe("importData", () => {
      it("clears past and future arrays and replaces all state data keys with imported data", ({ expect }) => {
        const state = createState({
          data: { items: {}, projectName: "old" },
          past: [["entry1"]],
          future: [["entry2"]],
        });

        const importPayload = {
          version: 0,
          projectName: "New Project",
          startScript: "",
          items: [{ id: "n1", type: "host", hostname: "h1" }],
        };

        mutations.importData(state, importPayload);

        expect(state.past).toEqual([]);
        expect(state.future).toEqual([]);
        expect(state.data.items).toEqual({
          n1: { id: "n1", type: "host", hostname: "h1" },
        });
        expect(state.data.projectName).toBe("New Project");
      });
    });

    describe("setValues", () => {
      it("sets non-null non-empty values and deletes null or empty values from state data", ({ expect }) => {
        const state = createState({
          data: { items: {}, toDelete: "old", toEmpty: "old", toKeep: "keep" },
        });

        mutations.setValues(state, {
          newKey: "newValue",
          toDelete: null,
          toEmpty: "",
          toKeep: "updated",
        });

        expect(state.data.newKey).toBe("newValue");
        expect(state.data.toKeep).toBe("updated");
        expect(state.data).not.toHaveProperty("toDelete");
        expect(state.data).not.toHaveProperty("toEmpty");
      });
    });

    describe("applyChange", () => {
      let state;

      beforeEach(() => {
        state = createState({
          data: {
            items: createItems([
              ["i1", { x: 10, y: 20, label: "A" }],
              ["i2", { x: 30, y: 40, label: "B" }],
              ["i3", { x: 50, y: 60, label: "C" }],
            ]),
          },
        });
      });

      it("removes items by id array, updates items by merging properties, and replaces items entirely", ({ expect }) => {
        mutations.applyChange(state, {
          remove: ["i1"],
          update: [{ id: "i2", label: "B-updated", extra: true }],
          replace: [{ id: "i3", label: "C-replaced" }],
        });

        expect(state.data.items).not.toHaveProperty("i1");
        expect(state.data.items.i2).toEqual({
          id: "i2",
          x: 30,
          y: 40,
          label: "B-updated",
          extra: true,
        });
        expect(state.data.items.i3).toEqual({ id: "i3", label: "C-replaced" });
      });

      it.each([
        ["update", { update: [{ label: "no-id" }] }],
        ["replace", { replace: [{ label: "no-id" }] }],
      ])(
        "throws Error when %s items lack an id",
        (_kind, change) => {
          expect(() => mutations.applyChange(state, change)).toThrow(
            "Items have to have ids.",
          );
        },
      );
    });

    describe("pushChange", () => {
      it("clears future, trims past to MAX_UNDO_LENGTH, and appends new change unit", ({ expect }) => {
        const pastEntries = Array.from({ length: MAX_UNDO_LENGTH }, (_, i) => [
          `entry-${i}`,
        ]);
        const state = createState({
          past: [...pastEntries],
          future: [["future-1"]],
        });

        const newUnit = ["new-change"];
        mutations.pushChange(state, newUnit);

        expect(state.future).toEqual([]);
        expect(state.past).toHaveLength(MAX_UNDO_LENGTH);
        expect(state.past[state.past.length - 1]).toBe(newUnit);
        expect(state.past[0]).not.toEqual(pastEntries[0]);
      });
    });

    describe("undoShift", () => {
      it("pops from past and pushes to future, respecting MAX_UNDO_LENGTH", ({ expect }) => {
        const futureEntries = Array.from(
          { length: MAX_UNDO_LENGTH },
          (_, i) => [`future-${i}`],
        );
        const state = createState({
          past: [["last-past"]],
          future: [...futureEntries],
        });

        mutations.undoShift(state);

        expect(state.past).toEqual([]);
        expect(state.future).toHaveLength(MAX_UNDO_LENGTH);
        expect(state.future[state.future.length - 1]).toEqual(["last-past"]);
      });
    });

    describe("redoShift", () => {
      it("pops from future and pushes to past, respecting MAX_UNDO_LENGTH", ({ expect }) => {
        const pastEntries = Array.from(
          { length: MAX_UNDO_LENGTH },
          (_, i) => [`past-${i}`],
        );
        const state = createState({
          past: [...pastEntries],
          future: [["last-future"]],
        });

        mutations.redoShift(state);

        expect(state.future).toEqual([]);
        expect(state.past).toHaveLength(MAX_UNDO_LENGTH);
        expect(state.past[state.past.length - 1]).toEqual(["last-future"]);
      });
    });
  });

  describe("actions", () => {
    function createActionContext(state) {
      const commits = [];
      return {
        state,
        commit: (type, payload) => {
          commits.push({ type, payload });
          if (mutations[type]) {
            mutations[type](state, payload);
          }
        },
        commits,
      };
    }

    describe("removeItems", () => {
      it("records before state and commits pushChange and applyChange with remove", ({ expect }) => {
        const state = createState({
          data: {
            items: createItems([
              ["i1", { label: "A" }],
              ["i2", { label: "B" }],
            ]),
          },
        });
        const ctx = createActionContext(state);

        actions.removeItems(ctx, ["i1"]);

        expect(ctx.commits[0].type).toBe("pushChange");
        const changeLog = ctx.commits[0].payload;
        expect(JSON.parse(changeLog[0].before)).toEqual({ id: "i1", label: "A" });
        expect(JSON.parse(changeLog[0].after)).toBeNull();

        expect(ctx.commits[1]).toEqual({
          type: "applyChange",
          payload: { remove: ["i1"] },
        });
      });
    });

    describe("updateItems", () => {
      it("records before and after state and commits pushChange and applyChange with update", ({ expect }) => {
        const state = createState({
          data: {
            items: createItems([["i1", { label: "A", x: 10 }]]),
          },
        });
        const ctx = createActionContext(state);

        actions.updateItems(ctx, [{ id: "i1", label: "A-updated" }]);

        expect(ctx.commits[0].type).toBe("pushChange");
        const changeLog = ctx.commits[0].payload;
        expect(JSON.parse(changeLog[0].before)).toEqual({
          id: "i1",
          label: "A",
          x: 10,
        });
        expect(JSON.parse(changeLog[0].after)).toEqual({
          id: "i1",
          label: "A-updated",
          x: 10,
        });

        expect(ctx.commits[1]).toEqual({
          type: "applyChange",
          payload: { update: [{ id: "i1", label: "A-updated" }] },
        });
      });
    });

    describe("replaceItems", () => {
      it("records before and after state and commits pushChange and applyChange with replace", ({ expect }) => {
        const state = createState({
          data: {
            items: createItems([["i1", { label: "A", x: 10 }]]),
          },
        });
        const ctx = createActionContext(state);
        const replacement = { id: "i1", label: "replaced" };

        actions.replaceItems(ctx, [replacement]);

        expect(ctx.commits[0].type).toBe("pushChange");
        const changeLog = ctx.commits[0].payload;
        expect(JSON.parse(changeLog[0].before)).toEqual({
          id: "i1",
          label: "A",
          x: 10,
        });
        expect(JSON.parse(changeLog[0].after)).toEqual(replacement);

        expect(ctx.commits[1]).toEqual({
          type: "applyChange",
          payload: { replace: [replacement] },
        });
      });
    });

    describe("undo", () => {
      it("retrieves last past entry, commits undoShift and applyChange with swapped change", ({ expect }) => {
        const item = { id: "i1", label: "before-label" };
        const updatedItem = { id: "i1", label: "after-label" };
        const state = createState({
          data: {
            items: { i1: { ...updatedItem } },
          },
          past: [
            [
              {
                before: JSON.stringify(item),
                after: JSON.stringify(updatedItem),
              },
            ],
          ],
        });
        const ctx = createActionContext(state);

        actions.undo(ctx);

        expect(ctx.commits[0].type).toBe("undoShift");
        expect(ctx.commits[1].type).toBe("applyChange");
        // prepareUndoRedoChange swaps before/after:
        // after (updatedItem) becomes "before" in the swap, before (item) becomes "after"
        // Since updatedItem is parsed and item is parsed:
        // The swap means: parse(afterJSON) => updatedItem as "before", parse(beforeJSON) => item as "after"
        // Since "after" (item) is present, it goes to replace
        expect(ctx.commits[1].payload.replace).toEqual([item]);
      });

      it("throws Error when past is empty", ({ expect }) => {
        const state = createState();
        const ctx = createActionContext(state);

        expect(() => actions.undo(ctx)).toThrow("Nothing to undo.");
      });
    });

    describe("redo", () => {
      it("retrieves last future entry, commits redoShift and applyChange with double-swapped change", ({ expect }) => {
        const item = { id: "i1", label: "before-label" };
        const updatedItem = { id: "i1", label: "after-label" };
        const state = createState({
          data: {
            items: { i1: { ...item } },
          },
          future: [
            [
              {
                before: JSON.stringify(item),
                after: JSON.stringify(updatedItem),
              },
            ],
          ],
        });
        const ctx = createActionContext(state);

        actions.redo(ctx);

        expect(ctx.commits[0].type).toBe("redoShift");
        expect(ctx.commits[1].type).toBe("applyChange");
        // redo double-swaps: first maps {after, before} => {after: before, before: after}
        // so entry becomes {before: after=updatedItem, after: before=item}
        // then prepareUndoRedoChange swaps again: parse(afterJSON=item) as "before", parse(beforeJSON=updatedItem) as "after"
        // Since "after" (updatedItem) is present, it goes to replace
        expect(ctx.commits[1].payload.replace).toEqual([updatedItem]);
      });

      it("throws Error when future is empty", ({ expect }) => {
        const state = createState();
        const ctx = createActionContext(state);

        expect(() => actions.redo(ctx)).toThrow("Nothing to redo.");
      });
    });

    describe("prepareUndoRedoChange (tested indirectly via undo)", () => {
      it("adds id to remove array when after is present but before is null (reversal of an add)", ({ expect }) => {
        // An item was added: before=null, after=item
        // Undo should remove it: prepareUndoRedoChange swaps => parse(after)=item as "before", parse(before)=null as "after"
        // When before is present and after is null => remove.push(before.id)
        const addedItem = { id: "i1", label: "added" };
        const state = createState({
          data: {
            items: { i1: { ...addedItem } },
          },
          past: [
            [
              {
                before: JSON.stringify(null),
                after: JSON.stringify(addedItem),
              },
            ],
          ],
        });
        const ctx = createActionContext(state);

        actions.undo(ctx);

        expect(ctx.commits[1].payload.remove).toEqual(["i1"]);
        expect(ctx.commits[1].payload.replace).toEqual([]);
      });

      it("adds parsed object to replace array when before is present", ({ expect }) => {
        // An item was updated: before=oldItem, after=newItem
        // Undo: prepareUndoRedoChange swaps => parse(after)=newItem as "before", parse(before)=oldItem as "after"
        // Both present => replace.push(after) = oldItem
        const oldItem = { id: "i1", label: "old" };
        const newItem = { id: "i1", label: "new" };
        const state = createState({
          data: {
            items: { i1: { ...newItem } },
          },
          past: [
            [
              {
                before: JSON.stringify(oldItem),
                after: JSON.stringify(newItem),
              },
            ],
          ],
        });
        const ctx = createActionContext(state);

        actions.undo(ctx);

        expect(ctx.commits[1].payload.replace).toEqual([oldItem]);
        expect(ctx.commits[1].payload.remove).toEqual([]);
      });
    });
  });

  describe("getters", () => {
    describe("boundingBox", () => {
      it("computes bounding box from item coordinates with margin and scale", ({ expect }) => {
        const state = createState({
          data: {
            items: createItems([
              ["i1", { x: -100, y: -50 }],
              ["i2", { x: 200, y: 150 }],
              ["i3", { x: 0, y: 0 }],
            ]),
          },
        });

        const bbFn = getters.boundingBox(state);

        // Default margin=100, scale=1
        const bb = bbFn();
        expect(bb.sX).toBe(-200);
        expect(bb.sY).toBe(-150);
        expect(bb.eX).toBe(300);
        expect(bb.eY).toBe(250);
        expect(bb.width).toBe(500);
        expect(bb.height).toBe(400);
        expect(bb.empty).toBe(false);

        // Custom margin and scale
        const bbScaled = bbFn({ margin: 50, scale: 2 });
        expect(bbScaled.sX).toBe(-300);
        expect(bbScaled.sY).toBe(-200);
        expect(bbScaled.eX).toBe(500);
        expect(bbScaled.eY).toBe(400);
        expect(bbScaled.width).toBe(800);
        expect(bbScaled.height).toBe(600);
      });

      it("returns empty bounding box with zero dimensions when no items have coordinates", ({ expect }) => {
        const state = createState({
          data: {
            items: createItems([
              ["i1", { type: "edge" }],
              ["i2", { type: "edge" }],
            ]),
          },
        });

        const bbFn = getters.boundingBox(state);
        const bb = bbFn();

        expect(bb.empty).toBe(true);
        expect(bb.width).toBe(0);
        expect(bb.height).toBe(0);
      });

      it("updates sX and sY when a later item has smaller x or y than the first item with coordinates", ({ expect }) => {
        const state = createState({
          data: {
            items: createItems([
              ["i1", { x: 50, y: 50 }],
              ["i2", { x: -10, y: -20 }],
            ]),
          },
        });

        const bbFn = getters.boundingBox(state);
        const bb = bbFn();

        // Accumulator starts at sX=50, sY=50 from firstWithCoords (i1).
        // i2 has x=-10 < 50 so sX updates to -10; y=-20 < 50 so sY updates to -20.
        // After margin=100 and scale=1: sX = -10 - 100 = -110, sY = -20 - 100 = -120
        // eX = 50 + 100 = 150, eY = 50 + 100 = 150
        expect(bb.sX).toBe(-110);
        expect(bb.sY).toBe(-120);
        expect(bb.eX).toBe(150);
        expect(bb.eY).toBe(150);
        expect(bb.width).toBe(260);
        expect(bb.height).toBe(270);
        expect(bb.empty).toBe(false);
      });
    });

    describe("data", () => {
      it("returns the state data object", ({ expect }) => {
        const state = createState({
          data: { items: {}, projectName: "test-project" },
        });

        const result = getters.data(state);

        expect(result).toBe(state.data);
        expect(result.projectName).toBe("test-project");
      });
    });

    describe("canUndo", () => {
      it("returns the number of entries in the past array", ({ expect }) => {
        const state = createState({
          past: [["change1"], ["change2"], ["change3"]],
        });

        expect(getters.canUndo(state)).toBe(3);
      });
    });

    describe("canRedo", () => {
      it("returns the number of entries in the future array", ({ expect }) => {
        const state = createState({
          future: [["change1"], ["change2"]],
        });

        expect(getters.canRedo(state)).toBe(2);
      });
    });
  });
});
