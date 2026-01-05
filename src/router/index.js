import { createRouter, createWebHashHistory } from "vue-router";
import { store } from "@/store";

function selectionTitleSuffix(ids) {
  if (!ids) {
    return "";
  }

  const length = ids.split(",").length;
  return ` with ${length} selected item${length === 1 ? "" : "s"}`;
}

function createRoutes(mapper = (v) => v) {
  return [
    {
      path: "/",
      name: "/",
      redirect: { name: "Home" },
    },
    {
      path: "/home",
      name: "Home",
      meta: {
        title: "Home",
        drawer: true,
        icon: "mdi-home",
        routerViewKey: "Home",
      },
      components: {
        default: () =>
          import(/* webpackPrefetch: true */ "@/components/HomePage.vue"),
      },
    },
    {
      path: "/canvas",
      name: "Canvas",
      meta: {
        title: "Canvas",
        drawer: true,
        icon: "mdi-map",
        routerViewKey: "Canvas",
      },
      components: {
        default: () =>
          import(/* webpackPrefetch: true */ "@/components/CanvasPage.vue"),
        toolbar: () =>
          import(
            /* webpackPrefetch: true */ "@/components/TopologyToolbar.vue"
          ),
      },
      props: {
        toolbar: {
          undoRedo: true,
        },
      },
      children: [
        {
          path: ":ids?",
          name: "Canvas without position",
          meta: {
            title: "Canvas",
            subtitle(to) {
              return selectionTitleSuffix(to.params.ids);
            },
            routerViewKey: "Canvas",
          },
          components: {
            default: () =>
              import(/* webpackPrefetch: true */ "@/components/CanvasPage.vue"),
            toolbar: () =>
              import(
                /* webpackPrefetch: true */ "@/components/TopologyToolbar.vue"
              ),
          },
        },
        {
          path: ":x/:y/:scale/:ids?",
          name: "Canvas with position",
          meta: {
            title: "Canvas",
            subtitle(to) {
              const { x, y, scale, ids } = to.params;
              return ` at position ${x}\u{a0}×\u{a0}${y} scaled to ${(
                scale * 100
              ).toFixed(0)}\u{a0}%${selectionTitleSuffix(ids)}`;
            },
            routerViewKey: "Canvas",
          },
          components: {
            default: () =>
              import(/* webpackPrefetch: true */ "@/components/CanvasPage.vue"),
            toolbar: () =>
              import(
                /* webpackPrefetch: true */ "@/components/TopologyToolbar.vue"
              ),
          },
        },
      ],
    },
    {
      path: "/mininet_settings",
      name: "Mininet settings",
      meta: {
        title: "Mininet Settings",
        drawer: true,
        icon: "mdi-tune",
        routerViewKey: "Mininet settings",
      },
      components: {
        default: () =>
          import(
            /* webpackPrefetch: true */ "@/components/MininetSettingsPage.vue"
          ),
        toolbar: () =>
          import(
            /* webpackPrefetch: true */ "@/components/TopologyToolbar.vue"
          ),
      },
    },
    {
      path: "/export",
      name: "Export",
      meta: {
        title: "Export/Import",
        drawer: true,
        icon: "mdi-content-save",
        routerViewKey: "Export",
      },
      components: {
        default: () =>
          import(/* webpackPrefetch: true */ "@/components/ExportPage.vue"),
        toolbar: () =>
          import(
            /* webpackPrefetch: true */ "@/components/TopologyToolbar.vue"
          ),
      },
    },
    {
      path: "/profile",
      name: "Profile",
      meta: {
        title: "Profile",
        drawer: true,
        icon: "mdi-account",
        routerViewKey: "Profile",
      },
      components: {
        default: () => import(/* webpackPrefetch: true */ "@/components/ProfilePage.vue"),
      },
    },
    {
      path: "/about",
      name: "About",
      meta: {
        title: "About",
        drawer: true,
        icon: "mdi-information",
        routerViewKey: "About",
      },
      components: {
        default: () =>
          import(/* webpackPrefetch: true */ "@/components/AboutPage.vue"),
      },
    },
  ].map(mapper);
}

function createNormalRoute(route) {
  if (route.meta == null) {
    route.meta = {};
  }
  route.meta.isView = false;

  if (route.children != null) {
    route.children = route.children.map(createNormalRoute);
  }

  return route;
}

function createViewRoute(route) {
  route.name = `View | ${route.name}`;

  if (route.path.startsWith("/")) {
    route.path = `/view${route.path}`;
  }

  if (route.meta == null) {
    route.meta = {};
  }
  route.meta.drawer = false;
  route.meta.isView = true;

  if (route.redirect != null) {
    route.redirect.name = `View | ${route.redirect.name}`;
  }

  if (route.children != null) {
    route.children = route.children.map(createViewRoute);
  }

  return route;
}

const routes = [
  ...createRoutes(createNormalRoute),
  ...createRoutes(createViewRoute),
];

export const router = createRouter({
  routes,
  history: createWebHashHistory("/me"),
});

router.beforeEach((to, from, next) => {
  // Stay in view mode
  if (!to.meta.isView && from.meta.isView) {
    return next(`/view${to.fullPath}`);
  }

  // Clear the alert and working state if changing between routes
  // but not if they are child routes with the same parent.
  if (
    to.matched.length === 0 ||
    from.matched.length === 0 ||
    to.matched[0].name !== from.matched[0].name
  ) {
    store.commit("clearAlert");
    store.commit("setWorking", { working: false });
  }

  next();
});
