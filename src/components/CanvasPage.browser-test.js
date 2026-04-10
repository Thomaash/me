import { describe, it, afterEach, vi } from "vitest";
import { defineComponent, h, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import { createPinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import CanvasPage from "@/components/CanvasPage.vue";

const visMethodSpies = {
  addEdge: vi.fn(),
  addPort: vi.fn(),
  addHost: vi.fn(),
  addSwitch: vi.fn(),
  addController: vi.fn(),
  addDummy: vi.fn(),
  deleteSelected: vi.fn(),
};

let pendingEditItem = null;

const VisContainerStub = defineComponent({
  name: "VisContainer",
  emits: ["edit-item"],
  methods: { ...visMethodSpies },
  setup(_, { emit }) {
    const onClick = () => {
      if (pendingEditItem) {
        emit("edit-item", pendingEditItem.item, pendingEditItem.callback);
        pendingEditItem = null;
      }
    };
    return () =>
      h(
        "div",
        { class: "vis-container-stub", "data-cy": "vis-edit-trigger", onClick },
        "VisContainer",
      );
  },
});

const editSpy = vi.fn();

const EditStub = defineComponent({
  name: "ItemEdit",
  methods: {
    edit: editSpy,
  },
  setup() {
    return () => h("div", { class: "edit-stub" }, "Edit");
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
    data: { items: {}, projectName: "Test", startScript: "" },
    past: [],
    future: [],
    ...overrides.topology,
  };
  return pinia;
}

let wrapper;

afterEach(() => {
  wrapper?.unmount();
});

async function mountCanvasPage({ loading = false, isView = false } = {}) {
  const vuetify = createVuetify();
  const pinia = createTestPinia({ app: { loading }, topology: { loading } });
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/", component: CanvasPage, meta: { isView } }],
  });
  await router.push("/");
  await router.isReady();
  wrapper = mount(CanvasPage, {
    attachTo: document.body,
    global: {
      plugins: [vuetify, pinia, router],
      stubs: {
        VisContainer: VisContainerStub,
        Edit: EditStub,
      },
    },
  });
  return wrapper;
}

describe("CanvasPage", () => {
  it("renders LoadingSpinner when loading is true", async ({ expect }) => {
    const w = await mountCanvasPage({ loading: true });

    const spinner = w.findComponent({ name: "LoadingSpinner" });
    expect(spinner.exists()).toBe(true);

    expect(w.find(".vis-container-stub").exists()).toBe(false);
    expect(w.find(".edit-stub").exists()).toBe(false);
  });

  it("renders VisContainer and Edit when loading is false", async ({
    expect,
  }) => {
    const w = await mountCanvasPage({ loading: false });

    const spinner = w.findComponent({ name: "LoadingSpinner" });
    expect(spinner.exists()).toBe(false);

    expect(w.find(".vis-container-stub").exists()).toBe(true);
    expect(w.find(".edit-stub").exists()).toBe(true);
  });

  it("renders speed dial FAB with activator and item buttons when not in view mode", async ({
    expect,
  }) => {
    const w = await mountCanvasPage({ loading: false, isView: false });

    const fabActivator = w.find('[data-cy="fab-activator"]');
    expect(fabActivator.exists()).toBe(true);

    // Open the speed dial by hovering over the FAB activator
    await fabActivator.trigger("mouseenter");
    await nextTick();
    // Allow Vuetify transition/rendering to complete
    await expect
      .poll(() => document.querySelector('[data-cy="fab-edge"]'))
      .toBeTruthy();

    const expectedButtons = [
      "fab-edge",
      "fab-port",
      "fab-host",
      "fab-switch",
      "fab-controller",
      "fab-dummy",
      "fab-delete",
    ];

    for (const cy of expectedButtons) {
      const btn = document.querySelector(`[data-cy="${cy}"]`);
      expect(
        btn,
        `Expected button with data-cy="${cy}" to exist`,
      ).not.toBeNull();
    }
  });

  it("hides speed dial FAB when in view mode", async ({ expect }) => {
    const w = await mountCanvasPage({ loading: false, isView: true });

    const fabActivator = w.find('[data-cy="fab-activator"]');
    expect(fabActivator.exists()).toBe(false);

    const speedDial = w.findComponent({ name: "VSpeedDial" });
    expect(speedDial.exists()).toBe(false);
  });

  it("FAB button clicks delegate to VisContainer methods", async ({
    expect,
  }) => {
    Object.values(visMethodSpies).forEach((spy) => spy.mockClear());
    const w = await mountCanvasPage({ loading: false, isView: false });

    // Open the speed dial by hovering over the FAB activator
    const fabActivator = w.find('[data-cy="fab-activator"]');
    await fabActivator.trigger("mouseenter");
    await nextTick();
    await expect
      .poll(() => document.querySelector('[data-cy="fab-edge"]'))
      .toBeTruthy();

    const buttonMethodPairs = [
      ["fab-edge", "addEdge"],
      ["fab-port", "addPort"],
      ["fab-host", "addHost"],
      ["fab-switch", "addSwitch"],
      ["fab-controller", "addController"],
      ["fab-dummy", "addDummy"],
      ["fab-delete", "deleteSelected"],
    ];

    for (const [cy, method] of buttonMethodPairs) {
      const btn = document.querySelector(`[data-cy="${cy}"]`);
      btn.click();
      await nextTick();
      expect(
        visMethodSpies[method],
        `Expected ${method} to be called after clicking ${cy}`,
      ).toHaveBeenCalled();
    }
  });

  it("delegates editItem to Edit component ref", async ({ expect }) => {
    editSpy.mockClear();
    const w = await mountCanvasPage({ loading: false, isView: false });

    const item = { id: "test-item", type: "host" };
    const callback = vi.fn();

    // Set pending edit data and click the VisContainer stub trigger
    pendingEditItem = { item, callback };
    const trigger = w.find('[data-cy="vis-edit-trigger"]');
    await trigger.trigger("click");
    await nextTick();

    expect(editSpy).toHaveBeenCalledWith(item, callback);
  });
});
