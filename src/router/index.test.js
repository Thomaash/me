import { describe, it, vi, beforeEach } from "vitest";

const mockAppStore = {
  clearAlert: vi.fn(),
  setWorking: vi.fn(),
};

vi.mock("@/store/pinia", () => ({
  pinia: {},
}));

vi.mock("@/store/appStore", () => ({
  useAppStore: () => mockAppStore,
}));

// Capture the beforeEach guard by wrapping createRouter
let capturedBeforeEachGuard;
vi.mock("vue-router", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    createRouter(options) {
      const routerInstance = actual.createRouter(options);
      const originalBeforeEach = routerInstance.beforeEach.bind(routerInstance);
      routerInstance.beforeEach = (guard) => {
        capturedBeforeEachGuard = guard;
        return originalBeforeEach(guard);
      };
      return routerInstance;
    },
  };
});

const { router } = await import("@/router/index.js");

// --- Helpers ---------------------------------------------------------------

const findRouteByName = (name) =>
  router.getRoutes().find((r) => r.name === name);

const findMatched = (path, name) =>
  router.resolve(path).matched.find((r) => r.name === name);

/** Invoke the captured beforeEach guard with resolved `to` / `from` paths. */
const invokeGuard = (toPath, fromPath, { toOverride, fromOverride } = {}) => {
  const to = toOverride ?? router.resolve(toPath);
  const from = fromOverride ?? router.resolve(fromPath);
  const next = vi.fn();
  capturedBeforeEachGuard(to, from, next);
  return { to, from, next };
};

// Expected normal (non-view) routes — drives drawer/icon/title contract.
const NORMAL_ROUTES = [
  {
    path: "/home",
    name: "Home",
    title: "Home",
    icon: "mdi-home",
    routerViewKey: "Home",
  },
  {
    path: "/mininet_settings",
    name: "Mininet settings",
    title: "Mininet Settings",
    icon: "mdi-tune",
    routerViewKey: "Mininet settings",
  },
  {
    path: "/export",
    name: "Export",
    title: "Export/Import",
    icon: "mdi-content-save",
    routerViewKey: "Export",
  },
  {
    path: "/about",
    name: "About",
    title: "About",
    icon: "mdi-information",
    routerViewKey: "About",
  },
];

// Expected view-mode mirror routes.
const VIEW_ROUTES = [
  { path: "/view/home", name: "View | Home", title: "Home", icon: "mdi-home" },
  {
    path: "/view/canvas",
    name: "View | Canvas without position",
    title: "Canvas",
    icon: undefined, // child route, icon lives on parent "View | Canvas"
  },
  {
    path: "/view/mininet_settings",
    name: "View | Mininet settings",
    title: "Mininet Settings",
    icon: "mdi-tune",
  },
  {
    path: "/view/export",
    name: "View | Export",
    title: "Export/Import",
    icon: "mdi-content-save",
  },
  {
    path: "/view/about",
    name: "View | About",
    title: "About",
    icon: "mdi-information",
  },
];

// --- Tests -----------------------------------------------------------------

describe("canvas subtitle behavior (consumed by App.vue)", () => {
  const canvasWithoutPosition = findMatched(
    "/canvas",
    "Canvas without position",
  );
  const canvasWithPosition = findMatched(
    "/canvas/10/20/0.5",
    "Canvas with position",
  );

  it("returns empty string for falsy ids input", ({ expect }) => {
    expect(
      canvasWithoutPosition.meta.subtitle({ params: { ids: undefined } }),
    ).toBe("");
  });

  it("returns singular form for a single id string", ({ expect }) => {
    expect(
      canvasWithoutPosition.meta.subtitle({ params: { ids: "abc" } }),
    ).toBe(" with 1 selected item");
  });

  it("returns plural form for comma-separated ids with N > 1", ({ expect }) => {
    expect(
      canvasWithoutPosition.meta.subtitle({ params: { ids: "a,b,c" } }),
    ).toBe(" with 3 selected items");
  });

  it("produces correct position and selection text for canvas with position", ({
    expect,
  }) => {
    expect(
      canvasWithPosition.meta.subtitle({
        params: { x: "10", y: "20", scale: "0.5", ids: "a,b" },
      }),
    ).toBe(" at position 10 × 20 scaled to 50 % with 2 selected items");
  });

  it("produces position text without selection when ids is falsy", ({
    expect,
  }) => {
    expect(
      canvasWithPosition.meta.subtitle({
        params: { x: "5", y: "15", scale: "1", ids: undefined },
      }),
    ).toBe(" at position 5 × 15 scaled to 100 %");
  });
});

