import { describe, it } from "vitest";
import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import { createPinia } from "pinia";
import ImageConfig from "@/components/export/ImageConfig.vue";
import { useTopologyStore } from "@/store/topologyStore";

/**
 * Creates a Pinia instance with topology items placed to produce a specific
 * bounding box. The real getter adds margin=100 per side (default), so:
 *   width  = (maxX - minX) + 200
 *   height = (maxY - minY) + 200
 * For width/height <= 200 a single item at (0,0) yields 200x200.
 * For width=0 (empty), no items are created.
 */
function createTestPinia({ width = 200, height = 200 } = {}) {
  const pinia = createPinia();
  pinia.state.value.app = {
    loading: false,
    working: false,
    isUpdateAvailable: false,
    alert: { show: false },
  };
  const items = {};
  if (width > 0 || height > 0) {
    const spanX = Math.max(0, width - 200);
    const spanY = Math.max(0, height - 200);
    items["bounding-box-1"] = {
      id: "bounding-box-1",
      type: "host",
      hostname: "bounding-box-1",
      x: 0,
      y: 0,
    };
    if (spanX > 0 || spanY > 0) {
      items["bounding-box-2"] = {
        id: "bounding-box-2",
        type: "host",
        hostname: "bounding-box-2",
        x: spanX,
        y: spanY,
      };
    }
  }
  pinia.state.value.topology = {
    data: { items, projectName: "Test", startScript: "" },
    past: [],
    future: [],
  };
  return pinia;
}

function mountImageConfig({ working = false, width = 200, height = 200 } = {}) {
  const vuetify = createVuetify();
  const pinia = createTestPinia({ width, height });
  return mount(ImageConfig, {
    props: { working },
    global: {
      plugins: [vuetify, pinia],
    },
  });
}

function findTextFieldByLabel(wrapper, label) {
  const textFields = wrapper.findAllComponents({ name: "VTextField" });
  return textFields.find((tf) => tf.props("label") === label);
}

function findSwitchByLabel(wrapper, label) {
  const switches = wrapper.findAllComponents({ name: "VSwitch" });
  return switches.find((sw) => sw.props("label") === label);
}

function findRenderButton(wrapper) {
  const buttons = wrapper.findAllComponents({ name: "VBtn" });
  return buttons.find((btn) => btn.text() === "Render image");
}

function setFieldValue(wrapper, label, value) {
  const field = findTextFieldByLabel(wrapper, label);
  field.vm.$emit("update:modelValue", value);
}

