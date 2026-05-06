import { defineStore } from "pinia";
import { ref, computed } from "vue";

import { importData as importDataExternal } from "@/exporter";
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

export const useTopologyStore = defineStore(
  "topology",
  () => {
    const data = ref(importDataExternal(exampleData));
    const past = ref([]);
    const future = ref([]);

    const canUndo = computed(() => past.value.length);
    const canRedo = computed(() => future.value.length);

    const boundingBox = computed(() => {
      const rawBB = (() => {
        const items = Object.values(data.value.items);

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
    });

    function pushChange(unit) {
      future.value.splice(0);
      if (past.value.length >= MAX_UNDO_LENGTH) {
        past.value.splice(0, past.value.length + 1 - MAX_UNDO_LENGTH);
      }
      past.value.push(unit);
    }

    function undoShift() {
      if (past.value.length) {
        if (future.value.length >= MAX_UNDO_LENGTH) {
          future.value.shift();
        }
        future.value.push(past.value.pop());
      }
    }

    function redoShift() {
      if (future.value.length) {
        if (past.value.length >= MAX_UNDO_LENGTH) {
          past.value.shift();
        }
        past.value.push(future.value.pop());
      }
    }

    function importData(importPayload) {
      past.value.splice(0);
      future.value.splice(0);

      Object.keys(data.value).forEach((key) => {
        delete data.value[key];
      });

      const imported = importDataExternal(importPayload);
      Object.keys(imported).forEach((key) => {
        data.value[key] = imported[key];
      });
    }

    function setValues(values) {
      Object.keys(values).forEach((key) => {
        const value = values[key];
        if (value != null && value !== "") {
          data.value[key] = value;
        } else {
          delete data.value[key];
        }
      });
    }

    function applyChange({ remove, update, replace }) {
      if (remove) {
        remove.forEach((id) => {
          delete data.value.items[id];
        });
      }

      if (update) {
        update.forEach((item) => {
          if (item.id == null) {
            throw new Error("Items have to have ids.");
          }
          const saved = data.value.items[item.id];
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
          data.value.items[item.id] = item;
        });
      }
    }

    function removeItems(ids) {
      pushChange(
        ids.map((id) => ({
          before: JSON.stringify(data.value.items[id] || null),
          after: JSON.stringify(null),
        })),
      );

      applyChange({
        remove: ids,
      });
    }

    function updateItems(items) {
      pushChange(
        items.map((item) => {
          const before = data.value.items[item.id];
          return {
            before: JSON.stringify(before || null),
            after: JSON.stringify({ ...before, ...item }),
          };
        }),
      );

      applyChange({
        update: items,
      });
    }

    function replaceItems(items) {
      pushChange(
        items.map((item) => ({
          before: JSON.stringify(data.value.items[item.id] || null),
          after: JSON.stringify(item),
        })),
      );

      applyChange({
        replace: items,
      });
    }

    function undo() {
      const unit = past.value[past.value.length - 1];
      if (unit) {
        undoShift();
        applyChange(prepareUndoRedoChange(unit));
      } else {
        throw new Error("Nothing to undo.");
      }
    }

    function redo() {
      const unit = future.value[future.value.length - 1];
      if (unit) {
        redoShift();
        applyChange(
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
    }

    return {
      data,
      past,
      future,
      canUndo,
      canRedo,
      boundingBox,
      importData,
      setValues,
      applyChange,
      removeItems,
      updateItems,
      replaceItems,
      undo,
      redo,
    };
  },
  { persist: true },
);
