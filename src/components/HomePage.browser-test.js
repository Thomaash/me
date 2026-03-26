import { describe, it } from "vitest";
import { mountWithVuetify } from "../test-utils/browser-setup.js";
import HomePage from "@/components/HomePage.vue";

describe.concurrent("HomePage", () => {
  it("mounts successfully in Vuetify context", ({ expect }) => {
    const wrapper = mountWithVuetify(HomePage);

    expect(wrapper.exists()).toBe(true);
  });

  it("renders AppLogo, AppDescription, BindingsList, and PlaceholderHowTo child components", ({ expect }) => {
    const wrapper = mountWithVuetify(HomePage);

    const appLogo = wrapper.findComponent({ name: "AppLogo" });
    expect(appLogo.exists()).toBe(true);

    const appDescription = wrapper.findComponent({ name: "AppDescription" });
    expect(appDescription.exists()).toBe(true);

    const bindingsList = wrapper.findComponent({ name: "BindingsList" });
    expect(bindingsList.exists()).toBe(true);

    const placeholderHowTo = wrapper.findComponent({ name: "PlaceholderHowTo" });
    expect(placeholderHowTo.exists()).toBe(true);
  });

  it("has all four child component sections visible", ({ expect }) => {
    const wrapper = mountWithVuetify(HomePage);

    const appLogo = wrapper.findComponent({ name: "AppLogo" });
    expect(appLogo.isVisible()).toBe(true);

    const appDescription = wrapper.findComponent({ name: "AppDescription" });
    expect(appDescription.isVisible()).toBe(true);

    const bindingsList = wrapper.findComponent({ name: "BindingsList" });
    expect(bindingsList.isVisible()).toBe(true);

    const placeholderHowTo = wrapper.findComponent({ name: "PlaceholderHowTo" });
    expect(placeholderHowTo.isVisible()).toBe(true);
  });
});
