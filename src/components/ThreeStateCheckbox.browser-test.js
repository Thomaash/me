import { describe, it, expect } from "vitest";
import { mountWithVuetify } from "../test-utils/browser-setup.js";
import ThreeStateCheckbox from "@/components/ThreeStateCheckbox.vue";

function mountCheckbox(props = {}) {
  return mountWithVuetify(ThreeStateCheckbox, {
    props: {
      label: "Test Label",
      ...props,
    },
  });
}

describe.concurrent("ThreeStateCheckbox", () => {
  it("mounts in Vuetify context and renders a checkbox with provided label", ({ expect }) => {
    const wrapper = mountCheckbox({ label: "My Option" });

    const checkbox = wrapper.findComponent({ name: "VCheckbox" });
    expect(checkbox.exists()).toBe(true);
    expect(checkbox.props("label")).toBe("My Option");
  });

  it.each([
    { modelValue: undefined, expectedTitle: "Default" },
    { modelValue: true, expectedTitle: "Enabled" },
    { modelValue: false, expectedTitle: "Disabled" },
  ])(
    "displays title $expectedTitle when modelValue is $modelValue",
    ({ modelValue, expectedTitle }) => {
      const wrapper = mountCheckbox({ modelValue });

      // title is passed as a prop/attribute to VCheckbox which renders it on the root element
      const el = wrapper.find("[title]");
      expect(el.exists()).toBe(true);
      expect(el.attributes("title")).toBe(expectedTitle);
    },
  );

  it("displays indeterminate state when modelValue is undefined", ({ expect }) => {
    const wrapper = mountCheckbox({ modelValue: undefined });

    const checkbox = wrapper.findComponent({ name: "VCheckbox" });
    expect(checkbox.props("indeterminate")).toBe(true);
  });

  it("emits update:modelValue cycling undefined -> true -> false -> undefined on clicks", async ({ expect }) => {
    const wrapper = mountCheckbox({ modelValue: undefined });

    await wrapper.findComponent({ name: "VCheckbox" }).trigger("click");
    expect(wrapper.emitted("update:modelValue")[0]).toEqual([true]);

    await wrapper.setProps({ modelValue: true });
    await wrapper.findComponent({ name: "VCheckbox" }).trigger("click");
    expect(wrapper.emitted("update:modelValue")[1]).toEqual([false]);

    await wrapper.setProps({ modelValue: false });
    await wrapper.findComponent({ name: "VCheckbox" }).trigger("click");
    expect(wrapper.emitted("update:modelValue")[2]).toEqual([undefined]);
  });
});
