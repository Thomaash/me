import { describe, it } from "vitest";
import { Builder } from "@/builder/index.js";
import { importScript } from "@/importScript/index.js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import tiny from "@/examples/tiny";
import tinyController from "@/examples/tiny_controller";
import tinyTC from "@/examples/tiny_tc";
import tinyPhysicalInterface from "@/examples/tiny_physical_interface";
import tinyMininetConf from "@/examples/tiny_mininet_conf";
import medium1Controller from "@/examples/medium_1_controller";
import medium2Controllers from "@/examples/medium_2_controllers";

function getCleanItems(items, typeOnly) {
  return items
    .filter((node) => !typeOnly || node.type === typeOnly)
    .map((orig) => {
      const type = orig.type;
      const isEdge = type === "link" || type === "association";
      const clean = {};
      Object.keys(orig).forEach((key) => {
        if (type === "port" && key === "ips") {
          clean[key] = orig[key].toSorted();
        } else if (key === "startScript" || key === "stopScript") {
          clean[key] = orig[key]
            .split("\n")
            .filter((line) => !/^(\s*#|$)/.test(line))
            .join("\n");
        } else if (
          (isEdge && !/^(id|hostname|from|to)$/.test(key)) ||
          (!isEdge && !/^(id|x|y)$/.test(key))
        ) {
          clean[key] = orig[key];
        }
      });
      return clean;
    });
}

function removeNonCode(script) {
  return script
    .split("\n")
    .filter((line) => !/^($|#)/.test(line))
    .join("\n");
}

function sortByJson(arr) {
  return arr.toSorted((a, b) =>
    JSON.stringify(a).localeCompare(JSON.stringify(b)),
  );
}

const types = {
  autoSetMAC: "boolean",
  autoStaticARP: "boolean",
  inNamespace: "boolean",
  ipBase: "string",
  items: "array",
  listenPortBase: "number",
  logLevel: "string",
  spawnTerminals: "boolean",
  startScript: "string",
  stopScript: "string",
  version: "number",
};

function testTypes(json) {
  describe("Types", () => {
    Object.keys(json).forEach((key) => {
      it(key, ({ expect }) => {
        expect(types).toHaveProperty(key);
        const type = types[key];
        if (type === "array") {
          expect(Array.isArray(json[key])).toBe(true);
        } else {
          expect(typeof json[key]).toBe(type);
        }
      });
    });
  });

  describe("Mandatory properties", () => {
    ["version", "items"].forEach((key) => {
      it(key, ({ expect }) => {
        expect(json).toHaveProperty(key);
      });
    });
  });
}

const minieditScript = readFileSync(
  resolve(import.meta.dirname, "../../tests/unit/fixtures/miniedit-script.py"),
  "utf-8",
);
const miniedit = importScript(minieditScript).data;

describe("Export import script", () => {
  [
    { json: tiny, name: "tiny" },
    { json: tinyController, name: "tiny_controller" },
    { json: tinyTC, name: "tiny_tc" },
    { json: tinyPhysicalInterface, name: "tiny_physical_interface" },
    { json: tinyMininetConf, name: "tiny_mininet_conf" },
    { json: medium1Controller, name: "medium_1_controller" },
    { json: medium2Controllers, name: "medium_2_controllers" },
    { json: miniedit, name: "miniedit" },
  ].forEach(({ json: data1, name }) =>
    describe(name, () => {
      const script1 = new Builder(JSON.parse(JSON.stringify(data1))).build();
      const data2 = importScript(script1).data;
      const script2 = new Builder(JSON.parse(JSON.stringify(data2))).build();

      testTypes(data2);

      describe("Items", () => {
        it("port", ({ expect }) => {
          const items1 = getCleanItems(data1.items, "port");
          const items2 = getCleanItems(data2.items, "port");
          expect(items2.length).toBeLessThanOrEqual(items1.length);
          items2.forEach((item) => {
            expect(items1).toContainEqual(item);
          });
        });

        ["controller", "host", "link", "switch"].forEach((type) => {
          it(type, ({ expect }) => {
            const items1 = getCleanItems(data1.items, type);
            const items2 = getCleanItems(data2.items, type);
            expect(items2).toHaveLength(items1.length);
            expect(sortByJson(items2)).toEqual(sortByJson(items1));
          });
        });
      });

      it("script reexport", ({ expect }) => {
        expect(removeNonCode(script2)).toBe(removeNonCode(script1));
      });
    }),
  );
});
