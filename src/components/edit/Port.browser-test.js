import { describe, it } from "vitest";
import { nextTick } from "vue";
import { mountWithVuetify } from "../../test-utils/browser-setup.js";
import Port from "@/components/edit/Port.vue";

function mountPort(modelValue = { hostname: "eth0", ips: ["10.0.0.1/24"] }) {
  return mountWithVuetify(Port, {
    props: { modelValue },
  });
}

describe.concurrent("Port (edit)", () => {
  it("mounts successfully in Vuetify context", ({ expect }) => {
    const wrapper = mountPort();

    expect(wrapper.exists()).toBe(true);
  });

  it("renders a v-form with a required Dev Name field and IPs textarea", ({ expect }) => {
    const wrapper = mountPort();

    const form = wrapper.findComponent({ name: "VForm" });
    expect(form.exists()).toBe(true);

    const hostnameEl = wrapper.find("[data-cy='edit-hostname']");
    expect(hostnameEl.exists()).toBe(true);

    const textFields = wrapper.findAllComponents({ name: "VTextField" });
    const devNameField = textFields.find((tf) => tf.props("label") === "Dev Name");
    expect(devNameField).toBeDefined();

    const rules = devNameField.props("rules");
    expect(rules).toBeDefined();
    expect(rules.length).toBe(2);

    const ipsEl = wrapper.find("[data-cy='edit-ips']");
    expect(ipsEl.exists()).toBe(true);

    const textarea = wrapper.findComponent({ name: "VTextarea" });
    expect(textarea.exists()).toBe(true);
    expect(textarea.props("label")).toBe("IPs");
  });

  it("renders a Physical switch toggle", ({ expect }) => {
    const wrapper = mountPort();

    const physicalCol = wrapper.find("[data-cy='edit-physical']");
    expect(physicalCol.exists()).toBe(true);

    const switchToggle = wrapper.findComponent({ name: "VSwitch" });
    expect(switchToggle.exists()).toBe(true);
    expect(switchToggle.props("label")).toBe("Physical");
  });

  it("displays ips as newline-joined text in textarea and preserves trailing newline", async ({ expect }) => {
    const wrapper = mountPort({ hostname: "eth0", ips: ["10.0.0.1/24", "192.168.1.1/16"] });

    await nextTick();

    const textarea = wrapper.findComponent({ name: "VTextarea" });
    expect(textarea.props("modelValue")).toBe("10.0.0.1/24\n192.168.1.1/16");

    await textarea.setValue("10.0.0.1/24\n192.168.1.1/16\n");
    await nextTick();

    expect(textarea.props("modelValue")).toBe("10.0.0.1/24\n192.168.1.1/16\n");
  });

  it("splits textarea text into ips array via emitted events and tracks trailing newline", async ({ expect }) => {
    const wrapper = mountPort({ hostname: "eth0", ips: [] });

    await nextTick();

    const textarea = wrapper.findComponent({ name: "VTextarea" });

    await textarea.setValue("10.0.0.1/24\n192.168.1.1/16");
    await nextTick();

    const afterTwo = wrapper.emitted("update:modelValue");
    expect(afterTwo[afterTwo.length - 1][0].ips).toEqual(["10.0.0.1/24", "192.168.1.1/16"]);
    expect(textarea.props("modelValue")).toBe("10.0.0.1/24\n192.168.1.1/16");

    await textarea.setValue("10.0.0.1/24\n");
    await nextTick();

    const afterTrailing = wrapper.emitted("update:modelValue");
    expect(afterTrailing[afterTrailing.length - 1][0].ips).toEqual(["10.0.0.1/24"]);
    expect(textarea.props("modelValue")).toBe("10.0.0.1/24\n");

    await textarea.setValue(null);
    await nextTick();

    const afterNull = wrapper.emitted("update:modelValue");
    expect(afterNull[afterNull.length - 1][0]).not.toHaveProperty("ips");
    expect(textarea.props("modelValue")).toBe("");
  });

  it("deletes physical property from item when physical switch is set to false", async ({ expect }) => {
    const wrapper = mountPort({ hostname: "eth0", ips: ["10.0.0.1/24"], physical: true });

    await nextTick();

    const switchToggle = wrapper.findComponent({ name: "VSwitch" });
    expect(switchToggle.props("modelValue")).toBe(true);

    await switchToggle.setValue(false);
    await nextTick();

    const emitted = wrapper.emitted("update:modelValue");
    expect(emitted).toBeTruthy();
    const lastEmission = emitted[emitted.length - 1][0];
    expect(lastEmission).not.toHaveProperty("physical");
  });

  it("emits valid and new-item events on mount via common mixin lifecycle", async ({ expect }) => {
    const wrapper = mountPort();

    await nextTick();

    expect(wrapper.emitted("valid")).toBeTruthy();
    expect(wrapper.emitted("new-item")).toBeTruthy();
    expect(wrapper.emitted("new-item")[0][0]).toEqual({ hostname: "eth0", ips: ["10.0.0.1/24"] });
  });

  it("syncs internal item when modelValue prop changes via common mixin watcher", async ({ expect }) => {
    const wrapper = mountPort();

    const updated = { hostname: "eth1", ips: ["172.16.0.1/12"] };
    await wrapper.setProps({ modelValue: updated });
    await nextTick();

    const emitted = wrapper.emitted("update:modelValue");
    expect(emitted).toBeTruthy();
    const lastEmission = emitted[emitted.length - 1][0];
    expect(lastEmission).toEqual(updated);
  });
});
