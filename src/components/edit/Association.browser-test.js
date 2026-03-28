import { describe, it } from "vitest";
import { nextTick } from "vue";
import { mountWithVuetify } from "../../test-utils/browser-setup.js";
import Association from "@/components/edit/Association.vue";

function mountAssociation(modelValue = { hostname: "assoc1" }) {
  return mountWithVuetify(Association, {
    props: { modelValue },
  });
}

describe.concurrent("Association (edit)", () => {
  it("mounts successfully in Vuetify context", ({ expect }) => {
    const wrapper = mountAssociation();

    expect(wrapper.exists()).toBe(true);
  });

  it("renders a v-form with a Label text field with data-cy edit-hostname", ({ expect }) => {
    const wrapper = mountAssociation();

    const form = wrapper.findComponent({ name: "VForm" });
    expect(form.exists()).toBe(true);

    const hostnameEl = wrapper.find("[data-cy='edit-hostname']");
    expect(hostnameEl.exists()).toBe(true);

    const textField = wrapper.findComponent({ name: "VTextField" });
    expect(textField.exists()).toBe(true);
    expect(textField.props("label")).toBe("Label");
  });

  it("typing updates item.hostname via modelValue binding", async ({ expect }) => {
    const wrapper = mountAssociation({ hostname: "initial" });

    await nextTick();

    const textField = wrapper.findComponent({ name: "VTextField" });
    expect(textField.props("modelValue")).toBe("initial");

    await textField.setValue("updated");
    await nextTick();

    expect(textField.props("modelValue")).toBe("updated");
  });
});