describe.concurrent("ImageConfig", () => {
  it("mounts successfully in Vuetify context with mock store providing topology boundingBox getter", ({
    expect,
  }) => {
    const wrapper = mountImageConfig();

    expect(wrapper.exists()).toBe(true);
  });

  it("renders width and height input fields and Render image button", ({
    expect,
  }) => {
    const wrapper = mountImageConfig();

    const textFields = wrapper.findAllComponents({ name: "VTextField" });
    const labels = textFields.map((tf) => tf.props("label"));

    expect(labels).toContain("Width");
    expect(labels).toContain("Height");

    const renderButton = findRenderButton(wrapper);
    expect(renderButton).toBeDefined();
  });

  it("disables the Render image button when working prop is true", ({
    expect,
  }) => {
    const wrapper = mountImageConfig({ working: true });

    const renderButton = findRenderButton(wrapper);
    expect(renderButton).toBeDefined();
    expect(renderButton.attributes("disabled")).toBeDefined();
  });

  it("recomputes all size fields proportionally when a single dimension changes on non-square bounding box", async ({
    expect,
  }) => {
    // width=400, height=200: items at (0,0) and (200,0) => spanX=200, spanY=0
    // After margin: width=(200+200)=400, height=(0+200)=200
    const wrapper = mountImageConfig({ width: 400, height: 200 });

    // Trigger recompute via the Width field's update:modelValue event
    setFieldValue(wrapper, "Width", 800);
    await nextTick();

    // Verify via field values: Width should be 800, Height should scale proportionally
    const widthField = findTextFieldByLabel(wrapper, "Width");
    expect(widthField.props("modelValue")).toBe(800);

    const heightField = findTextFieldByLabel(wrapper, "Height");
    // scale=800/400=2, heightPx=ceil(2*200)=400
    expect(heightField.props("modelValue")).toBe(400);

    // Verify other size fields are positive by checking their VTextField values
    const widthScreenField = findTextFieldByLabel(wrapper, "Width on screen");
    expect(widthScreenField.props("modelValue")).toBeGreaterThan(0);

    const heightScreenField = findTextFieldByLabel(wrapper, "Height on screen");
    expect(heightScreenField.props("modelValue")).toBeGreaterThan(0);

    const widthPaperField = findTextFieldByLabel(wrapper, "Width on paper");
    expect(widthPaperField.props("modelValue")).toBeGreaterThan(0);

    const heightPaperField = findTextFieldByLabel(wrapper, "Height on paper");
    expect(heightPaperField.props("modelValue")).toBeGreaterThan(0);

    // Verify scale via render event payload
    const renderButton = findRenderButton(wrapper);
    await renderButton.trigger("click");
    const emitted = wrapper.emitted("render");
    expect(emitted[0][0].size.scale).toBeCloseTo(2, 5);
  });

  it("emits render event with size, tiles, and dark configuration when Render image button is clicked", async ({
    expect,
  }) => {
    const wrapper = mountImageConfig();

    // Set width to 400 via field interaction (default bounding box is 200x200)
    setFieldValue(wrapper, "Width", 400);
    await nextTick();

    const renderButton = findRenderButton(wrapper);
    await renderButton.trigger("click");

    const emitted = wrapper.emitted("render");
    expect(emitted).toBeDefined();
    expect(emitted).toHaveLength(1);
    expect(emitted[0][0]).toEqual({
      size: {
        width: 400,
        height: 400,
        scale: 2,
      },
      tiles: false,
      dark: false,
    });
  });

  it("disables all controls when boundingBox width is zero", ({ expect }) => {
    const wrapper = mountImageConfig({ width: 0, height: 0 });

    // Assert disabled state via Render button disabled attribute
    const renderButton = findRenderButton(wrapper);
    expect(renderButton.attributes("disabled")).toBeDefined();

    // Also verify Width field is disabled
    const widthField = findTextFieldByLabel(wrapper, "Width");
    expect(widthField.props("disabled")).toBe(true);
  });

  it("computes tile counts based on image size and tile dimensions", async ({
    expect,
  }) => {
    const wrapper = mountImageConfig();

    // Set width to 500 via field interaction
    setFieldValue(wrapper, "Width", 500);
    await nextTick();

    // Enable tiles via the switch
    const tilesSwitch = findSwitchByLabel(wrapper, "Render as tiles");
    // VSwitch toggle: emit update:modelValue with true
    tilesSwitch.vm.$emit("update:modelValue", true);
    await nextTick();

    // Set tile dimensions via field interactions
    const tileWidthField = findTextFieldByLabel(
      wrapper,
      "The width of each tile",
    );
    tileWidthField.vm.$emit("update:modelValue", 256);
    await nextTick();

    const tileHeightField = findTextFieldByLabel(
      wrapper,
      "The height of each tile",
    );
    tileHeightField.vm.$emit("update:modelValue", 256);
    await nextTick();

    // Verify tile counts via the readonly "The number of tiles" field display value
    const tileCountField = findTextFieldByLabel(wrapper, "The number of tiles");
    const heightField = findTextFieldByLabel(wrapper, "Height");
    const heightPx = heightField.props("modelValue");

    const expectedWidthTiles = Math.max(1, Math.ceil(500 / 256));
    const expectedHeightTiles = Math.max(1, Math.ceil(heightPx / 256));
    expect(tileCountField.props("modelValue")).toBe(
      `${expectedWidthTiles}x${expectedHeightTiles} (${expectedWidthTiles * expectedHeightTiles})`,
    );
  });

  it("emits render event with tile configuration when tiles mode is enabled", async ({
    expect,
  }) => {
    const wrapper = mountImageConfig();

    // Set width to 200 via field interaction
    setFieldValue(wrapper, "Width", 200);
    await nextTick();

    // Enable tiles
    const tilesSwitch = findSwitchByLabel(wrapper, "Render as tiles");
    tilesSwitch.vm.$emit("update:modelValue", true);
    await nextTick();

    // Set tile dimensions
    const tileWidthField = findTextFieldByLabel(
      wrapper,
      "The width of each tile",
    );
    tileWidthField.vm.$emit("update:modelValue", 128);
    await nextTick();

    const tileHeightField = findTextFieldByLabel(
      wrapper,
      "The height of each tile",
    );
    tileHeightField.vm.$emit("update:modelValue", 64);
    await nextTick();

    // Click Render image button instead of calling render() directly
    const renderButton = findRenderButton(wrapper);
    await renderButton.trigger("click");

    const emitted = wrapper.emitted("render");
    expect(emitted).toBeDefined();
    expect(emitted[0][0].tiles).toEqual({ width: 128, height: 64 });
  });
});

describe("ImageConfig watcher", () => {
  it("recomputes all size fields when boundingBox dimensions change via watcher", async ({
    expect,
  }) => {
    const vuetify = createVuetify();
    const pinia = createTestPinia({ width: 200, height: 200 });
    const topologyStore = useTopologyStore(pinia);
    const wrapper = mount(ImageConfig, {
      props: { working: false },
      global: {
        plugins: [vuetify, pinia],
      },
    });
    await nextTick();

    // Verify initial field values via VTextField modelValue props
    const getWidthPxField = () => findTextFieldByLabel(wrapper, "Width");
    const getHeightPxField = () => findTextFieldByLabel(wrapper, "Height");
    expect(getWidthPxField().props("modelValue")).toBe(200);
    expect(getHeightPxField().props("modelValue")).toBe(200);

    // Change the bounding box by updating item positions
    // Adding a second item further away increases the bounding box
    topologyStore.data.items["bounding-box-3"] = {
      id: "bounding-box-3",
      type: "host",
      hostname: "bounding-box-3",
      x: 200,
      y: 200,
    };
    await nextTick();
    await nextTick();

    // Verify updated field values after bounding box change
    // New span: 0 to 200, with margin 100 each side = 400
    expect(getWidthPxField().props("modelValue")).toBe(400);
    expect(getHeightPxField().props("modelValue")).toBe(400);
  });
});
