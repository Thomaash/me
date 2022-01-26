import { expect } from "chai";

function getCleanItems(items, typeOnly) {
  return items
    .filter((node) => !typeOnly || node.type === typeOnly)
    .map((orig) => {
      const type = orig.type;
      const isEdge = type === "link" || type === "association";

      const clean = {};
      Object.keys(orig).forEach((key) => {
        if (type === "port" && key === "ips") {
          clean[key] = orig[key].sort();
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
export { getCleanItems };

function removeNonCode(script) {
  return script
    .split("\n")
    .filter((line) => !/^($|#)/.test(line))
    .join("\n");
}
export { removeNonCode };

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
export { types };

function testTypes(json) {
  describe("Types", () => {
    Object.keys(json).forEach((key) => {
      it(key, () => {
        expect(types, `Unknown property ${key}.`).to.have.own.property(key);
        const type = types[key];
        expect(json[key], `Property ${key} is not a ${type}.`).to.be.a(type);
      });
    });
  });

  describe("Mandatory properties", () => {
    ["version", "items"].forEach((key) => {
      it(key, () => {
        expect(json, "Missing property.").to.have.own.property(key);
      });
    });
  });
}
export { testTypes };
