import { describe, it } from "vitest";
import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import { createStore } from "vuex";
import ExportPage from "@/components/ExportPage.vue";

const ImportSectionStub = defineComponent({
  name: "ImportSection",
  setup() {
    return () => h("div", { class: "import-section-stub" }, "ImportSection");
  },
});

const ExportSectionStub = defineComponent({
  name: "ExportSection",
  setup() {
    return () => h("div", { class: "export-section-stub" }, "ExportSection");
  },
});

const LogListingStub = defineComponent({
  name: "LogListing",
  setup() {
    return () => h("div", { class: "log-listing-stub" });
  },
});

function createMockStore({ loading = false } = {}) {
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
      setWorking() {},
      setAlert() {},
      clearAlert() {},
    },
    modules: {
      topology: {
        namespaced: true,
        state() {
          return {
            data: { items: {}, projectName: "test-project" },
            past: [],
            future: [],
          };
        },
        getters: {
          data: (s) => s.data,
          canUndo: (s) => s.past.length,
          canRedo: (s) => s.future.length,
          boundingBox: () => () => ({
            sX: 0,
            eX: 100,
            sY: 0,
            eY: 100,
            width: 100,
            height: 100,
            empty: false,
          }),
        },
        mutations: {
          importData() {},
          setValues() {},
          applyChange() {},
        },
        actions: {
          updateItems() {},
        },
      },
    },
  });
}

function mountExportPage({ loading = false } = {}) {
  const vuetify = createVuetify();
  const store = createMockStore({ loading });
  return mount(ExportPage, {
    global: {
      plugins: [vuetify, store],
      stubs: {
        ImportSection: ImportSectionStub,
        ExportSection: ExportSectionStub,
        LogListing: LogListingStub,
      },
    },
  });
}

describe.concurrent("ExportPage", () => {
  it("mounts successfully in Vuetify context with mock store", ({ expect }) => {
    const wrapper = mountExportPage();

    expect(wrapper.exists()).toBe(true);
  });

  it("renders LoadingSpinner when loading is not false", ({ expect }) => {
    const wrapper = mountExportPage({ loading: true });

    const spinner = wrapper.findComponent({ name: "LoadingSpinner" });
    expect(spinner.exists()).toBe(true);

    expect(wrapper.text()).not.toContain("Import");
    expect(wrapper.text()).not.toContain("Export");
  });

  it("renders Import and Export headings with ImportSection and ExportSection when loading is false", ({
    expect,
  }) => {
    const wrapper = mountExportPage({ loading: false });

    const spinner = wrapper.findComponent({ name: "LoadingSpinner" });
    expect(spinner.exists()).toBe(false);

    expect(wrapper.text()).toContain("Import");
    expect(wrapper.text()).toContain("Export");
    expect(wrapper.find(".import-section-stub").exists()).toBe(true);
    expect(wrapper.find(".export-section-stub").exists()).toBe(true);
  });
});
