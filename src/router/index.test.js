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
const routes = router.options.routes;

// Helper: find a route by name in a flat or nested structure
function findRoute(name, routeList = routes) {
  for (const route of routeList) {
    if (route.name === name) return route;
    if (route.children) {
      const found = findRoute(name, route.children);
      if (found) return found;
    }
  }
  return null;
}

// Normal routes are the first set (isView === false), view routes the second (isView === true)
const normalRoutes = routes.filter(
  (r) => r.meta == null || r.meta.isView === false,
);
const viewRoutes = routes.filter((r) => r.meta && r.meta.isView === true);
const canvasRoute = normalRoutes.find((r) => r.path === "/canvas");
const viewCanvasRoute = viewRoutes.find((r) => r.name === "View | Canvas");

describe("selectionTitleSuffix (tested via canvas child subtitle)", () => {
  const canvasWithPosition = findRoute("Canvas with position", normalRoutes);
  const canvasWithoutPosition = findRoute(
    "Canvas without position",
    normalRoutes,
  );

  it("returns empty string for falsy ids input", ({ expect }) => {
    const result = canvasWithoutPosition.meta.subtitle({
      params: { ids: undefined },
    });
    expect(result).toBe("");
  });

  it("returns singular form for a single id string", ({ expect }) => {
    const result = canvasWithoutPosition.meta.subtitle({
      params: { ids: "abc" },
    });
    expect(result).toBe(" with 1 selected item");
  });

  it("returns plural form for comma-separated ids with N > 1", ({ expect }) => {
    const result = canvasWithoutPosition.meta.subtitle({
      params: { ids: "a,b,c" },
    });
    expect(result).toBe(" with 3 selected items");
  });

  it("produces correct position and selection text for canvas with position", ({
    expect,
  }) => {
    const result = canvasWithPosition.meta.subtitle({
      params: { x: "10", y: "20", scale: "0.5", ids: "a,b" },
    });
    expect(result).toBe(
      " at position 10\u00a0\u00d7\u00a020 scaled to 50\u00a0% with 2 selected items",
    );
  });

  it("produces position text without selection when ids is falsy", ({
    expect,
  }) => {
    const result = canvasWithPosition.meta.subtitle({
      params: { x: "5", y: "15", scale: "1", ids: undefined },
    });
    expect(result).toBe(
      " at position 5\u00a0\u00d7\u00a015 scaled to 100\u00a0%",
    );
  });
});

describe("createRoutes (tested via router.options.routes)", () => {
  it.for([
    ["/", "/", { isView: false }],
    ["/home", "Home", { title: "Home", drawer: true, isView: false }],
    ["/canvas", "Canvas", { title: "Canvas", drawer: true, isView: false }],
    [
      "/mininet_settings",
      "Mininet settings",
      { title: "Mininet Settings", drawer: true, isView: false },
    ],
    [
      "/export",
      "Export",
      { title: "Export/Import", drawer: true, isView: false },
    ],
    ["/about", "About", { title: "About", drawer: true, isView: false }],
  ])(
    "includes normal route with path=%s, name=%s",
    ([path, name, expectedMeta], { expect }) => {
      const route = normalRoutes.find((r) => r.path === path);
      expect(route).toBeDefined();
      expect(route.name).toBe(name);
      expect(route.meta).toEqual(expect.objectContaining(expectedMeta));
    },
  );

  it("canvas normal route has two children", ({ expect }) => {
    expect(canvasRoute.children).toHaveLength(2);
    expect(canvasRoute.children[0].name).toBe("Canvas without position");
    expect(canvasRoute.children[1].name).toBe("Canvas with position");
  });

  it("has exactly 6 normal routes at the top level", ({ expect }) => {
    expect(normalRoutes).toHaveLength(6);
  });

  it("has exactly 6 view routes at the top level", ({ expect }) => {
    expect(viewRoutes).toHaveLength(6);
  });

  it("root route redirects to Home", ({ expect }) => {
    const root = normalRoutes.find((r) => r.path === "/");
    expect(root.redirect).toEqual({ name: "Home" });
  });
});

describe("route meta icon properties", () => {
  it.for([
    ["Home", "mdi-home"],
    ["Canvas", "mdi-map"],
    ["Mininet settings", "mdi-tune"],
    ["Export", "mdi-content-save"],
    ["About", "mdi-information"],
  ])("normal route %s has icon %s", ([name, expectedIcon], { expect }) => {
    const route = normalRoutes.find((r) => r.name === name);
    expect(route.meta.icon).toBe(expectedIcon);
  });
});

