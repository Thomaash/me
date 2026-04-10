import { describe, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import { createPinia } from "pinia";
import AboutPage from "@/components/AboutPage.vue";

function createTestPinia(overrides = {}) {
  const pinia = createPinia();
  pinia.state.value.app = {
    loading: false,
    working: false,
    isUpdateAvailable: false,
    alert: { show: false },
    ...overrides.app,
  };
  pinia.state.value.topology = {
    data: { items: {}, projectName: "Test", startScript: "" },
    past: [],
    future: [],
    ...overrides.topology,
  };
  return pinia;
}

function mountAboutPage(isUpdateAvailable = false) {
  const vuetify = createVuetify();
  const pinia = createTestPinia({ app: { isUpdateAvailable } });
  return mount(AboutPage, {
    global: {
      plugins: [vuetify, pinia],
    },
  });
}

describe.concurrent("AboutPage", () => {
  it("mounts successfully in Vuetify context with mock Pinia store", ({
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
