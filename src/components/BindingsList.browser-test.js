import { describe, it, vi } from "vitest";
import { mountWithVuetify } from "../test-utils/browser-setup.js";
import BindingsList from "@/components/BindingsList.vue";

describe.concurrent("BindingsList", () => {
  it("mounts in Vuetify context and renders section with headline Bindings", ({ expect }) => {
    const wrapper = mountWithVuetify(BindingsList);

    expect(wrapper.exists()).toBe(true);
    const headline = wrapper.find("h3.headline");
    expect(headline.exists()).toBe(true);
    expect(headline.text()).toBe("Bindings");
  });

  it("renders a v-data-table component", ({ expect }) => {
    const wrapper = mountWithVuetify(BindingsList);

    const dataTable = wrapper.findComponent({ name: "VDataTable" });
    expect(dataTable.exists()).toBe(true);
  });

  it("contains keyboard binding entries with descriptions", ({ expect }) => {
    const wrapper = mountWithVuetify(BindingsList);

    const text = wrapper.text();
    expect(text).toContain("Place a new node.");
    expect(text).toContain("Select all.");
    expect(text).toContain("Undo a change.");
    expect(text).toContain("Delete selected items.");
  });

  it("renders entries with both combination keys and description text", ({ expect }) => {
    const wrapper = mountWithVuetify(BindingsList);

    const text = wrapper.text();
    // Verify key combinations are rendered (kbd elements)
    expect(text).toContain("LMB");
    expect(text).toContain("CTRL");
    expect(text).toContain("DEL");
    expect(text).toContain("ESC");
    // Verify corresponding descriptions
    expect(text).toContain("Move the viewport.");
    expect(text).toContain("Stop editing edges or adding items.");
  });
});
