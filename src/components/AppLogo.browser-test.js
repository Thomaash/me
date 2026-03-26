import { describe, it } from "vitest";
import { mountWithVuetify } from "../test-utils/browser-setup.js";
import AppLogo from "@/components/AppLogo.vue";

describe.concurrent("AppLogo", () => {
  it("mounts successfully in Vuetify context", ({ expect }) => {
    const wrapper = mountWithVuetify(AppLogo);

    expect(wrapper.exists()).toBe(true);
  });

  it("renders an img element with alt text 'Mininet Editor logo'", ({ expect }) => {
    const wrapper = mountWithVuetify(AppLogo);

    const img = wrapper.find("img");
    expect(img.exists()).toBe(true);
    expect(img.attributes("alt")).toBe("Mininet Editor logo");
  });

  it("has img src attribute referencing the icon.svg asset", ({ expect }) => {
    const wrapper = mountWithVuetify(AppLogo);

    const img = wrapper.find("img");
    const src = img.attributes("src");
    const referencesIconSvg =
      src.includes("icon.svg") || src.startsWith("data:image/svg+xml");
    expect(referencesIconSvg).toBe(true);
  });

  it("renders inside a v-card with class circle", ({ expect }) => {
    const wrapper = mountWithVuetify(AppLogo);

    const card = wrapper.findComponent({ name: "VCard" });
    expect(card.exists()).toBe(true);
    expect(card.classes()).toContain("circle");
  });
});
