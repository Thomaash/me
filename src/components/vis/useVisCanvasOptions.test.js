import { describe, it } from "vitest";
import { ref } from "vue";
import { useVisCanvasOptions } from "@/components/vis/useVisCanvasOptions";
import { canvasDark, canvasLight, itemsDark, itemsLight } from "@/theme";
import { buildGroupColor } from "@/components/vis/visCanvasUtils";

import controllerImgDark from "@/assets/network/controller.dark.svg";
import controllerImgLight from "@/assets/network/controller.light.svg";
import hostImgDark from "@/assets/network/host.dark.svg";
import hostImgLight from "@/assets/network/host.light.svg";
import portImgDark from "@/assets/network/port.dark.svg";
import portImgLight from "@/assets/network/port.light.svg";
import switchImgDark from "@/assets/network/switch.dark.svg";
import switchImgLight from "@/assets/network/switch.light.svg";

describe.concurrent("useVisCanvasOptions", () => {
  describe("dark=true", () => {
    it("derives node and edge fonts from canvasDark.foreground", ({
      expect,
    }) => {
      const { options } = useVisCanvasOptions(ref(true));
      const opts = options.value;

      expect(opts.nodes.font.color).toBe(canvasDark.foreground);
      expect(opts.edges.font.color).toBe(canvasDark.foreground);
      expect(opts.groups.dummy.font.color).toBe(canvasDark.foreground);
    });

    it("uses dark image assets for image-shaped groups", ({ expect }) => {
      const { options } = useVisCanvasOptions(ref(true));
      const opts = options.value;

      expect(opts.groups.controller.image).toBe(controllerImgDark);
      expect(opts.groups.host.image).toBe(hostImgDark);
      expect(opts.groups.port.image).toBe(portImgDark);
      expect(opts.groups.switch.image).toBe(switchImgDark);
    });

    it("composes group colors from dark item colors and dark canvas background", ({
      expect,
    }) => {
      const { options } = useVisCanvasOptions(ref(true));
      const opts = options.value;

      expect(opts.groups.controller.color).toEqual(
        buildGroupColor(itemsDark.controller, false, canvasDark.background),
      );
      expect(opts.groups.host.color).toEqual(
        buildGroupColor(itemsDark.host, false, canvasDark.background),
      );
      expect(opts.groups.port.color).toEqual(
        buildGroupColor(itemsDark.port, false, canvasDark.background),
      );
      expect(opts.groups.switch.color).toEqual(
        buildGroupColor(itemsDark.switch, false, canvasDark.background),
      );
      expect(opts.groups.dummy.color).toEqual(
        buildGroupColor(itemsDark.dummy, true, canvasDark.background),
      );
    });
  });

  describe("dark=false", () => {
    it("derives node and edge fonts from canvasLight.foreground", ({
      expect,
    }) => {
      const { options } = useVisCanvasOptions(ref(false));
      const opts = options.value;

      expect(opts.nodes.font.color).toBe(canvasLight.foreground);
      expect(opts.edges.font.color).toBe(canvasLight.foreground);
      expect(opts.groups.dummy.font.color).toBe(canvasLight.foreground);
    });

    it("uses light image assets for image-shaped groups", ({ expect }) => {
      const { options } = useVisCanvasOptions(ref(false));
      const opts = options.value;

      expect(opts.groups.controller.image).toBe(controllerImgLight);
      expect(opts.groups.host.image).toBe(hostImgLight);
      expect(opts.groups.port.image).toBe(portImgLight);
      expect(opts.groups.switch.image).toBe(switchImgLight);
    });

    it("composes group colors from light item colors and light canvas background", ({
      expect,
    }) => {
      const { options } = useVisCanvasOptions(ref(false));
      const opts = options.value;

      expect(opts.groups.controller.color).toEqual(
        buildGroupColor(itemsLight.controller, false, canvasLight.background),
      );
      expect(opts.groups.host.color).toEqual(
        buildGroupColor(itemsLight.host, false, canvasLight.background),
      );
      expect(opts.groups.port.color).toEqual(
        buildGroupColor(itemsLight.port, false, canvasLight.background),
      );
      expect(opts.groups.switch.color).toEqual(
        buildGroupColor(itemsLight.switch, false, canvasLight.background),
      );
      expect(opts.groups.dummy.color).toEqual(
        buildGroupColor(itemsLight.dummy, true, canvasLight.background),
      );
    });
  });

  describe("dark vs light comparison", () => {
    it("produces different image references for dark vs light", ({
      expect,
    }) => {
      const { options: darkOptions } = useVisCanvasOptions(ref(true));
      const { options: lightOptions } = useVisCanvasOptions(ref(false));

      expect(darkOptions.value.groups.controller.image).not.toBe(
        lightOptions.value.groups.controller.image,
      );
      expect(darkOptions.value.groups.host.image).not.toBe(
        lightOptions.value.groups.host.image,
      );
      expect(darkOptions.value.groups.port.image).not.toBe(
        lightOptions.value.groups.port.image,
      );
      expect(darkOptions.value.groups.switch.image).not.toBe(
        lightOptions.value.groups.switch.image,
      );
    });

    it("produces different font colors for dark vs light", ({ expect }) => {
      const { options: darkOptions } = useVisCanvasOptions(ref(true));
      const { options: lightOptions } = useVisCanvasOptions(ref(false));

      expect(darkOptions.value.nodes.font.color).not.toBe(
        lightOptions.value.nodes.font.color,
      );
      expect(darkOptions.value.edges.font.color).not.toBe(
        lightOptions.value.edges.font.color,
      );
    });
  });

  describe("reactivity", () => {
    it("updates options reactively when the dark input ref changes", ({
      expect,
    }) => {
      const dark = ref(false);
      const { options } = useVisCanvasOptions(dark);

      expect(options.value.nodes.font.color).toBe(canvasLight.foreground);
      expect(options.value.groups.controller.image).toBe(controllerImgLight);

      dark.value = true;

      expect(options.value.nodes.font.color).toBe(canvasDark.foreground);
      expect(options.value.groups.controller.image).toBe(controllerImgDark);
      expect(options.value.groups.host.image).toBe(hostImgDark);
      expect(options.value.groups.port.image).toBe(portImgDark);
      expect(options.value.groups.switch.image).toBe(switchImgDark);
    });

    it("accepts a getter function as the dark input", ({ expect }) => {
      let isDark = true;
      const { options } = useVisCanvasOptions(() => isDark);

      expect(options.value.nodes.font.color).toBe(canvasDark.foreground);
      expect(options.value.groups.controller.image).toBe(controllerImgDark);
    });
  });
});