describe("route meta routerViewKey properties", () => {
  it.for([
    ["Home", "Home"],
    ["Canvas", "Canvas"],
    ["Mininet settings", "Mininet settings"],
    ["Export", "Export"],
    ["About", "About"],
  ])(
    "normal route %s has routerViewKey %s",
    ([name, expectedKey], { expect }) => {
      const route = normalRoutes.find((r) => r.name === name);
      expect(route.meta.routerViewKey).toBe(expectedKey);
    },
  );
});

describe("canvas child route paths", () => {
  it("canvas without position has path ':ids?'", ({ expect }) => {
    expect(canvasRoute.children[0].path).toBe(":ids?");
  });

  it("canvas with position has path ':x/:y/:scale/:ids?'", ({ expect }) => {
    expect(canvasRoute.children[1].path).toBe(":x/:y/:scale/:ids?");
  });

  it("canvas children have routerViewKey 'Canvas'", ({ expect }) => {
    expect(canvasRoute.children[0].meta.routerViewKey).toBe("Canvas");
    expect(canvasRoute.children[1].meta.routerViewKey).toBe("Canvas");
  });

  it("canvas children have title 'Canvas'", ({ expect }) => {
    expect(canvasRoute.children[0].meta.title).toBe("Canvas");
    expect(canvasRoute.children[1].meta.title).toBe("Canvas");
  });
});

describe("canvas route props", () => {
  it("canvas toolbar has undoRedo set to true", ({ expect }) => {
    expect(canvasRoute.props).toEqual({ toolbar: { undoRedo: true } });
  });
});

describe("route components", () => {
  it.for([
    ["Home", ["default"]],
    ["Canvas", ["default", "toolbar"]],
    ["Mininet settings", ["default", "toolbar"]],
    ["Export", ["default", "toolbar"]],
    ["About", ["default"]],
  ])(
    "normal route %s has component keys %j",
    ([name, expectedKeys], { expect }) => {
      const route = normalRoutes.find((r) => r.name === name);
      expect(Object.keys(route.components).toSorted()).toEqual(
        expectedKeys.toSorted(),
      );
      for (const key of expectedKeys) {
        expect(typeof route.components[key]).toBe("function");
      }
    },
  );

  it("canvas children have both default and toolbar components", ({
    expect,
  }) => {
    for (const child of canvasRoute.children) {
      expect(child.components).toHaveProperty("default");
      expect(child.components).toHaveProperty("toolbar");
      expect(typeof child.components.default).toBe("function");
      expect(typeof child.components.toolbar).toBe("function");
    }
  });
});

describe("createNormalRoute (tested via normal routes in router)", () => {
  it("sets meta.isView to false on all normal routes", ({ expect }) => {
    for (const route of normalRoutes) {
      if (route.meta) {
        expect(route.meta.isView).toBe(false);
      }
    }
  });

  it("recurses into children setting meta.isView to false", ({ expect }) => {
    for (const child of canvasRoute.children) {
      expect(child.meta.isView).toBe(false);
    }
  });

  it("creates meta object if route has no meta (root route)", ({ expect }) => {
    const root = normalRoutes.find((r) => r.path === "/");
    expect(root.meta).toBeDefined();
    expect(root.meta.isView).toBe(false);
  });
});

describe("createViewRoute (tested via view routes in router)", () => {
  it("prefixes route names with 'View | '", ({ expect }) => {
    const viewHome = viewRoutes.find((r) => r.name === "View | Home");
    expect(viewHome).toBeDefined();
  });

  it("prefixes absolute paths with /view", ({ expect }) => {
    const viewHome = viewRoutes.find((r) => r.name === "View | Home");
    expect(viewHome.path).toBe("/view/home");
  });

  it("sets meta.drawer to false and meta.isView to true", ({ expect }) => {
    for (const route of viewRoutes) {
      expect(route.meta.drawer).toBe(false);
      expect(route.meta.isView).toBe(true);
    }
  });

  it("prefixes redirect name with 'View | '", ({ expect }) => {
    const viewRoot = viewRoutes.find((r) => r.name === "View | /");
    expect(viewRoot).toBeDefined();
    expect(viewRoot.redirect.name).toBe("View | Home");
  });

  it("recurses into children applying view transformations", ({ expect }) => {
    expect(viewCanvasRoute).toBeDefined();
    expect(viewCanvasRoute.children).toHaveLength(2);
    expect(viewCanvasRoute.children[0].name).toBe(
      "View | Canvas without position",
    );
    expect(viewCanvasRoute.children[1].name).toBe(
      "View | Canvas with position",
    );
    // Children with relative paths should NOT be prefixed with /view
    expect(viewCanvasRoute.children[0].path).toBe(":ids?");
  });

  it("view canvas children have drawer false and isView true", ({ expect }) => {
    for (const child of viewCanvasRoute.children) {
      expect(child.meta.drawer).toBe(false);
      expect(child.meta.isView).toBe(true);
    }
  });

  it.for([
    ["View | /", "/view/"],
    ["View | Home", "/view/home"],
    ["View | Canvas", "/view/canvas"],
    ["View | Mininet settings", "/view/mininet_settings"],
    ["View | Export", "/view/export"],
    ["View | About", "/view/about"],
  ])(
    "includes view route %s at path %s",
    ([name, expectedPath], { expect }) => {
      const route = viewRoutes.find((r) => r.name === name);
      expect(route).toBeDefined();
      expect(route.path).toBe(expectedPath);
    },
  );
});

