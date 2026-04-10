import { describe, it } from "vitest";
import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import { createPinia } from "pinia";
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
    data: { items: {}, projectName: "test-project", startScript: "" },
    past: [],
    future: [],
    ...overrides.topology,
  };
  return pinia;
}

function mountExportPage({ loading = false } = {}) {
  const vuetify = createVuetify();
  const pinia = createTestPinia({ app: { loading }, topology: { loading } });
  return mount(ExportPage, {
    global: {
      plugins: [vuetify, pinia],
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
