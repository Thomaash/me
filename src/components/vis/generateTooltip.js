import { controllerTypesMap, switchTypesMap } from "@/components/selects";

function fixUnit(str) {
  const res = /^(\d+)(\D*)$/.exec(str);
  return `${res[1]} ${res[2]}`;
}

const generators = {
  $default() {
    return undefined; // No tooltip
  },

  port(item) {
    const lines = [
      ...(item.physical ? ["Physical interface"] : []),
      ...(item.ips || ["No addresses"]),
    ];
    return lines.join("<br/>");
  },
  link(item) {
    const parts = [
      ...(item.bandwidth != null
        ? [`<tr><td>Bandwidth</td><td>${item.bandwidth} MBit/s</td></tr>`]
        : []),
      ...(item.delay != null
        ? [`<tr><td>Delay</td><td>${fixUnit(item.delay)}</td></tr>`]
        : []),
      ...(item.loss != null
        ? [`<tr><td>Loss</td><td>${item.loss} %</td></tr>`]
        : []),
      ...(item.maxQueueSize != null
        ? [`<tr><td>Max Queue</td><td>${item.maxQueueSize} packets</td></tr>`]
        : []),
      ...(item.jitter != null
        ? [`<tr><td>Jitter</td><td>${fixUnit(item.jitter)}</td></tr>`]
        : []),
    ];

    if (parts.length) {
      return ["<table>", ...parts, "</table>"].join("");
    } else {
      return "No limits";
    }
  },
  host(item) {
    if (item.defaultRoute) {
      return `Default Route: ${item.defaultRoute}`;
    } else {
      return "No default route";
    }
  },
  switch(item) {
    return item.switchType != null
      ? `${switchTypesMap[item.switchType] || item.switchType}`
      : "Default";
  },
  controller(item) {
    const parts = [
      ...(item.controllerType != null
        ? [`${controllerTypesMap[item.controllerType] || item.controllerType}`]
        : ["Default"]),
      "<br/>",
      ...(item.ip != null && item.port != null
        ? [
            item.ip.includes(":")
              ? `[${item.ip}]:${item.port}`
              : `${item.ip}:${item.port}`,
          ]
        : []),
      ...(item.ip != null && item.port == null ? [item.ip] : []),
      ...(item.ip == null && item.port != null
        ? [`&lt;No IP&gt;:${item.port}`]
        : []),
    ];

    if (parts.length) {
      return parts.join("");
    } else {
      return "Default";
    }
  },
};

export default function (item) {
  return (generators[item.type] || generators.$default)(item);
}