describe("normal route resolution (drawer entries)", () => {
  it.for(NORMAL_ROUTES)(
    "drawer renders $name at $path with title/icon for App.vue",
    ({ path, name, title, icon, routerViewKey }, { expect }) => {
      const resolved = router.resolve(path);
      expect(resolved.name).toBe(name);
      expect(resolved.meta).toEqual(
        expect.objectContaining({
          title,
          icon,
          drawer: true,
          routerViewKey,
          isView: false,
        }),
      );
    },
  );

  it("resolves /canvas to 'Canvas without position' (drawer entry lives on parent)", ({
    expect,
  }) => {
    const resolved = router.resolve("/canvas");
    expect(resolved.name).toBe("Canvas without position");
    expect(resolved.meta).toEqual(
      expect.objectContaining({
        title: "Canvas",
        routerViewKey: "Canvas",
        isView: false,
      }),
    );
  });

  it("Canvas parent registers drawer entry with map icon", ({ expect }) => {
    expect(router.hasRoute("Canvas")).toBe(true);
    const canvasParent = router
      .getRoutes()
      .find((r) => r.name === "Canvas" && r.meta.isView === false);
    expect(canvasParent.meta).toEqual(
      expect.objectContaining({
        title: "Canvas",
        icon: "mdi-map",
        drawer: true,
        routerViewKey: "Canvas",
        isView: false,
      }),
    );
  });

  it("root path / redirects to Home", async ({ expect }) => {
    const resolved = router.resolve("/");
    expect(resolved.matched[0].redirect).toEqual({ name: "Home" });
    await router.push("/");
    expect(router.currentRoute.value.name).toBe("Home");
  });
});

describe("canvas child route resolution", () => {
  it("/canvas/a,b carries ids param", ({ expect }) => {
    const resolved = router.resolve("/canvas/a,b");
    expect(resolved.name).toBe("Canvas without position");
    expect(resolved.params.ids).toBe("a,b");
  });

  it("/canvas/10/20/1.5 resolves to 'Canvas with position' with x/y/scale params", ({
    expect,
  }) => {
    const resolved = router.resolve("/canvas/10/20/1.5");
    expect(resolved.name).toBe("Canvas with position");
    expect(resolved.params).toEqual(
      expect.objectContaining({ x: "10", y: "20", scale: "1.5" }),
    );
    expect(resolved.meta.title).toBe("Canvas");
    expect(resolved.meta.routerViewKey).toBe("Canvas");
  });

  it("/canvas/10/20/1.5/a,b combines position and ids params", ({ expect }) => {
    const resolved = router.resolve("/canvas/10/20/1.5/a,b");
    expect(resolved.name).toBe("Canvas with position");
    expect(resolved.params.ids).toBe("a,b");
  });
});

describe("view-mode mirror routes", () => {
  it.for(VIEW_ROUTES)(
    "$path resolves as view-mode (drawer hidden, isView=true)",
    ({ path, name, title }, { expect }) => {
      const resolved = router.resolve(path);
      expect(resolved.name).toBe(name);
      expect(resolved.meta.isView).toBe(true);
      expect(resolved.meta.drawer).toBe(false);
      expect(resolved.meta.title).toBe(title);
    },
  );

  it("/view/ redirects to View | Home and tags route as view-mode", async ({
    expect,
  }) => {
    const resolved = router.resolve("/view/");
    expect(resolved.matched[0].redirect).toEqual({ name: "View | Home" });
    await router.push("/view/");
    expect(router.currentRoute.value.name).toBe("View | Home");
    expect(router.currentRoute.value.meta.isView).toBe(true);
  });

  it("view canvas child paths resolve with isView=true", ({ expect }) => {
    const withIds = router.resolve("/view/canvas/a,b");
    expect(withIds.name).toBe("View | Canvas without position");
    expect(withIds.meta.isView).toBe(true);
    expect(withIds.params.ids).toBe("a,b");

    const withPosition = router.resolve("/view/canvas/10/20/1.5");
    expect(withPosition.name).toBe("View | Canvas with position");
    expect(withPosition.meta.isView).toBe(true);
  });

  it.for([
    ["View | Home", "mdi-home"],
    ["View | Canvas", "mdi-map"],
    ["View | Mininet settings", "mdi-tune"],
    ["View | Export", "mdi-content-save"],
    ["View | About", "mdi-information"],
  ])(
    "view mirror %s preserves icon for App.vue header",
    ([name, icon], { expect }) => {
      const route = findRouteByName(name);
      expect(route, `route ${name}`).toBeDefined();
      expect(route.meta.icon).toBe(icon);
    },
  );
});

