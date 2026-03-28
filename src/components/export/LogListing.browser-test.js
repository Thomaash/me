import { describe, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import { createRouter, createMemoryHistory } from "vue-router";
import LogListing from "@/components/export/LogListing.vue";

function createMockRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "Home", component: { template: "<div/>" } },
      {
        path: "/canvas/:ids?",
        name: "Canvas without position",
        component: { template: "<div/>" },
      },
    ],
  });
}

function mountLogListing({ log = [] } = {}) {
  const vuetify = createVuetify();
  const router = createMockRouter();
  const wrapper = mount(LogListing, {
    props: { log },
    global: {
      plugins: [vuetify, router],
    },
  });
  return { wrapper, router };
}

const sampleLog = [
  { item: { id: "h1" }, severity: "error", msg: "Host h1 has no links" },
  { item: { id: "s1" }, severity: "warning", msg: "Switch s1 has one link" },
  { item: { id: "h2" }, severity: "info", msg: "Host h2 is configured" },
];

describe.concurrent("LogListing", () => {
  it("mounts successfully in Vuetify context with mock router", ({
    expect,
  }) => {
    const { wrapper } = mountLogListing({ log: sampleLog });

    expect(wrapper.exists()).toBe(true);
  });

  it("renders a list with log entries displaying their msg text", ({
    expect,
  }) => {
    const { wrapper } = mountLogListing({ log: sampleLog });

    const listItems = wrapper.findAllComponents({ name: "VListItem" });
    expect(listItems.length).toBe(sampleLog.length);

    for (const entry of sampleLog) {
      expect(wrapper.text()).toContain(entry.msg);
    }
  });

  it("renders the Select in the Canvas button", ({ expect }) => {
    const { wrapper } = mountLogListing({ log: sampleLog });

    const buttons = wrapper.findAllComponents({ name: "VBtn" });
    const selectButton = buttons.find(
      (btn) => btn.text() === "Select in the Canvas",
    );

    expect(selectButton).toBeDefined();
  });

  it("sorts log entries by severity priority: error first, then warning, then info", ({
    expect,
  }) => {
    const unsortedLog = [
      { item: { id: "h2" }, severity: "info", msg: "Info message" },
      { item: { id: "h1" }, severity: "error", msg: "Error message" },
      { item: { id: "s1" }, severity: "warning", msg: "Warning message" },
    ];
    const { wrapper } = mountLogListing({ log: unsortedLog });

    const listItems = wrapper.findAllComponents({ name: "VListItem" });
    const displayedMessages = listItems.map((item) => item.text());

    expect(displayedMessages[0]).toContain("Error message");
    expect(displayedMessages[1]).toContain("Warning message");
    expect(displayedMessages[2]).toContain("Info message");
  });

  it("navigates to canvas with single item id when per-item button is clicked", async ({
    expect,
  }) => {
    const { wrapper, router } = mountLogListing({ log: sampleLog });
    const pushSpy = vi.spyOn(router, "push").mockResolvedValue();

    // sortedLog order: error(h1), warning(s1), info(h2)
    // First list item's icon button triggers selectInCanvas(item.id)
    const listItems = wrapper.findAllComponents({ name: "VListItem" });
    const firstItemButtons = listItems[0].findAllComponents({ name: "VBtn" });
    await firstItemButtons[0].trigger("click");

    expect(pushSpy).toHaveBeenCalledWith({
      name: "Canvas without position",
      params: { ids: "h1" },
    });
  });

  it("navigates to canvas with checked item ids when Select in Canvas is clicked with checkboxes checked", async ({
    expect,
  }) => {
    const { wrapper, router } = mountLogListing({ log: sampleLog });
    const pushSpy = vi.spyOn(router, "push").mockResolvedValue();

    // sortedLog order: error(h1), warning(s1), info(h2)
    // Toggle first checkbox (index 0 = error item h1)
    const listItems = wrapper.findAllComponents({ name: "VListItem" });
    await listItems[0].trigger("click");

    const buttons = wrapper.findAllComponents({ name: "VBtn" });
    const selectButton = buttons.find(
      (btn) => btn.text() === "Select in the Canvas",
    );
    await selectButton.trigger("click");

    expect(pushSpy).toHaveBeenCalledWith({
      name: "Canvas without position",
      params: { ids: "h1" },
    });
  });

  it("navigates to canvas with all item ids when Select in Canvas is clicked with no checkboxes checked", async ({
    expect,
  }) => {
    const { wrapper, router } = mountLogListing({ log: sampleLog });
    const pushSpy = vi.spyOn(router, "push").mockResolvedValue();

    const buttons = wrapper.findAllComponents({ name: "VBtn" });
    const selectButton = buttons.find(
      (btn) => btn.text() === "Select in the Canvas",
    );
    await selectButton.trigger("click");

    // sortedLog order: error(h1), warning(s1), info(h2)
    expect(pushSpy).toHaveBeenCalledWith({
      name: "Canvas without position",
      params: { ids: "h1,s1,h2" },
    });
  });
});