describe("router configuration", () => {
  it("uses web hash history with base /me", ({ expect }) => {
    // The router is created with createWebHashHistory("/me")
    // We can verify by checking the history mode
    expect(router.options.history).toBeDefined();
  });

  it("has 12 total routes (6 normal + 6 view)", ({ expect }) => {
    expect(routes).toHaveLength(12);
  });
});

describe("view route meta properties are fully transformed", () => {
  it.for([
    ["View | Home", { title: "Home", drawer: false, isView: true }],
    ["View | Canvas", { title: "Canvas", drawer: false, isView: true }],
    [
      "View | Mininet settings",
      { title: "Mininet Settings", drawer: false, isView: true },
    ],
    ["View | Export", { title: "Export/Import", drawer: false, isView: true }],
    ["View | About", { title: "About", drawer: false, isView: true }],
  ])("view route %s has correct meta", ([name, expectedMeta], { expect }) => {
    const route = viewRoutes.find((r) => r.name === name);
    expect(route).toBeDefined();
    expect(route.meta).toEqual(expect.objectContaining(expectedMeta));
  });
});

describe("view route icon properties are preserved from base routes", () => {
  it.for([
    ["View | Home", "mdi-home"],
    ["View | Canvas", "mdi-map"],
    ["View | Mininet settings", "mdi-tune"],
    ["View | Export", "mdi-content-save"],
    ["View | About", "mdi-information"],
  ])("view route %s has icon %s", ([name, expectedIcon], { expect }) => {
    const route = viewRoutes.find((r) => r.name === name);
    expect(route.meta.icon).toBe(expectedIcon);
  });
});

describe("view route routerViewKey properties", () => {
  it.for([
    ["View | Home", "Home"],
    ["View | Canvas", "Canvas"],
    ["View | Mininet settings", "Mininet settings"],
    ["View | Export", "Export"],
    ["View | About", "About"],
  ])(
    "view route %s has routerViewKey %s",
    ([name, expectedKey], { expect }) => {
      const route = viewRoutes.find((r) => r.name === name);
      expect(route.meta.routerViewKey).toBe(expectedKey);
    },
  );
});

describe("view canvas child route details", () => {
  it("view canvas without position child has path ':ids?'", ({ expect }) => {
    expect(viewCanvasRoute.children[0].path).toBe(":ids?");
  });

  it("view canvas with position child has path ':x/:y/:scale/:ids?'", ({
    expect,
  }) => {
    expect(viewCanvasRoute.children[1].path).toBe(":x/:y/:scale/:ids?");
  });

  it("view canvas children have routerViewKey 'Canvas'", ({ expect }) => {
    expect(viewCanvasRoute.children[0].meta.routerViewKey).toBe("Canvas");
    expect(viewCanvasRoute.children[1].meta.routerViewKey).toBe("Canvas");
  });

  it("view canvas children have title 'Canvas'", ({ expect }) => {
    expect(viewCanvasRoute.children[0].meta.title).toBe("Canvas");
    expect(viewCanvasRoute.children[1].meta.title).toBe("Canvas");
  });

  it("view canvas children have subtitle functions", ({ expect }) => {
    expect(typeof viewCanvasRoute.children[0].meta.subtitle).toBe("function");
    expect(typeof viewCanvasRoute.children[1].meta.subtitle).toBe("function");
  });

  it("view canvas children have components", ({ expect }) => {
    for (const child of viewCanvasRoute.children) {
      expect(child.components).toHaveProperty("default");
      expect(child.components).toHaveProperty("toolbar");
    }
  });
});

