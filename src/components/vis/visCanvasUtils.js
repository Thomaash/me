import generateTooltip from "./generateTooltip";
import { labelPlaceholderRE, labelPlaceholderReplacers } from "./placeholders";
import { themeColorShades } from "@/theme-colors";

export function isEdge(type) {
  return type === "link" || type === "association";
}

export function buildGroupColor({ canvas }, bg = false, themeBackground) {
  const background = bg ? themeBackground : themeColorShades.transparent;
  return {
    background: background,
    border: canvas,
    highlight: {
      background: background,
      border: canvas,
    },
    hover: {
      background: background,
      border: canvas,
    },
  };
}

export function itemToNode(item, processLabelFn) {
  return {
    id: item.id,
    group: item.type,
    x: item.x,
    y: item.y,
    label: item.type === "dummy" ? processLabelFn(item) : item.hostname,
    title: generateTooltip(item),
  };
}

export function itemToEdge(item) {
  return {
    id: item.id,
    from: item.from,
    to: item.to,
    label: item.hostname,
    title: generateTooltip(item),
  };
}

export function processLabel(item, net, dataItems) {
  if (!net) {
    return item.hostname;
  }

  const neighbors = net.getConnectedNodes(item.id).map((id) => dataItems[id]);
  return item.hostname.replace(labelPlaceholderRE, (match) => {
    return (
      labelPlaceholderReplacers[match.toUpperCase()] ||
      labelPlaceholderReplacers.fallback
    )(neighbors, match);
  });
}
