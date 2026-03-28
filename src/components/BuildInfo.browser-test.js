import { describe, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import { createStore } from "vuex";
import BuildInfo from "@/components/BuildInfo.vue";

function createMockStore(isUpdateAvailable = false) {
  return createStore({
    state() {
      return { isUpdateAvailable };
    },
  });
}

function mountBuildInfo(isUpdateAvailable = false) {
  const vuetify = createVuetify();
  const store = createMockStore(isUpdateAvailable);
  return mount(BuildInfo, {
    global: {
      plugins: [vuetify, store],
    },
  });
}

describe.concurrent("BuildInfo", () => {
  it("mounts in Vuetify context and renders section with headline Build", ({
    expect,
  }) => {
    const wrapper = mountBuildInfo();

    expect(wrapper.exists()).toBe(true);
    const headline = wrapper.find("h3.headline");
    expect(headline.exists()).toBe(true);
    expect(headline.text()).toBe("Build");
  });

  it("renders build date, commit hash, and commit date", ({ expect }) => {
    const wrapper = mountBuildInfo();

    const text = wrapper.text();
    expect(text).toContain("2026-01-15");
    expect(text).toContain("abc123def456");
    expect(text).toContain("2026-01-14");
  });

  it("renders Open on GitHub button", ({ expect }) => {
    const wrapper = mountBuildInfo();

    const buttons = wrapper.findAllComponents({ name: "VBtn" });
    const githubButton = buttons.find((btn) => btn.text() === "Open on GitHub");
    expect(githubButton).toBeDefined();
  });

  it("renders update available message when isUpdateAvailable is true", ({
    expect,
  }) => {
    const wrapper = mountBuildInfo(true);

    expect(wrapper.text()).toContain(
      "A new version is available and will be automatically installed",
    );
  });

  it("does not render update message when isUpdateAvailable is false", ({
    expect,
  }) => {
    const wrapper = mountBuildInfo(false);

    expect(wrapper.text()).not.toContain(
      "A new version is available and will be automatically installed",
    );
  });
});
