import { compare } from "./locale";

export const portAmounts = {
  host: 2,
  switch: 6,
};

export const nodePriorities = ["dummy", "controller", "switch", "host", "port"];

export const edgeTests = {
  link: (src, dst) => src === "port" && dst === "port",
  association: (src, dst) =>
    (src === "controller" && dst === "switch") ||
    (src === "switch" && dst === "port") ||
    (src === "host" && dst === "port") ||
    src === "dummy",
};

export const baseHostnames = {
  controller: "c1",
  host: "h1",
  port: "eth0",
  switch: "s1",
};

/**
 * Reorder edge.from/to in place so that the higher-priority node type is the
 * destination.
 * @param {{ from: string, to: string }} edge - mutated in place
 * @param {Record<string, { type: string }>} items
 */
export function orderNodes(edge, items) {
  const src = items[edge.from].type;
  const dst = items[edge.to].type;
  if (nodePriorities.indexOf(src) > nodePriorities.indexOf(dst)) {
    const tmp = edge.from;
    edge.from = edge.to;
    edge.to = tmp;
  }
}

/**
 * Determine the type of an edge ("link" / "association"), preferring an
 * existing item's type if one is registered.
 * @param {{ id?: string, from: string, to: string }} edge
 * @param {Record<string, { type: string }>} items
 * @returns {string}
 */
export function getEdgeType(edge, items) {
  const item = items[edge.id];
  if (item && item.type) {
    return item.type;
  }

  const src = items[edge.from].type;
  const dst = items[edge.to].type;
  if (src === "port" && dst === "port") {
    return "link";
  } else {
    return "association";
  }
}

/**
 * Validate an edge against the rules for the given edge type.
 * @param {{ from: string, to: string }} edge
 * @param {string} type - "link" or "association"
 * @param {Record<string, { type: string }>} items
 * @returns {boolean}
 */
export function isEdgeValid(edge, type, items) {
  const src = items[edge.from].type;
  const dst = items[edge.to].type;
  return edgeTests[type](src, dst);
}

/**
 * Generate organized port coordinates around a parent node centered at
 * (x, y).
 * @param {{ x: number, y: number }} center
 * @param {number} ports - number of ports
 * @returns {Array<{ x: number, y: number }>}
 */
export function generateOrganizedPortCoors({ x, y }, ports) {
  const xOffset = ports <= 8 ? 50 : 30;
  const yEvenOffset = ports <= 8 ? 0 : 25;
  const portY = y + 70;
  const firstX = x - ((ports - 1) * xOffset) / 2;

  return [...Array(ports)].map((_v, i) => ({
    x: firstX + xOffset * i,
    y: portY + (i % 2 === 0 ? yEvenOffset : 0),
  }));
}

/**
 * Compute the next hostname based on the highest existing one.
 * @param {string[]} hostnames
 * @param {string} fallback
 * @returns {string}
 */
export function getNextHostname(hostnames, fallback) {
  if (!hostnames.length) {
    return fallback;
  }

  const prevHostname = hostnames.toSorted(compare)[hostnames.length - 1];
  const res = /^(.*?)(\d+)([^\d]*?)$/.exec(prevHostname);
  if (res == null) {
    return fallback;
  }

  const [, pre, nm, post] = res;
  const nextLabel = `${pre}${+nm + 1}${post}`;
  return nextLabel;
}
