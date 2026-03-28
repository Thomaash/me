import { describe, it, expect, beforeEach } from "vitest";
import { topology, MAX_UNDO_LENGTH } from "@/store/topology.js";
import exampleMedium2Controllers from "@/examples/medium_2_controllers";
import exampleTiny from "@/examples/tiny";
import exporter from "@/exporter";

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

function createStateWithTopo(...overrides) {
  return {
    data: exporter.importData(exampleMedium2Controllers),
    past: [],
    future: [],
    ...Object.assign({}, ...overrides),
  };
}

describe("topology store module", () => {
  it("is namespaced", ({ expect }) => {
    expect(topology.namespaced).toBe(true);
  });

  describe("mutations", () => {
    describe("importData", () => {
      it("clears past and future arrays and replaces all state data keys with imported data", ({
        expect,
      }) => {
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
      it("sets non-null non-empty values and deletes null or empty values from state data", ({
        expect,
      }) => {
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

      it("removes items by id array, updates items by merging properties, and replaces items entirely", ({
        expect,
      }) => {
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
      ])("throws Error when %s items lack an id", (_kind, change) => {
        expect(() => mutations.applyChange(state, change)).toThrow(
          "Items have to have ids.",
        );
      });
    });

    describe("pushChange", () => {
      it("clears future, trims past to MAX_UNDO_LENGTH, and appends new change unit", ({
        expect,
      }) => {
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
      it("pops from past and pushes to future, respecting MAX_UNDO_LENGTH", ({
        expect,
      }) => {
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
      it("pops from future and pushes to past, respecting MAX_UNDO_LENGTH", ({
        expect,
      }) => {
        const pastEntries = Array.from({ length: MAX_UNDO_LENGTH }, (_, i) => [
          `past-${i}`,
        ]);
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
      it("records before state and commits pushChange and applyChange with remove", ({
        expect,
      }) => {
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
        expect(JSON.parse(changeLog[0].before)).toEqual({
          id: "i1",
          label: "A",
        });
        expect(JSON.parse(changeLog[0].after)).toBeNull();

        expect(ctx.commits[1]).toEqual({
          type: "applyChange",
          payload: { remove: ["i1"] },
        });
      });
    });

    describe("updateItems", () => {
      it("records before and after state and commits pushChange and applyChange with update", ({
        expect,
      }) => {
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
      it("records before and after state and commits pushChange and applyChange with replace", ({
        expect,
      }) => {
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
      it("retrieves last past entry, commits undoShift and applyChange with swapped change", ({
        expect,
      }) => {
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
      it("retrieves last future entry, commits redoShift and applyChange with double-swapped change", ({
        expect,
      }) => {
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
      it("adds id to remove array when after is present but before is null (reversal of an add)", ({
        expect,
      }) => {
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

      it("adds parsed object to replace array when before is present", ({
        expect,
      }) => {
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
      it("computes bounding box from item coordinates with margin and scale", ({
        expect,
      }) => {
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

      it("returns empty bounding box with zero dimensions when no items have coordinates", ({
        expect,
      }) => {
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

      it("updates sX and sY when a later item has smaller x or y than the first item with coordinates", ({
        expect,
      }) => {
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

  describe("real data integration", () => {
    describe("getters", () => {
      it("data returns state.data", ({ expect }) => {
        const state = createStateWithTopo();

        const data = getters.data(state);

        expect(data).toBe(state.data);
      });

      describe("canUndo", () => {
        it("returns 0 with empty past", ({ expect }) => {
          const state = createStateWithTopo();

          expect(getters.canUndo(state)).toBe(0);
        });

        it("returns 4 with past of length 4", ({ expect }) => {
          const state = createStateWithTopo({ past: Array(4) });

          expect(getters.canUndo(state)).toBe(4);
        });
      });

      describe("canRedo", () => {
        it("returns 0 with empty future", ({ expect }) => {
          const state = createStateWithTopo();

          expect(getters.canRedo(state)).toBe(0);
        });

        it("returns 7 with future of length 7", ({ expect }) => {
          const state = createStateWithTopo({ future: Array(7) });

          expect(getters.canRedo(state)).toBe(7);
        });
      });

      describe("boundingBox", () => {
        it("defaults", ({ expect }) => {
          const state = createStateWithTopo();

          expect(getters.boundingBox(state)()).toEqual({
            eX: 1448,
            eY: 465,
            empty: false,
            height: 1009,
            sX: -711,
            sY: -544,
            width: 2159,
          });
        });

        it("with more margin", ({ expect }) => {
          const state = createStateWithTopo();

          expect(getters.boundingBox(state)({ margin: 243 })).toEqual({
            eX: 1591,
            eY: 608,
            empty: false,
            height: 1295,
            sX: -854,
            sY: -687,
            width: 2445,
          });
        });

        it("with scale", ({ expect }) => {
          const state = createStateWithTopo();

          expect(getters.boundingBox(state)({ scale: Math.PI })).toEqual({
            eX: 4550,
            eY: 1461,
            empty: false,
            height: 3171,
            sX: -2234,
            sY: -1710,
            width: 6784,
          });
        });

        it("with scale and more margin", ({ expect }) => {
          const state = createStateWithTopo();

          expect(
            getters.boundingBox(state)({ scale: Math.PI, margin: 174 }),
          ).toEqual({
            eX: 4782,
            eY: 1694,
            empty: false,
            height: 3636,
            sX: -2467,
            sY: -1942,
            width: 7249,
          });
        });

        it("without positions (from script import)", ({ expect }) => {
          const state = createStateWithTopo();

          Object.keys(state.data.items).forEach((id) => {
            delete state.data.items[id].x;
            delete state.data.items[id].y;
          });

          expect(getters.boundingBox(state)()).toEqual({
            eX: 0,
            eY: 0,
            empty: true,
            height: 0,
            sX: 0,
            sY: 0,
            width: 0,
          });
        });
      });
    });

    describe("importData", () => {
      function verifyImportedProject(state, externalData, { expect }) {
        expect(state).toHaveProperty("future");
        expect(state).toHaveProperty("past");
        expect(state).toHaveProperty("data");

        // Future and past should be cleared
        expect(state.future).toEqual([]);
        expect(state.future).toHaveLength(0);
        expect(state.past).toEqual([]);
        expect(state.past).toHaveLength(0);

        // Data should be an object with 3 properties
        expect(state.data).toHaveProperty("items");
        expect(state.data).toHaveProperty("projectName");
        expect(state.data).toHaveProperty("startScript");

        // Items should contain all the items but not more
        const expectedIds = externalData.items.map((item) => item.id);
        const actualIds = Object.keys(state.data.items);
        expect(actualIds).toHaveLength(expectedIds.length);
        expectedIds.forEach((id) => {
          expect(state.data.items).toHaveProperty(id);
        });

        // Values should deep equal the items
        expect(Object.values(state.data.items)).toEqual(
          expect.arrayContaining(externalData.items),
        );
        expect(externalData.items).toEqual(
          expect.arrayContaining(Object.values(state.data.items)),
        );
      }

      it("into empty store", ({ expect }) => {
        const state = createState();

        mutations.importData(state, exampleTiny);

        verifyImportedProject(state, exampleTiny, { expect });
      });

      it("with preexisting project", ({ expect }) => {
        const state = createStateWithTopo();

        mutations.importData(state, exampleTiny);

        verifyImportedProject(state, exampleTiny, { expect });
      });
    });

    describe("setValues", () => {
      it("sets values on state.data with real topology", ({ expect }) => {
        const state = createStateWithTopo();

        mutations.setValues(state, {
          projectName: "test",
          ipBase: "172.16.0.0/16",
          spawnTerminals: true,
        });

        expect(state.data).toMatchObject({
          projectName: "test",
          ipBase: "172.16.0.0/16",
          spawnTerminals: true,
        });
      });
    });

    describe("applyChange", () => {
      it("with all arguments valid (checking originals not mutated)", ({
        expect,
      }) => {
        const state = createStateWithTopo();

        const originalValues = Object.values(state.data.items);
        const [oA, oB, oC, oD] = originalValues;
        const oACopy = { ...oA };
        const nA = {
          ...oA,
          id: "A",
        };
        const nB = {
          ...oB,
          hostname: "B",
        };
        const uC = {
          id: oC.id,
          hostname: "C",
        };

        mutations.applyChange(state, {
          replace: [nA, nB],
          remove: [oD.id],
          update: [uC],
        });

        // Original A should still be present and unchanged (deep copy check)
        expect(state.data.items).toHaveProperty(oA.id);
        expect(state.data.items[oA.id]).toBe(oA);
        expect(state.data.items[oA.id]).toEqual(oACopy);

        // New A should be added
        expect(state.data.items).toHaveProperty(nA.id);
        expect(state.data.items[nA.id]).toBe(nA);

        // New B should replace original B
        expect(state.data.items).toHaveProperty(nB.id);
        expect(state.data.items[nB.id]).toBe(nB);

        // Original C should still be present (just altered) with new hostname
        expect(state.data.items).toHaveProperty(oC.id);
        expect(state.data.items[oC.id]).toBe(oC);
        expect(state.data.items[oC.id].hostname).toBe(uC.hostname);

        // D should no longer exist
        expect(state.data.items).not.toHaveProperty(oD.id);
      });

      it("remove nonexistent item", ({ expect }) => {
        const state = createState();

        // Should not throw
        mutations.applyChange(state, {
          remove: ["i don't exist"],
        });

        expect(state.data.items).toEqual({});
      });
    });

    describe("pushChange", () => {
      function generateUnit(suffix = "") {
        return {
          before: { id: `B${suffix}` },
          after: { id: `A${suffix}` },
        };
      }

      it("add to empty", ({ expect }) => {
        const state = createState();
        const unit = generateUnit();

        mutations.pushChange(state, unit);

        expect(state.past).toHaveLength(1);
        expect(state.past).toContain(unit);
        expect(state.future).toHaveLength(0);
      });

      it("add to half empty", ({ expect }) => {
        const half = MAX_UNDO_LENGTH / 2;
        const state = createState({
          past: [...Array(half)].map((_, i) => generateUnit(i)),
        });
        const unit = generateUnit();

        mutations.pushChange(state, unit);

        expect(state.past).toHaveLength(half + 1);
        expect(state.past).toContain(unit);
        expect(state.future).toHaveLength(0);
      });
    });

    describe("undo/redo shift matrix", () => {
      const half = MAX_UNDO_LENGTH / 2;
      const full = MAX_UNDO_LENGTH;

      const shiftCases = [
        {
          operation: "undoShift",
          before: { past: 0, future: 0 },
          after: { past: 0, future: 0 },
        },
        {
          operation: "undoShift",
          before: { past: 0, future: half },
          after: { past: 0, future: half },
        },
        {
          operation: "undoShift",
          before: { past: 0, future: full },
          after: { past: 0, future: full },
        },
        {
          operation: "undoShift",
          before: { past: half, future: 0 },
          after: { past: half - 1, future: 1 },
        },
        {
          operation: "undoShift",
          before: { past: half, future: half },
          after: { past: half - 1, future: half + 1 },
        },
        {
          operation: "undoShift",
          before: { past: half, future: full },
          after: { past: half - 1, future: full },
        },
        {
          operation: "undoShift",
          before: { past: full, future: 0 },
          after: { past: full - 1, future: 1 },
        },
        {
          operation: "undoShift",
          before: { past: full, future: half },
          after: { past: full - 1, future: half + 1 },
        },
        {
          operation: "undoShift",
          before: { past: full, future: full },
          after: { past: full - 1, future: full },
        },
        {
          operation: "redoShift",
          before: { past: 0, future: 0 },
          after: { past: 0, future: 0 },
        },
        {
          operation: "redoShift",
          before: { past: 0, future: half },
          after: { past: 1, future: half - 1 },
        },
        {
          operation: "redoShift",
          before: { past: 0, future: full },
          after: { past: 1, future: full - 1 },
        },
        {
          operation: "redoShift",
          before: { past: half, future: 0 },
          after: { past: half, future: 0 },
        },
        {
          operation: "redoShift",
          before: { past: half, future: half },
          after: { past: half + 1, future: half - 1 },
        },
        {
          operation: "redoShift",
          before: { past: half, future: full },
          after: { past: half + 1, future: full - 1 },
        },
        {
          operation: "redoShift",
          before: { past: full, future: 0 },
          after: { past: full, future: 0 },
        },
        {
          operation: "redoShift",
          before: { past: full, future: half },
          after: { past: full, future: half - 1 },
        },
        {
          operation: "redoShift",
          before: { past: full, future: full },
          after: { past: full, future: full - 1 },
        },
      ];

      shiftCases.forEach(({ operation, before, after }) => {
        it(`${operation}: past=${before.past}, future=${before.future} -> past=${after.past}, future=${after.future}`, ({
          expect,
        }) => {
          const unitPast = {
            before: { id: "B past" },
            after: { id: "A past" },
          };
          const unitFuture = {
            before: { id: "B future" },
            after: { id: "A future" },
          };

          const state = createState({
            past: [
              ...[...Array((before.past || 1) - 1)].map((_, i) => ({
                before: { id: `B${i}` },
                after: { id: `A${i}` },
              })),
              ...(before.past > 0 ? [unitPast] : []),
            ],
            future: [
              ...[...Array((before.future || 1) - 1)].map((_, i) => ({
                before: { id: `B${i}` },
                after: { id: `A${i}` },
              })),
              ...(before.future > 0 ? [unitFuture] : []),
            ],
          });

          mutations[operation](state);

          expect(state.past).toHaveLength(after.past);
          expect(state.future).toHaveLength(after.future);

          if (operation === "undoShift" && before.past) {
            if (before.future) {
              expect(state.future).toContain(unitFuture);
            }
            if (before.past) {
              expect(state.future).toContain(unitPast);
            }
          } else if (operation === "redoShift") {
            if (before.future) {
              expect(state.past).toContain(unitFuture);
            }
            if (before.past) {
              expect(state.past).toContain(unitPast);
            }
          }
        });
      });
    });
  });
});
