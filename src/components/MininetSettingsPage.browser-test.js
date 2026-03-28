import { describe, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import { createStore } from "vuex";
import MininetSettingsPage from "@/components/MininetSettingsPage.vue";

function createMockStore(loading = false) {
  return createStore({
    state() {
      return {
        loading,
        working: false,
        isUpdateAvailable: false,
        alert: { show: false },
      };
    },
    mutations: {
      setLoading(state, value) {
        state.loading = value;
      },
    },
    modules: {
      topology: {
        namespaced: true,
        state() {
          return {
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
          };
        },
        getters: {
          canUndo: (s) => s.past.length,
          canRedo: (s) => s.future.length,
          data: (s) => s.data,
        },
        mutations: {
          setValues(state, values) {
            Object.assign(state.data, values);
          },
        },
      },
    },
  });
}

function mountMininetSettings(loading = false) {
  const vuetify = createVuetify();
  const store = createMockStore(loading);
  const wrapper = mount(MininetSettingsPage, {
    global: {
      plugins: [vuetify, store],
    },
  });
  return { wrapper, store };
}

describe.concurrent("MininetSettingsPage", () => {
  it("mounts successfully in Vuetify context with mock Vuex store", ({
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

  it("commits text field values to Vuex store when form fields change", async ({
    expect,
  }) => {
    const { wrapper, store } = mountMininetSettings(false);

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

    expect(store.state.topology.data.projectName).toBe("new-project");
    expect(store.state.topology.data.ipBase).toBe("192.168.0.0/16");
    expect(store.state.topology.data.listenPortBase).toBe(6654);
    expect(store.state.topology.data.startScript).toBe("echo start");
    expect(store.state.topology.data.stopScript).toBe("echo stop");
  });

  it("commits log level to Vuex store when select changes", async ({
    expect,
  }) => {
    const { wrapper, store } = mountMininetSettings(false);

    const logLevelSelect = wrapper
      .find('[data-cy="mininet-settings-log-level"]')
      .findComponent({ name: "VSelect" });
    await logLevelSelect.setValue("debug");

    expect(store.state.topology.data.logLevel).toBe("debug");
  });

  it("commits checkbox values to Vuex store when checkboxes are clicked", async ({
    expect,
  }) => {
    const { wrapper, store } = mountMininetSettings(false);

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

    expect(store.state.topology.data.autoSetMAC).toBe(true);
    expect(store.state.topology.data.autoStaticARP).toBe(true);
    expect(store.state.topology.data.inNamespace).toBe(true);
    expect(store.state.topology.data.spawnTerminals).toBe(true);
  });

  it("shows loading spinner when loading is true", ({ expect }) => {
    const { wrapper } = mountMininetSettings(true);

    const spinner = wrapper.findComponent({ name: "LoadingSpinner" });
    expect(spinner.exists()).toBe(true);
    expect(spinner.isVisible()).toBe(true);
  });
});
