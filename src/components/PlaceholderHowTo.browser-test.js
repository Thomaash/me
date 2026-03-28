import { describe, it } from "vitest";
import { mountWithVuetify } from "../test-utils/browser-setup.js";
import PlaceholderHowTo from "@/components/PlaceholderHowTo.vue";

describe.concurrent("PlaceholderHowTo", () => {
  it("mounts in Vuetify context and renders section with headline Placeholders", ({
    expect,
  }) => {
    const wrapper = mountWithVuetify(PlaceholderHowTo);

    expect(wrapper.exists()).toBe(true);
    const headline = wrapper.find("h3.text-h6");
    expect(headline.exists()).toBe(true);
    expect(headline.text()).toBe("Placeholders");
  });

  it("renders a v-data-table component", ({ expect }) => {
    const wrapper = mountWithVuetify(PlaceholderHowTo);

    const dataTable = wrapper.findComponent({ name: "VDataTable" });
    expect(dataTable.exists()).toBe(true);
  });

  it("contains items for HOSTNAMES, IPS, and TYPES placeholders", ({
    expect,
  }) => {
    const wrapper = mountWithVuetify(PlaceholderHowTo);

    const text = wrapper.text();
    expect(text).toContain("{{HOSTNAMES}}");
    expect(text).toContain("{{IPS}}");
    expect(text).toContain("{{TYPES}}");
  });
});