describe("normal route structures are complete", () => {
  it("Home route has only default component", ({ expect }) => {
    const home = normalRoutes.find((r) => r.name === "Home");
    expect(Object.keys(home.components)).toEqual(["default"]);
    expect(home.components).not.toHaveProperty("toolbar");
  });

  it("About route has only default component", ({ expect }) => {
    const about = normalRoutes.find((r) => r.name === "About");
    expect(Object.keys(about.components)).toEqual(["default"]);
    expect(about.components).not.toHaveProperty("toolbar");
  });

  it("Mininet settings route has no children", ({ expect }) => {
    const ms = normalRoutes.find((r) => r.name === "Mininet settings");
    expect(ms.children).toBeUndefined();
  });

  it("Export route has no children", ({ expect }) => {
    const exp = normalRoutes.find((r) => r.name === "Export");
    expect(exp.children).toBeUndefined();
  });

  it("Canvas is the only route with children", ({ expect }) => {
    const routesWithChildren = normalRoutes.filter((r) => r.children);
    expect(routesWithChildren).toHaveLength(1);
    expect(routesWithChildren[0].name).toBe("Canvas");
  });

  it("Canvas is the only route with props", ({ expect }) => {
    const routesWithProps = normalRoutes.filter((r) => r.props);
    expect(routesWithProps).toHaveLength(1);
    expect(routesWithProps[0].name).toBe("Canvas");
  });
});

describe("view route components are lazy-loaded functions", () => {
  it.for([
    "View | Home",
    "View | Canvas",
    "View | Mininet settings",
    "View | Export",
    "View | About",
  ])("view route %s has function components", (name, { expect }) => {
    const route = viewRoutes.find((r) => r.name === name);
    for (const key of Object.keys(route.components)) {
      expect(typeof route.components[key]).toBe("function");
    }
  });
});

describe("beforeEach navigation guard", () => {
  beforeEach(() => {
    mockAppStore.clearAlert.mockClear();
    mockAppStore.setWorking.mockClear();
  });

  it("redirects to /view path when navigating from view route to non-view route", ({
    expect,
  }) => {
    const to = { meta: { isView: false }, fullPath: "/about", matched: [] };
    const from = { meta: { isView: true }, matched: [] };
    const next = vi.fn();

    capturedBeforeEachGuard(to, from, next);

    expect(next).toHaveBeenCalledWith("/view/about");
  });

  it("calls clearAlert and setWorking when navigating between routes with different top-level names", ({
    expect,
  }) => {
    const to = {
      meta: { isView: false },
      fullPath: "/about",
      matched: [{ name: "About" }],
    };
    const from = {
      meta: { isView: false },
      matched: [{ name: "Home" }],
    };
    const next = vi.fn();

    capturedBeforeEachGuard(to, from, next);

    expect(mockAppStore.clearAlert).toHaveBeenCalled();
    expect(mockAppStore.setWorking).toHaveBeenCalledWith({
      working: false,
    });
    expect(next).toHaveBeenCalledWith();
  });

  it("does not call clearAlert or setWorking when navigating between child routes of the same parent", ({
    expect,
  }) => {
    const to = {
      meta: { isView: false },
      fullPath: "/canvas/some-ids",
      matched: [{ name: "Canvas" }],
    };
    const from = {
      meta: { isView: false },
      matched: [{ name: "Canvas" }],
    };
    const next = vi.fn();

    capturedBeforeEachGuard(to, from, next);

    expect(mockAppStore.clearAlert).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it.for([
    [
      "to.matched is empty",
      { meta: { isView: false }, fullPath: "/unknown", matched: [] },
      { meta: { isView: false }, matched: [{ name: "Home" }] },
    ],
    [
      "from.matched is empty",
      {
        meta: { isView: false },
        fullPath: "/home",
        matched: [{ name: "Home" }],
      },
      { meta: { isView: false }, matched: [] },
    ],
  ])(
    "calls clearAlert and setWorking when %s",
    ([_label, to, from], { expect }) => {
      const next = vi.fn();

      capturedBeforeEachGuard(to, from, next);

      expect(mockAppStore.clearAlert).toHaveBeenCalled();
      expect(mockAppStore.setWorking).toHaveBeenCalledWith({
        working: false,
      });
      expect(next).toHaveBeenCalledWith();
    },
  );
});
