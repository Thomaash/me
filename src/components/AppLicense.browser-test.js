import { describe, it } from "vitest";
import { mountWithVuetify } from "../test-utils/browser-setup.js";
import AppLicense from "@/components/AppLicense.vue";

describe.concurrent("AppLicense", () => {
  it("mounts successfully in Vuetify context", ({ expect }) => {
    const wrapper = mountWithVuetify(AppLicense);

    expect(wrapper.exists()).toBe(true);
  });

  it("renders a section with headline License", ({ expect }) => {
    const wrapper = mountWithVuetify(AppLicense);

    const headline = wrapper.find("h3.headline");
    expect(headline.exists()).toBe(true);
    expect(headline.text()).toBe("License");
  });

  it("renders license text paragraphs split by double newlines", ({
    expect,
  }) => {
    const wrapper = mountWithVuetify(AppLicense);

    const paragraphs = wrapper.findAll("section > p");
    expect(paragraphs.length).toBeGreaterThanOrEqual(1);

    const fullText = paragraphs.map((p) => p.text()).join(" ");
    expect(fullText).toContain("ISC License");
  });

  it("has at least one paragraph element present", ({ expect }) => {
    const wrapper = mountWithVuetify(AppLicense);

    const paragraphs = wrapper.findAll("p");
    expect(paragraphs.length).toBeGreaterThanOrEqual(1);
  });
});