describe("registered route counts", () => {
  it("registers the same number of normal and view routes via getRoutes()", ({
    expect,
  }) => {
    const all = router.getRoutes();
    const normalCount = all.filter((r) => r.meta.isView === false).length;
    const viewCount = all.filter((r) => r.meta.isView === true).length;
    expect(normalCount).toBe(viewCount);
    expect(normalCount).toBeGreaterThan(0);
  });

  it.for([
    "Home",
    "Canvas",
    "Canvas without position",
    "Canvas with position",
    "Mininet settings",
    "Export",
    "About",
  ])("registers '%s' in both normal and view modes", (name, { expect }) => {
    expect(router.hasRoute(name), `normal ${name}`).toBe(true);
    expect(router.hasRoute(`View | ${name}`), `view ${name}`).toBe(true);
  });
});

describe("beforeEach navigation guard", () => {
  beforeEach(() => {
    mockAppStore.clearAlert.mockClear();
    mockAppStore.setWorking.mockClear();
  });

  it("redirects to /view-prefixed path when leaving view mode", ({
    expect,
  }) => {
    const { to, next } = invokeGuard("/about", "/view/home");
    expect(next).toHaveBeenCalledWith(`/view${to.fullPath}`);
    expect(next).toHaveBeenCalledWith("/view/about");
  });

  it("clears alert and resets working flag on cross-route navigation", ({
    expect,
  }) => {
    const { next } = invokeGuard("/about", "/home");
    expect(mockAppStore.clearAlert).toHaveBeenCalled();
    expect(mockAppStore.setWorking).toHaveBeenCalledWith({ working: false });
    expect(next).toHaveBeenCalledWith();
  });

  it("skips store side effects when staying within the same canvas parent", ({
    expect,
  }) => {
    const { next } = invokeGuard("/canvas/a,b", "/canvas/10/20/1.5");
    expect(mockAppStore.clearAlert).not.toHaveBeenCalled();
    expect(mockAppStore.setWorking).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it("treats empty to.matched as a cross-route nav (clears alert)", ({
    expect,
  }) => {
    const toOverride = {
      meta: { isView: false },
      fullPath: "/unknown",
      matched: [],
    };
    const { next } = invokeGuard(null, "/home", { toOverride });
    expect(mockAppStore.clearAlert).toHaveBeenCalled();
    expect(mockAppStore.setWorking).toHaveBeenCalledWith({ working: false });
    expect(next).toHaveBeenCalledWith();
  });

  it("treats empty from.matched as a cross-route nav (clears alert)", ({
    expect,
  }) => {
    const fromOverride = { meta: { isView: false }, matched: [] };
    const { next } = invokeGuard("/home", null, { fromOverride });
    expect(mockAppStore.clearAlert).toHaveBeenCalled();
    expect(mockAppStore.setWorking).toHaveBeenCalledWith({ working: false });
    expect(next).toHaveBeenCalledWith();
  });

  it("real router.push triggers store side effects on cross-route nav", async ({
    expect,
  }) => {
    await router.push("/home");
    mockAppStore.clearAlert.mockClear();
    mockAppStore.setWorking.mockClear();

    await router.push("/about");

    expect(mockAppStore.clearAlert).toHaveBeenCalled();
    expect(mockAppStore.setWorking).toHaveBeenCalledWith({ working: false });
  });
});
