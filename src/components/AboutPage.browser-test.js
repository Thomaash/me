import { describe, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import { createStore } from "vuex";
import AboutPage from "@/components/AboutPage.vue";

function createMockStore(isUpdateAvailable = false) {
  return createStore({
    state() {
      return { isUpdateAvailable };
    },
  });
}

function mountAboutPage(isUpdateAvailable = false) {
  const vuetify = createVuetify();
  const store = createMockStore(isUpdateAvailable);
  return mount(AboutPage, {
    global: {
      plugins: [vuetify, store],
    },
  });
}

describe.concurrent("AboutPage", () => {
  it("mounts successfully in Vuetify context with mock Vuex store", ({
    expect,
  }) => {
    const wrapper = mountAboutPage();

    expect(wrapper.exists()).toBe(true);
  });

  it("renders AppLogo, AppDescription, AppLicense, and BuildInfo child components", ({
    expect,
  }) => {
    const wrapper = mountAboutPage();

    const appLogo = wrapper.findComponent({ name: "AppLogo" });
    expect(appLogo.exists()).toBe(true);

    const appDescription = wrapper.findComponent({ name: "AppDescription" });
    expect(appDescription.exists()).toBe(true);

    const appLicense = wrapper.findComponent({ name: "AppLicense" });
    expect(appLicense.exists()).toBe(true);

    const buildInfo = wrapper.findComponent({ name: "BuildInfo" });
    expect(buildInfo.exists()).toBe(true);
  });

  it("passes the full prop to AppDescription", ({ expect }) => {
    const wrapper = mountAboutPage();

    const appDescription = wrapper.findComponent({ name: "AppDescription" });
    expect(appDescription.props("full")).toBe(true);
  });

  it("has all four child component sections visible", ({ expect }) => {
    const wrapper = mountAboutPage();

    const appLogo = wrapper.findComponent({ name: "AppLogo" });
    expect(appLogo.isVisible()).toBe(true);

    const appDescription = wrapper.findComponent({ name: "AppDescription" });
    expect(appDescription.isVisible()).toBe(true);

    const appLicense = wrapper.findComponent({ name: "AppLicense" });
    expect(appLicense.isVisible()).toBe(true);

    const buildInfo = wrapper.findComponent({ name: "BuildInfo" });
    expect(buildInfo.isVisible()).toBe(true);
  });
});
