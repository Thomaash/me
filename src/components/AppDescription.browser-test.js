import { describe, it } from "vitest";
import { mountWithVuetify } from "../test-utils/browser-setup.js";
import AppDescription from "@/components/AppDescription.vue";

describe.concurrent("AppDescription", () => {
  it("mounts successfully in Vuetify context", ({ expect }) => {
    const wrapper = mountWithVuetify(AppDescription);

    expect(wrapper.exists()).toBe(true);
  });

  it("renders a section with headline Description", ({ expect }) => {
    const wrapper = mountWithVuetify(AppDescription);

    const headline = wrapper.find("h3.headline");
    expect(headline.exists()).toBe(true);
    expect(headline.text()).toBe("Description");
  });

  it("renders description text mentioning SDN topology editor", ({ expect }) => {
    const wrapper = mountWithVuetify(AppDescription);

    expect(wrapper.text()).toContain("SDN topology editor");
  });

  it("does not render Repository and New Issue buttons when full is false", ({ expect }) => {
    const wrapper = mountWithVuetify(AppDescription);

    const buttons = wrapper.findAllComponents({ name: "VBtn" });
    expect(buttons).toHaveLength(0);
  });

  it("renders Repository and New Issue buttons when full is true", ({ expect }) => {
    const wrapper = mountWithVuetify(AppDescription, {
      props: { full: true },
    });

    const buttons = wrapper.findAllComponents({ name: "VBtn" });
    expect(buttons).toHaveLength(2);

    const buttonTexts = buttons.map((btn) => btn.text());
    expect(buttonTexts).toContain("Repository");
    expect(buttonTexts).toContain("New Issue");
  });
});
