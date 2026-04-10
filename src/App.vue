<template>
  <v-app>
    <template v-if="isView !== true">
      <v-app-bar color="primary" theme="dark" extension-height="7">
        <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
        <v-toolbar-title
          style="font-weight: 300; font-size: 24px; letter-spacing: unset"
          >{{ appName }}</v-toolbar-title
        >

        <v-spacer />

        <router-view v-slot="{ Component, route }" name="toolbar">
          <v-slide-y-transition mode="out-in">
            <component :is="Component" :key="route.meta.routerViewKey" />
          </v-slide-y-transition>
        </router-view>

        <template #extension>
          <v-progress-linear
            v-show="progress.show"
            :indeterminate="progress.indeterminate === true"
            :model-value="progress.value"
            class="ma-0"
            color="accent"
          />

          <v-alert
            v-model="showAlert"
            :type="alert.type"
            closable
            class="mt-0 alert"
            transition="slide-y-transition"
          >
            {{ alert.text }}
          </v-alert>
        </template>
      </v-app-bar>

      <v-navigation-drawer v-model="drawer" persistent>
        <v-list>
          <v-list-item
            v-for="item in drawerItems"
            :key="item.to.name"
            :value="item.to.name"
            :to="item.to"
            :data-cy="`drawer-${item.to.name.toLowerCase().replace(' ', '-')}`"
            color="primary"
          >
            <template #prepend>
              <v-icon>{{ item.icon }}</v-icon>
            </template>
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-navigation-drawer>
    </template>

    <v-main>
      <router-view v-slot="{ Component, route }">
        <v-slide-y-transition mode="out-in">
          <component :is="Component" :key="route.meta.routerViewKey" />
        </v-slide-y-transition>
      </router-view>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAppStore } from "@/store/appStore";

const appStore = useAppStore();
const route = useRoute();
const router = useRouter();

const drawer = ref(true);
const appName = "Mininet Editor";

const documentTitle = computed(() => {
  const { title, subtitle } = route.meta;
  const subtitleStr = subtitle ? subtitle(route) : "";
  return `${appName} | ${title}${subtitleStr}`;
});

const drawerItems = computed(() =>
  router.options.routes
    .filter((r) => r.meta && r.meta.drawer)
    .map(({ name, meta }) => ({
      title: meta.title,
      icon: meta.icon,
      to: { name },
    })),
);

const progress = computed(() => {
  const working = appStore.working;
  return {
    show: !!working,
    indeterminate: working === true,
    value:
      working.curr != null && working.max != null
        ? (working.curr / working.max) * 100
        : 0,
  };
});

const alert = computed(() => appStore.alert);

const showAlert = computed({
  get() {
    return alert.value.show;
  },
  set(value) {
    if (value === false) {
      appStore.clearAlert();
    }
  },
});

const isView = computed(() => route.meta.isView);

watch(
  documentTitle,
  (newTitle) => {
    document.title = newTitle;
  },
  { immediate: true },
);
</script>

<style>
@layer vuetify-core {
  :root {
    font-family: "Source Sans 3", "Roboto", sans-serif;
  }
}

html::-webkit-scrollbar {
  width: 0px !important;
}
::selection {
  background: #80cbc4;
}

section {
  margin-bottom: 3em;
}
section > h1,
section > h2,
section > h3,
section > h4,
section > h5,
section > h6 {
  margin-bottom: 16px;
}

.monospace {
  font-family: "Source Code Pro", monospace !important;
}
kbd {
  font-family: "Source Code Pro", monospace !important;
  font-weight: normal;
}
.monospace-input input,
.monospace-input textarea {
  font-family: "Source Code Pro", monospace !important;
}

.v-toolbar__extension {
  position: relative;
  padding: 0px;
}
</style>

<style scoped>
.alert {
  position: absolute;
  top: 7px;
  left: 0px;
  right: 0px;
  z-index: -1;
}
</style>
