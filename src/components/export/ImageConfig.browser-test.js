import { describe, it } from "vitest";
import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import { createStore } from "vuex";
import ImageConfig from "@/components/export/ImageConfig.vue";

function createMockStore({ width = 100, height = 100 } = {}) {
  return createStore({
    state() {
      return {
        loading: false,
        working: false,
        isUpdateAvailable: false,
        alert: { show: false },
      };
    },
    mutations: {
      setWorking() {},
      setAlert() {},
      clearAlert() {},
    },
    modules: {
      topology: {
        namespaced: true,
        state() {
          return {
            data: { items: {} },
            past: [],
            future: [],
            boundingBoxOverride: { width, height },
          };
        },
        getters: {
          data: (s) => s.data,
          canUndo: (s) => s.past.length,
          canRedo: (s) => s.future.length,
          boundingBox: (s) => () => ({
            sX: 0,
            eX: s.boundingBoxOverride.width,
            sY: 0,
            eY: s.boundingBoxOverride.height,
            width: s.boundingBoxOverride.width,
            height: s.boundingBoxOverride.height,
            empty: false,
          }),
        },
        mutations: {
          importData() {},
          setValues() {},
          applyChange() {},
          setBoundingBox(s, val) {
            s.boundingBoxOverride = val;
          },
        },
        actions: {
          updateItems() {},
        },
      },
    },
  });
}

function mountImageConfig({ working = false, width = 100, height = 100 } = {}) {
  const vuetify = createVuetify();
  const store = createMockStore({ width, height });
  return mount(ImageConfig, {
    props: { working },
    global: {
      plugins: [vuetify, store],
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
    const wrapper = mountImageConfig({ width: 200, height: 100 });

    // Trigger recompute via the Width field's update:modelValue event
    setFieldValue(wrapper, "Width", 400);
    await nextTick();

    // Verify via field values: Width should be 400, Height should scale proportionally
    const widthField = findTextFieldByLabel(wrapper, "Width");
    expect(widthField.props("modelValue")).toBe(400);

    const heightField = findTextFieldByLabel(wrapper, "Height");
    // scale=400/200=2, heightPx=ceil(2*100)=200
    expect(heightField.props("modelValue")).toBe(200);

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

    // Set width to 200 via field interaction
    setFieldValue(wrapper, "Width", 200);
    await nextTick();

    const renderButton = findRenderButton(wrapper);
    await renderButton.trigger("click");

    const emitted = wrapper.emitted("render");
    expect(emitted).toBeDefined();
    expect(emitted).toHaveLength(1);
    expect(emitted[0][0]).toEqual({
      size: {
        width: 200,
        height: 200,
        scale: 2,
      },
      tiles: false,
      dark: false,
    });
  });

  it("disables all controls when boundingBox width is zero", ({ expect }) => {
    const wrapper = mountImageConfig({ width: 0, height: 100 });

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
    const store = createMockStore({ width: 100, height: 100 });
    const wrapper = mount(ImageConfig, {
      props: { working: false },
      global: {
        plugins: [vuetify, store],
      },
    });
    await nextTick();

    // Verify initial field values via VTextField modelValue props
    const getWidthPxField = () => findTextFieldByLabel(wrapper, "Width");
    const getHeightPxField = () => findTextFieldByLabel(wrapper, "Height");
    expect(getWidthPxField().props("modelValue")).toBe(100);
    expect(getHeightPxField().props("modelValue")).toBe(100);

    store.commit("topology/setBoundingBox", { width: 200, height: 200 });
    await nextTick();
    await nextTick();

    // Verify updated field values after bounding box change
    expect(getWidthPxField().props("modelValue")).toBe(200);
    expect(getHeightPxField().props("modelValue")).toBe(200);
  });
});
