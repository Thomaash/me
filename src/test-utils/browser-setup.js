import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import "vuetify/styles";

/**
 * Mount a Vue component with Vuetify plugin configured.
 * Shared helper for all browser component tests.
 *
 * @param {object} component - Vue component to mount
 * @param {object} [options={}] - Additional @vue/test-utils mount options
 * @returns {import("@vue/test-utils").VueWrapper} Mounted wrapper
 */
export function mountWithVuetify(component, options = {}) {
  const vuetify = createVuetify();

  return mount(component, {
    global: {
      plugins: [vuetify],
      ...options.global,
    },
    ...Object.fromEntries(
      Object.entries(options).filter(([key]) => key !== "global"),
    ),
  });
}
