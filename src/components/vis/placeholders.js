import { compare, compareItems } from "./locale";
import { controllerTypesMap, switchTypesMap } from "@/components/selects";

function buildOutputString(items, left, right) {
  if (items.length === 0) {
    return "nothing is connected";
  } else if (items.length === 1) {
    return items[0][right].join("\n");
  } else {
    const indent =
      items.reduce((acc, item) => Math.max(item[left].length, acc), 0) + 2;
    const sepparator =
      items.reduce((acc, item) => Math.max(item[right].length, acc), 0) > 1
        ? "\n\n"
        : "\n";
    return items
      .map(
        (item) =>
          `${(item[left] + ":").padEnd(indent, " ")}${item[right].join(
            "\n".padEnd(indent + 1, " ")
          )}`
      )
      .join(sepparator);
  }
}

export default {
  re: /{{[^{}]*}}/g,
  replace: {
    "{{HOSTNAMES}}"(neighbors) {
      return neighbors
        .filter((item) => /^(port|host|switch|controller)$/.test(item.type))
        .map((item) => item.hostname)
        .sort(compare)
        .join(", ");
    },
    "{{IPS}}"(neighbors) {
      const items = neighbors
        .map((item) => {
          if (item.type === "port") {
            return {
              hostname: item.hostname,
              ips: item.ips ? item.ips : ["no addresses"],
            };
          } else if (item.type === "controller") {
            return {
              hostname: item.hostname,
              ips: [
                `${item.ip || "<default IP>"}:${item.port || "<default port>"}`,
              ],
            };
          } else if (item.type === "host") {
            return {
              hostname: item.hostname,
              ips: [item.defaultRoute || "no default route"],
            };
          } else if (item.type === "switch") {
            return {
              hostname: item.hostname,
              ips: [item.ip || "no address"],
            };
          } else {
            return null;
          }
        })
        .filter((item) => item != null)
        .sort(compareItems);

      return buildOutputString(items, "hostname", "ips");
    },
    "{{TYPES}}"(neighbors) {
      const items = neighbors
        .map((item) => {
          if (item.type === "controller") {
            return {
              hostname: item.hostname,
              types: item.controllerType
                ? [
                    controllerTypesMap[item.controllerType] ||
                      item.controllerType,
                  ]
                : ["default type"],
            };
          } else if (item.type === "switch") {
            return {
              hostname: item.hostname,
              types: item.switchType
                ? [switchTypesMap[item.switchType] || item.switchType]
                : ["default type"],
            };
          } else {
            return null;
          }
        })
        .filter((item) => item != null)
        .sort(compareItems);

      return buildOutputString(items, "hostname", "types");
    },
    fallback(neighbors, match) {
      return `unknown placeholder: ${match}`;
    },
  },
};
