import { defineStore } from "pinia";

import exporter from "@/exporter";
import exampleData from "@/examples/medium_1_controller";

const MAX_UNDO_LENGTH = 200;
export { MAX_UNDO_LENGTH };

function prepareUndoRedoChange(changeLogItem) {
  const change = {
    remove: [],
    replace: [],
  };

  changeLogItem.forEach(({ before: beforeJSON, after: afterJSON }) => {
    const before = JSON.parse(afterJSON);
    const after = JSON.parse(beforeJSON);

    if (before && !after) {
      change.remove.push(before.id);
    } else {
      change.replace.push(after);
    }
  });

  return change;
}

export const useTopologyStore = defineStore("topology", {
  persist: true,
  state: () => ({
    data: exporter.importData(exampleData),
    past: [],
    future: [],
  }),
  getters: {
    canUndo: (state) => state.past.length,
    canRedo: (state) => state.future.length,
    boundingBox(state) {
      const rawBB = (() => {
        const items = Object.values(state.data.items);

        const firstWithCoords = items.find(
          ({ x, y }) => x != null && y != null,
        );

        if (!firstWithCoords) {
          return { sX: 0, eX: 0, sY: 0, eY: 0, empty: true };
        }

        return items.reduce(
          (acc, { x, y }) => {
            if (x < acc.sX) {
              acc.sX = x;
            } else if (x > acc.eX) {
              acc.eX = x;
            }
            if (y < acc.sY) {
              acc.sY = y;
            } else if (y > acc.eY) {
              acc.eY = y;
            }

            return acc;
          },
          {
            sX: firstWithCoords.x,
            eX: firstWithCoords.x,
            sY: firstWithCoords.y,
            eY: firstWithCoords.y,
            empty: false,
          },
        );
      })();

      return ({ margin = 100, scale = 1 } = {}) => {
        const bb = { ...rawBB, width: 0, height: 0 };

        if (bb.empty) {
          return bb;
        }

        bb.sX -= margin;
        bb.sY -= margin;
        bb.eX += margin;
        bb.eY += margin;

        bb.sX *= scale;
        bb.sY *= scale;
        bb.eX *= scale;
        bb.eY *= scale;

        bb.sX = Math.ceil(Math.abs(bb.sX)) * Math.sign(bb.sX);
        bb.sY = Math.ceil(Math.abs(bb.sY)) * Math.sign(bb.sY);
        bb.eX = Math.ceil(Math.abs(bb.eX)) * Math.sign(bb.eX);
        bb.eY = Math.ceil(Math.abs(bb.eY)) * Math.sign(bb.eY);

        bb.width = bb.eX - bb.sX;
        bb.height = bb.eY - bb.sY;

        return bb;
      };
    },
  },
  actions: {
    importData(importPayload) {
      this.past.splice(0);
      this.future.splice(0);

      Object.keys(this.data).forEach((key) => {
        delete this.data[key];
      });

      const data = exporter.importData(importPayload);
      Object.keys(data).forEach((key) => (this.data[key] = data[key]));
    },
    setValues(values) {
      Object.keys(values).forEach((key) => {
        const value = values[key];
        if (value != null && value !== "") {
          this.data[key] = value;
        } else {
          delete this.data[key];
        }
      });
    },
    applyChange({ remove, update, replace }) {
      if (remove) {
        remove.forEach((id) => {
          delete this.data.items[id];
        });
      }

      if (update) {
        update.forEach((item) => {
          if (item.id == null) {
            throw new Error("Items have to have ids.");
          }
          const saved = this.data.items[item.id];
          Object.keys(item).forEach((key) => {
            saved[key] = item[key];
          });
        });
      }

      if (replace) {
        replace.forEach((item) => {
          if (item.id == null) {
            throw new Error("Items have to have ids.");
          }
          this.data.items[item.id] = item;
        });
      }
    },
    _pushChange(unit) {
      this.future.splice(0);
      if (this.past.length >= MAX_UNDO_LENGTH) {
        this.past.splice(0, this.past.length + 1 - MAX_UNDO_LENGTH);
      }
      this.past.push(unit);
    },
    _undoShift() {
      if (this.past.length) {
        if (this.future.length >= MAX_UNDO_LENGTH) {
          this.future.shift();
        }
        this.future.push(this.past.pop());
      }
    },
    _redoShift() {
      if (this.future.length) {
        if (this.past.length >= MAX_UNDO_LENGTH) {
          this.past.shift();
        }
        this.past.push(this.future.pop());
      }
    },
    removeItems(ids) {
      this._pushChange(
        ids.map((id) => ({
          before: JSON.stringify(this.data.items[id] || null),
          after: JSON.stringify(null),
        })),
      );

      this.applyChange({
        remove: ids,
      });
    },
    updateItems(items) {
      this._pushChange(
        items.map((item) => {
          const before = this.data.items[item.id];
          return {
            before: JSON.stringify(before || null),
            after: JSON.stringify({ ...before, ...item }),
          };
        }),
      );

      this.applyChange({
        update: items,
      });
    },
    replaceItems(items) {
      this._pushChange(
        items.map((item) => ({
          before: JSON.stringify(this.data.items[item.id] || null),
          after: JSON.stringify(item),
        })),
      );

      this.applyChange({
        replace: items,
      });
    },
    undo() {
      const unit = this.past[this.past.length - 1];
      if (unit) {
        this._undoShift();
        this.applyChange(prepareUndoRedoChange(unit));
      } else {
        throw new Error("Nothing to undo.");
      }
    },
    redo() {
      const unit = this.future[this.future.length - 1];
      if (unit) {
        this._redoShift();
        this.applyChange(
          prepareUndoRedoChange(
            unit.map(({ after, before }) => ({
              after: before,
              before: after,
            })),
          ),
        );
      } else {
        throw new Error("Nothing to redo.");
      }
    },
  },
});
