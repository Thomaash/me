import { computed, toValue } from "vue";
import { canvasDark, canvasLight, itemsDark, itemsLight } from "@/theme";
import { buildGroupColor } from "./visCanvasUtils";

import controllerImgDark from "@/assets/network/controller.dark.svg";
import controllerImgLight from "@/assets/network/controller.light.svg";
import hostImgDark from "@/assets/network/host.dark.svg";
import hostImgLight from "@/assets/network/host.light.svg";
import portImgDark from "@/assets/network/port.dark.svg";
import portImgLight from "@/assets/network/port.light.svg";
import switchImgDark from "@/assets/network/switch.dark.svg";
import switchImgLight from "@/assets/network/switch.light.svg";

/**
 * Derive reactive vis-network options for VisCanvas from a dark-mode input.
 *
 * Public contract: `dark` in, `options` out.
 *
 * @param {import("vue").MaybeRefOrGetter<boolean>} dark - Dark-mode state.
 * @returns {{ options: import("vue").ComputedRef<object>, theme: import("vue").ComputedRef<object> }}
 *   `options` is the public output. `theme` is internal staging state exposed
 *   only for transitional test access; it will be removed in a follow-up slice
 *   once tests no longer depend on it.
 */
export function useVisCanvasOptions(dark) {
  const theme = computed(() => {
    const isDark = toValue(dark);
    return {
      images: {
        controller: isDark ? controllerImgDark : controllerImgLight,
        host: isDark ? hostImgDark : hostImgLight,
        port: isDark ? portImgDark : portImgLight,
        switch: isDark ? switchImgDark : switchImgLight,
      },
      items: {
        controller: isDark ? itemsDark.controller : itemsLight.controller,
        dummy: isDark ? itemsDark.dummy : itemsLight.dummy,
        host: isDark ? itemsDark.host : itemsLight.host,
        port: isDark ? itemsDark.port : itemsLight.port,
        switch: isDark ? itemsDark.switch : itemsLight.switch,
      },
      foreground: isDark ? canvasDark.foreground : canvasLight.foreground,
      background: isDark ? canvasDark.background : canvasLight.background,
    };
  });

  const options = computed(() => ({
    physics: {
      enabled: false,
    },
    nodes: {
      // Invisible border, 0 makes selected border disappear
      borderWidth: 0.0001,
      borderWidthSelected: 2,
      font: {
        align: "center",
        color: theme.value.foreground,
        face: "Source Sans 3",
        strokeWidth: 0,
      },
      shapeProperties: {
        borderRadius: 6,
        useBorderWithImage: true,
      },
      scaling: {
        label: {
          // Don't hide labels while zooming in too much (useful for image export)
          maxVisible: Number.MAX_SAFE_INTEGER,
        },
      },
    },
    edges: {
      smooth: false,
      font: {
        align: "top",
        color: theme.value.foreground,
        face: "Source Sans 3",
        strokeWidth: 0,
      },
    },
    interaction: {
      hover: true,
      navigationButtons: false,
      keyboard: false,
    },
    manipulation: {
      enabled: false,
    },
    groups: {
      controller: {
        shape: "image",
        color: buildGroupColor(
          theme.value.items.controller,
          false,
          theme.value.background,
        ),
        size: 25,
        image: theme.value.images.controller,
      },
      dummy: {
        shape: "box",
        color: buildGroupColor(
          theme.value.items.dummy,
          true,
          theme.value.background,
        ),
        font: {
          color: theme.value.foreground,
          face: "Source Code Pro",
          align: "left",
        },
        borderWidth: 1,
      },
      host: {
        shape: "image",
        color: buildGroupColor(
          theme.value.items.host,
          false,
          theme.value.background,
        ),
        size: 25,
        image: theme.value.images.host,
      },
      port: {
        shape: "image",
        color: buildGroupColor(
          theme.value.items.port,
          false,
          theme.value.background,
        ),
        size: 10,
        image: theme.value.images.port,
      },
      switch: {
        shape: "image",
        color: buildGroupColor(
          theme.value.items.switch,
          false,
          theme.value.background,
        ),
        size: 25,
        image: theme.value.images.switch,
      },
    },
  }));

  return { options, theme };
}
