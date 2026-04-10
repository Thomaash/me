import { describe, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import { createPinia } from "pinia";
import { useTopologyStore } from "@/store/topologyStore";
import MininetSettingsPage from "@/components/MininetSettingsPage.vue";

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
    data: {
      items: {},
      projectName: "test-project",
      logLevel: "info",
      ipBase: "10.0.0.0/8",
      listenPortBase: 6653,
      autoSetMAC: undefined,
      autoStaticARP: undefined,
      inNamespace: undefined,
      spawnTerminals: undefined,
      startScript: "",
      stopScript: "",
    },
    past: [],
    future: [],
    ...overrides.topology,
  };
  return pinia;
}

function mountMininetSettings(loading = false) {
  const vuetify = createVuetify();
  const pinia = createTestPinia({ app: { loading } });
  const wrapper = mount(MininetSettingsPage, {
    global: {
      plugins: [vuetify, pinia],
    },
  });
  const topologyStore = useTopologyStore(pinia);
  return { wrapper, topologyStore };
}

describe.concurrent("MininetSettingsPage", () => {
  it("mounts successfully in Vuetify context with mock Pinia store", ({
    expect,
  }) => {
    const { wrapper } = mountMininetSettings();

    expect(wrapper.exists()).toBe(true);
  });

  it("renders LoadingSpinner when loading is true", ({ expect }) => {
    const { wrapper } = mountMininetSettings(true);

    const spinner = wrapper.findComponent({ name: "LoadingSpinner" });
    expect(spinner.exists()).toBe(true);
  });

  it("does not render form fields when loading is true", ({ expect }) => {
    const { wrapper } = mountMininetSettings(true);

    const projectNameField = wrapper.find(
      '[data-cy="mininet-settings-project-name"]',
    );
    expect(projectNameField.exists()).toBe(false);
  });

  it("renders form content when loading is false", ({ expect }) => {
    const { wrapper } = mountMininetSettings(false);

    const spinner = wrapper.findComponent({ name: "LoadingSpinner" });
    expect(spinner.exists()).toBe(false);

    const projectNameField = wrapper.find(
      '[data-cy="mininet-settings-project-name"]',
    );
    expect(projectNameField.exists()).toBe(true);

    const ipBaseField = wrapper.find('[data-cy="mininet-settings-ip-base"]');
    expect(ipBaseField.exists()).toBe(true);

    const startScriptField = wrapper.find(
      '[data-cy="mininet-settings-start-script"]',
    );
    expect(startScriptField.exists()).toBe(true);
  });

  it("commits text field values to Pinia store when form fields change", async ({
    expect,
  }) => {
    const { wrapper, topologyStore } = mountMininetSettings(false);

    const projectNameInput = wrapper
      .find('[data-cy="mininet-settings-project-name"]')
      .find("input");
    await projectNameInput.setValue("new-project");

    const ipBaseInput = wrapper
      .find('[data-cy="mininet-settings-ip-base"]')
      .find("input");
    await ipBaseInput.setValue("192.168.0.0/16");

    const listenPortInput = wrapper
      .find('[data-cy="mininet-settings-listen-port-base"]')
      .find("input");
    await listenPortInput.setValue("6654");

    const startScriptTextarea = wrapper
      .find('[data-cy="mininet-settings-start-script"]')
      .find("textarea");
    await startScriptTextarea.setValue("echo start");

    const stopScriptTextarea = wrapper
      .find('[data-cy="mininet-settings-stop-script"]')
      .find("textarea");
    await stopScriptTextarea.setValue("echo stop");

    expect(topologyStore.data.projectName).toBe("new-project");
    expect(topologyStore.data.ipBase).toBe("192.168.0.0/16");
    expect(topologyStore.data.listenPortBase).toBe(6654);
    expect(topologyStore.data.startScript).toBe("echo start");
    expect(topologyStore.data.stopScript).toBe("echo stop");
  });

  it("commits log level to Pinia store when select changes", async ({
    expect,
  }) => {
    const { wrapper, topologyStore } = mountMininetSettings(false);

    const logLevelSelect = wrapper
      .find('[data-cy="mininet-settings-log-level"]')
      .findComponent({ name: "VSelect" });
    await logLevelSelect.setValue("debug");

    expect(topologyStore.data.logLevel).toBe("debug");
  });

  it("commits checkbox values to Pinia store when checkboxes are clicked", async ({
    expect,
  }) => {
    const { wrapper, topologyStore } = mountMininetSettings(false);

    const autoSetMAC = wrapper.find(
      '[data-cy="mininet-settings-auto-set-mac"]',
    );
    await autoSetMAC.trigger("click");

    const autoStaticARP = wrapper.find(
      '[data-cy="mininet-settings-auto-static-arp"]',
    );
    await autoStaticARP.trigger("click");

    const inNamespace = wrapper.find(
      '[data-cy="mininet-settings-in-namespace"]',
    );
    await inNamespace.trigger("click");

    const spawnTerminals = wrapper.find(
      '[data-cy="mininet-settings-spawn-terminals"]',
    );
    await spawnTerminals.trigger("click");

    expect(topologyStore.data.autoSetMAC).toBe(true);
    expect(topologyStore.data.autoStaticARP).toBe(true);
    expect(topologyStore.data.inNamespace).toBe(true);
    expect(topologyStore.data.spawnTerminals).toBe(true);
  });

  it("shows loading spinner when loading is true", ({ expect }) => {
    const { wrapper } = mountMininetSettings(true);

    const spinner = wrapper.findComponent({ name: "LoadingSpinner" });
    expect(spinner.exists()).toBe(true);
    expect(spinner.isVisible()).toBe(true);
  });
});
