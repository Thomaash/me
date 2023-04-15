import { expect } from "chai";

import { MAX_UNDO_LENGTH, topology } from "@/store/topology";
import exampleMedium2Controllers from "@/examples/medium_2_controllers";
import exampleTiny from "@/examples/tiny";
import exporter from "@/exporter";

const { getters, mutations } = topology;

const initState = JSON.stringify(topology.state);
function getMockState(...states) {
  return Object.assign(JSON.parse(initState), ...states);
}
function getMockStateWithTopo(...states) {
  return getMockState(
    { data: exporter.importData(exampleMedium2Controllers) },
    ...states
  );
}

describe("Store topology", () => {
  describe("Getters", () => {
    it("data", () => {
      const state = getMockStateWithTopo();

      const data = getters.data(state);

      expect(state.data).to.equal(data);
    });

    describe("Can undo", () => {
      it("0", () => {
        const state = getMockStateWithTopo();

        expect(getters.canUndo(state)).to.equal(0);
      });

      it("4", () => {
        const state = getMockStateWithTopo({
          past: Array(4),
        });

        expect(getters.canUndo(state)).to.equal(4);
      });
    });

    describe("Can redo", () => {
      it("0", () => {
        const state = getMockStateWithTopo();

        expect(getters.canRedo(state)).to.equal(0);
      });

      it("7", () => {
        const state = getMockStateWithTopo({
          future: Array(7),
        });

        expect(getters.canRedo(state)).to.equal(7);
      });
    });

    describe("Bounding box", () => {
      it("Defaults", () => {
        const state = getMockStateWithTopo();

        expect(getters.boundingBox(state)()).to.deep.equal({
          eX: 1448,
          eY: 465,
          empty: false,
          height: 1009,
          sX: -711,
          sY: -544,
          width: 2159,
        });
      });

      it("With more margin", () => {
        const state = getMockStateWithTopo();

        expect(getters.boundingBox(state)({ margin: 243 })).to.deep.equal({
          eX: 1591,
          eY: 608,
          empty: false,
          height: 1295,
          sX: -854,
          sY: -687,
          width: 2445,
        });
      });

      it("With scale", () => {
        const state = getMockStateWithTopo();

        expect(getters.boundingBox(state)({ scale: Math.PI })).to.deep.equal({
          eX: 4550,
          eY: 1461,
          empty: false,
          height: 3171,
          sX: -2234,
          sY: -1710,
          width: 6784,
        });
      });

      it("With scale and more margin", () => {
        const state = getMockStateWithTopo();

        expect(
          getters.boundingBox(state)({ scale: Math.PI, margin: 174 })
        ).to.deep.equal({
          eX: 4782,
          eY: 1694,
          empty: false,
          height: 3636,
          sX: -2467,
          sY: -1942,
          width: 7249,
        });
      });

      it("Without positions (from script import)", () => {
        const state = getMockStateWithTopo();

        Object.keys(state.data.items).forEach((id) => {
          delete state.data.items[id].x;
          delete state.data.items[id].y;
        });

        expect(getters.boundingBox(state)()).to.deep.equal({
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

  describe("Mutations", () => {
    describe("Import data", () => {
      function testImportedProject(state, externalData) {
        expect(state).to.have.all.keys("future", "past", "data");

        // Future and past should be cleared
        expect(state.future).to.be.an("array").to.be.lengthOf(0);
        expect(state.past).to.be.an("array").to.be.lengthOf(0);

        // Data should be an object with 3 properties
        expect(state.data)
          .to.be.an("object")
          .to.have.all.keys("items", "projectName", "startScript");

        // Items should contain all the items but not more
        expect(state.data.items)
          .to.be.an("object")
          .to.have.all.keys(externalData.items.map((item) => item.id));
        expect(Object.values(state.data.items)).to.deep.have.members(
          externalData.items
        );
      }

      it("Into empty store", () => {
        const state = getMockState();

        mutations.importData(state, exampleTiny);

        testImportedProject(state, exampleTiny);
      });

      it("With preexisting project", () => {
        const state = getMockStateWithTopo();

        mutations.importData(state, exampleTiny);

        testImportedProject(state, exampleTiny);
      });
    });

    it("Set values", () => {
      const state = getMockStateWithTopo();

      mutations.setValues(state, {
        projectName: "test",
        ipBase: "172.16.0.0/16",
        spawnTerminals: true,
      });

      expect(state).to.have.own.property("data").that.is.an("object");
      expect(state.data)
        .to.have.own.property("projectName")
        .that.equals("test");
      expect(state.data)
        .to.has.own.property("ipBase")
        .that.equals("172.16.0.0/16");
      expect(state.data)
        .to.has.own.property("spawnTerminals")
        .that.equals(true);
    });

    describe("Apply change", () => {
      it("With all arguments valid", () => {
        const state = getMockStateWithTopo();

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

        expect(state)
          .to.have.own.property("data")
          .that.is.an("object")
          .that.has.own.property("items")
          .that.is.an("object");

        expect(state.data.items)
          .to.have.own.property(oA.id, oA, "Original A should still be present")
          .that.deep.equals(
            oACopy,
            "Original A shouldn't be changed in any way"
          );
        expect(state.data.items).to.have.own.property(
          nA.id,
          nA,
          "New A should be added"
        );
        expect(state.data.items).to.have.own.property(
          nB.id,
          nB,
          "New B should replace original B"
        );
        expect(state.data.items)
          .to.have.own.property(
            oC.id,
            oC,
            "Original C should still be present (just altered)"
          )
          .that.has.own.property(
            "hostname",
            uC.hostname,
            "Updated C should have the new hostname"
          );
        expect(state.data.items).to.not.have.own.property(
          oD.id,
          oD,
          "D shoudn't exist anymore"
        );
      });

      it("With missing id", () => {
        const state = getMockStateWithTopo();

        // Replace without id
        expect(() => {
          mutations.applyChange(state, {
            replace: [{}],
          });
        }).to.throw();

        // Update without id
        expect(() => {
          mutations.applyChange(state, {
            update: [{}],
          });
        }).to.throw();
      });

      it("Remove nonexistent item", () => {
        const state = getMockState();

        // Shouldn't be a problem
        mutations.applyChange(state, {
          remove: ["i don't exist"],
        });
      });
    });

    describe("Push change", () => {
      function generateUnit(suffix = "") {
        return {
          before: { id: `B${suffix}` },
          after: { id: `A${suffix}` },
        };
      }
      function testState(state, past, future, pastUnit) {
        expect(state)
          .to.have.own.property("past")
          .that.is.an("array")
          .that.has.lengthOf(past)
          .that.includes(pastUnit);
        expect(state)
          .to.have.own.property("future")
          .that.is.an("array")
          .that.has.lengthOf(future);
      }

      it("Add to empty", () => {
        const state = getMockState();

        const unit = generateUnit();

        mutations.pushChange(state, unit);

        testState(state, 1, 0, unit);
      });

      it("Add to half empty", () => {
        const state = getMockState({
          past: [...Array(MAX_UNDO_LENGTH / 2)].map((_, i) => generateUnit(i)),
        });

        const unit = generateUnit();

        mutations.pushChange(state, unit);

        testState(state, MAX_UNDO_LENGTH / 2 + 1, 0, unit);
      });

      it("Add to full", () => {
        const state = getMockState({
          past: [...Array(MAX_UNDO_LENGTH)].map((_, i) => generateUnit(i)),
        });

        const unit = generateUnit();

        mutations.pushChange(state, unit);

        testState(state, MAX_UNDO_LENGTH, 0, unit);
      });
    });

    describe("Undo/redo shifts", () => {
      [
        {
          operation: "undoShift",
          before: { past: 0, future: 0 },
          after: { past: 0, future: 0 },
        },
        {
          operation: "undoShift",
          before: { past: 0, future: MAX_UNDO_LENGTH / 2 },
          after: { past: 0, future: MAX_UNDO_LENGTH / 2 },
        },
        {
          operation: "undoShift",
          before: { past: 0, future: MAX_UNDO_LENGTH },
          after: { past: 0, future: MAX_UNDO_LENGTH },
        },
        {
          operation: "undoShift",
          before: { past: MAX_UNDO_LENGTH / 2, future: 0 },
          after: { past: MAX_UNDO_LENGTH / 2 - 1, future: 1 },
        },
        {
          operation: "undoShift",
          before: { past: MAX_UNDO_LENGTH / 2, future: MAX_UNDO_LENGTH / 2 },
          after: {
            past: MAX_UNDO_LENGTH / 2 - 1,
            future: MAX_UNDO_LENGTH / 2 + 1,
          },
        },
        {
          operation: "undoShift",
          before: { past: MAX_UNDO_LENGTH / 2, future: MAX_UNDO_LENGTH },
          after: { past: MAX_UNDO_LENGTH / 2 - 1, future: MAX_UNDO_LENGTH },
        },
        {
          operation: "undoShift",
          before: { past: MAX_UNDO_LENGTH, future: 0 },
          after: { past: MAX_UNDO_LENGTH - 1, future: 1 },
        },
        {
          operation: "undoShift",
          before: { past: MAX_UNDO_LENGTH, future: MAX_UNDO_LENGTH / 2 },
          after: { past: MAX_UNDO_LENGTH - 1, future: MAX_UNDO_LENGTH / 2 + 1 },
        },
        {
          operation: "undoShift",
          before: { past: MAX_UNDO_LENGTH, future: MAX_UNDO_LENGTH },
          after: { past: MAX_UNDO_LENGTH - 1, future: MAX_UNDO_LENGTH },
        },
        {
          operation: "redoShift",
          before: { past: 0, future: 0 },
          after: { past: 0, future: 0 },
        },
        {
          operation: "redoShift",
          before: { past: 0, future: MAX_UNDO_LENGTH / 2 },
          after: { past: 1, future: MAX_UNDO_LENGTH / 2 - 1 },
        },
        {
          operation: "redoShift",
          before: { past: 0, future: MAX_UNDO_LENGTH },
          after: { past: 1, future: MAX_UNDO_LENGTH - 1 },
        },
        {
          operation: "redoShift",
          before: { past: MAX_UNDO_LENGTH / 2, future: 0 },
          after: { past: MAX_UNDO_LENGTH / 2, future: 0 },
        },
        {
          operation: "redoShift",
          before: { past: MAX_UNDO_LENGTH / 2, future: MAX_UNDO_LENGTH / 2 },
          after: {
            past: MAX_UNDO_LENGTH / 2 + 1,
            future: MAX_UNDO_LENGTH / 2 - 1,
          },
        },
        {
          operation: "redoShift",
          before: { past: MAX_UNDO_LENGTH / 2, future: MAX_UNDO_LENGTH },
          after: { past: MAX_UNDO_LENGTH / 2 + 1, future: MAX_UNDO_LENGTH - 1 },
        },
        {
          operation: "redoShift",
          before: { past: MAX_UNDO_LENGTH, future: 0 },
          after: { past: MAX_UNDO_LENGTH, future: 0 },
        },
        {
          operation: "redoShift",
          before: { past: MAX_UNDO_LENGTH, future: MAX_UNDO_LENGTH / 2 },
          after: { past: MAX_UNDO_LENGTH, future: MAX_UNDO_LENGTH / 2 - 1 },
        },
        {
          operation: "redoShift",
          before: { past: MAX_UNDO_LENGTH, future: MAX_UNDO_LENGTH },
          after: { past: MAX_UNDO_LENGTH, future: MAX_UNDO_LENGTH - 1 },
        },
      ].forEach(({ before, after, operation }) => {
        it(`Operation: ${operation}, past: ${before.past}, future: ${before.future}`, () => {
          const unitPast = {
            before: { id: "B past" },
            after: { id: "A past" },
          };
          const unitFuture = {
            before: { id: "B future" },
            after: { id: "A future" },
          };
          const state = getMockState({
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

          expect(state)
            .to.have.own.property("past")
            .that.is.an("array")
            .that.has.lengthOf(after.past, "Past length");

          expect(state)
            .to.have.own.property("future")
            .that.is.an("array")
            .that.has.lengthOf(after.future, "Future length");

          if (operation === "undoShift" && before.past) {
            if (before.future) {
              expect(state.future).to.include(
                unitFuture,
                "Future unit should be in the future"
              );
            }
            if (before.past) {
              expect(state.future).to.include(
                unitPast,
                "Past unit should be in the future"
              );
            }
          } else if (operation === "redoShift") {
            if (before.future) {
              expect(state.past).to.include(
                unitFuture,
                "Future unit should be in the past"
              );
            }
            if (before.past) {
              expect(state.past).to.include(
                unitPast,
                "Past unit should be in the past"
              );
            }
          }
        });
      });
    });
  });
});
