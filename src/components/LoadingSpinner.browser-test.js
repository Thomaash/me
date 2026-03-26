import { describe, it } from "vitest";
import { mountWithVuetify } from "../test-utils/browser-setup.js";
import LoadingSpinner from "@/components/LoadingSpinner.vue";

describe.concurrent("LoadingSpinner", () => {
  it("mounts successfully in Vuetify context", ({ expect }) => {
    const wrapper = mountWithVuetify(LoadingSpinner);

    expect(wrapper.exists()).toBe(true);
  });

  it("renders a v-progress-circular element with indeterminate prop", ({ expect }) => {
    const wrapper = mountWithVuetify(LoadingSpinner);

    const progressCircular = wrapper.findComponent({
      name: "VProgressCircular",
    });
    expect(progressCircular.exists()).toBe(true);
    expect(progressCircular.props("indeterminate")).toBe(true);
  });

  it("has CSS class loading-spinner and is visible in the DOM", ({ expect }) => {
    const wrapper = mountWithVuetify(LoadingSpinner);

    const spinner = wrapper.find(".loading-spinner");
    expect(spinner.exists()).toBe(true);
    expect(spinner.isVisible()).toBe(true);
  });
});
