import { describe, it, afterEach } from "vitest";
import { defineComponent, h } from "vue";
import { mount, flushPromises } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import { createPinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import App from "@/App.vue";

const DummyPage = defineComponent({
  name: "DummyPage",
  setup() {
    return () => h("div", { class: "dummy-page" }, "DummyPage");
  },
});

function createTestPinia() {
  const pinia = createPinia();
  pinia.state.value.app = {
    loading: false,
    working: false,
    isUpdateAvailable: false,
    alert: { show: false },
  };
  pinia.state.value.topology = {
    data: { items: {}, projectName: "Test", startScript: "" },
    past: [],
    future: [],
  };
  return pinia;
}

function createMockRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: "/",
        redirect: { name: "Home" },
      },
      {
        path: "/home",
        name: "Home",
        component: DummyPage,
        meta: {
          title: "Home",
          drawer: true,
          icon: "mdi-home",
          routerViewKey: "Home",
          isView: false,
        },
      },
      {
        path: "/canvas",
        name: "Canvas",
        component: DummyPage,
        meta: {
          title: "Canvas",
          drawer: true,
          icon: "mdi-map",
          routerViewKey: "Canvas",
          isView: false,
        },
      },
      {
        path: "/mininet_settings",
        name: "Mininet settings",
        component: DummyPage,
        meta: {
          title: "Mininet Settings",
          drawer: true,
          icon: "mdi-tune",
          routerViewKey: "Mininet settings",
          isView: false,
        },
      },
      {
        path: "/export",
        name: "Export",
        component: DummyPage,
        meta: {
          title: "Export/Import",
          drawer: true,
          icon: "mdi-content-save",
          routerViewKey: "Export",
          isView: false,
        },
      },
      {
        path: "/about",
        name: "About",
        component: DummyPage,
        meta: {
          title: "About",
          drawer: true,
          icon: "mdi-information",
          routerViewKey: "About",
          isView: false,
        },
      },
    ],
  });
}

let wrapper;

afterEach(() => {
  wrapper?.unmount();
});

async function mountApp() {
  const vuetify = createVuetify();
  const pinia = createTestPinia();
  const router = createMockRouter();

  router.push("/home");
  await router.isReady();

  wrapper = mount(App, {
    attachTo: document.body,
    global: {
      plugins: [vuetify, pinia, router],
    },
  });
  await flushPromises();
  return wrapper;
}

describe("App", () => {
  it("renders v-app-bar with Mininet Editor title", async ({ expect }) => {
    await mountApp();

    const appBar = document.querySelector(".v-app-bar");
    expect(appBar).not.toBeNull();

    const titleEl = document.querySelector(".v-toolbar-title");
    expect(titleEl).not.toBeNull();
    expect(titleEl.textContent).toContain("Mininet Editor");
  });

  it("renders navigation drawer with items for routes where meta.drawer is true", async ({
    expect,
  }) => {
    await mountApp();

    const navDrawer = document.querySelector(".v-navigation-drawer");
    expect(navDrawer).not.toBeNull();

    const drawerItems = document.querySelectorAll(
      ".v-navigation-drawer .v-list-item",
    );
    expect(drawerItems.length).toBe(5);

    const itemTexts = Array.from(drawerItems).map((el) =>
      el.textContent.trim(),
    );
    expect(itemTexts).toContain("Home");
    expect(itemTexts).toContain("Canvas");
    expect(itemTexts).toContain("Mininet Settings");
    expect(itemTexts).toContain("Export/Import");
    expect(itemTexts).toContain("About");
  });

  it("renders v-main with router-view", async ({ expect }) => {
    await mountApp();

    const main = document.querySelector(".v-main");
    expect(main).not.toBeNull();

    const dummyPage = document.querySelector(".dummy-page");
    expect(dummyPage).not.toBeNull();
    expect(dummyPage.textContent).toBe("DummyPage");
  });
});
