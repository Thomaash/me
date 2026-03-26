import { describe, it } from "vitest";
import { nextTick } from "vue";
import { mountWithVuetify } from "../../test-utils/browser-setup.js";
import Dummy from "@/components/edit/Dummy.vue";

function mountDummy(modelValue = { hostname: "test" }) {
  return mountWithVuetify(Dummy, {
    props: { modelValue },
  });
}

describe.concurrent("Dummy (edit)", () => {
  it("mounts successfully in Vuetify context", ({ expect }) => {
    const wrapper = mountDummy();

    expect(wrapper.exists()).toBe(true);
  });

  it("renders a v-form with a v-textarea labeled Label and data-cy edit-hostname", ({ expect }) => {
    const wrapper = mountDummy();

    const form = wrapper.findComponent({ name: "VForm" });
    expect(form.exists()).toBe(true);

    const textarea = wrapper.findComponent({ name: "VTextarea" });
    expect(textarea.exists()).toBe(true);
    expect(textarea.props("label")).toBe("Label");

    const textareaEl = wrapper.find("[data-cy='edit-hostname']");
    expect(textareaEl.exists()).toBe(true);
  });

  it("emits valid event on mount", async ({ expect }) => {
    const wrapper = mountDummy();

    await nextTick();

    expect(wrapper.emitted("valid")).toBeTruthy();
  });
});
