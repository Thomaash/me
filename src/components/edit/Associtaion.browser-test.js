import { describe, it } from "vitest";
import { nextTick } from "vue";
import { mountWithVuetify } from "../../test-utils/browser-setup.js";
import Associtaion from "@/components/edit/Associtaion.vue";

function mountAssocitaion(modelValue = { hostname: "assoc1" }) {
  return mountWithVuetify(Associtaion, {
    props: { modelValue },
  });
}

describe.concurrent("Associtaion (edit)", () => {
  it("mounts successfully in Vuetify context", ({ expect }) => {
    const wrapper = mountAssocitaion();

    expect(wrapper.exists()).toBe(true);
  });

  it("renders a v-form with a Label text field with data-cy edit-hostname", ({ expect }) => {
    const wrapper = mountAssocitaion();

    const form = wrapper.findComponent({ name: "VForm" });
    expect(form.exists()).toBe(true);

    const hostnameEl = wrapper.find("[data-cy='edit-hostname']");
    expect(hostnameEl.exists()).toBe(true);

    const textField = wrapper.findComponent({ name: "VTextField" });
    expect(textField.exists()).toBe(true);
    expect(textField.props("label")).toBe("Label");
  });

  it("typing updates item.hostname via modelValue binding", async ({ expect }) => {
    const wrapper = mountAssocitaion({ hostname: "initial" });

    await nextTick();

    const textField = wrapper.findComponent({ name: "VTextField" });
    expect(textField.props("modelValue")).toBe("initial");

    await textField.setValue("updated");
    await nextTick();

    const emitted = wrapper.emitted("update:modelValue");
    expect(emitted).toBeTruthy();
    const lastEmission = emitted[emitted.length - 1][0];
    expect(lastEmission.hostname).toBe("updated");
  });
});
