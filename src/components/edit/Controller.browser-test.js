import { describe, it } from "vitest";
import { nextTick } from "vue";
import { mountWithVuetify } from "../../test-utils/browser-setup.js";
import Controller from "@/components/edit/Controller.vue";

function mountController(modelValue = { hostname: "c0", controllerType: "RemoteController" }) {
  return mountWithVuetify(Controller, {
    props: { modelValue },
  });
}

describe.concurrent("Controller (edit)", () => {
  it("mounts successfully in Vuetify context", ({ expect }) => {
    const wrapper = mountController();

    expect(wrapper.exists()).toBe(true);
  });

  it("renders a v-form with Label (required, hostname validated), IP, and Port fields", ({ expect }) => {
    const wrapper = mountController();

    const form = wrapper.findComponent({ name: "VForm" });
    expect(form.exists()).toBe(true);

    const textFields = wrapper.findAllComponents({ name: "VTextField" });
    const labels = textFields.map((tf) => tf.props("label"));

    expect(labels).toContain("Label");
    expect(labels).toContain("IP");
    expect(labels).toContain("Port");

    const labelField = textFields.find((tf) => tf.props("label") === "Label");
    const rules = labelField.props("rules");
    expect(rules).toBeDefined();
    expect(rules.length).toBe(2);

    const hostnameEl = wrapper.find("[data-cy='edit-hostname']");
    expect(hostnameEl.exists()).toBe(true);
  });

  it("renders Type select with controller types and Protocol select", ({ expect }) => {
    const wrapper = mountController();

    const typeCol = wrapper.find("[data-cy='edit-controller-type']");
    expect(typeCol.exists()).toBe(true);

    const selects = wrapper.findAllComponents({ name: "VSelect" });
    const typeSelect = selects.find((s) => s.props("label") === "Type");
    expect(typeSelect).toBeDefined();

    const typeItems = typeSelect.props("items");
    expect(typeItems.length).toBe(5);
    const typeValues = typeItems.map((item) => item.value);
    expect(typeValues).toContain("RemoteController");
    expect(typeValues).toContain("OVSController");

    const protocolSelect = selects.find((s) => s.props("label") === "Protocol");
    expect(protocolSelect).toBeDefined();

    const protocolItems = protocolSelect.props("items");
    const protocolValues = protocolItems.map((item) => item.value);
    expect(protocolValues).toContain("tcp");
    expect(protocolValues).toContain("ssl");
  });

  it("emits valid and new-item events on mount via common mixin lifecycle", async ({ expect }) => {
    const wrapper = mountController();

    await nextTick();

    expect(wrapper.emitted("valid")).toBeTruthy();
    expect(wrapper.emitted("new-item")).toBeTruthy();
    expect(wrapper.emitted("new-item")[0][0]).toEqual({
      hostname: "c0",
      controllerType: "RemoteController",
    });
  });

  it("syncs internal item when modelValue prop changes", async ({ expect }) => {
    const initial = { hostname: "c0", controllerType: "RemoteController" };
    const wrapper = mountController(initial);

    const updated = { hostname: "c1", controllerType: "OVSController", ip: "10.0.0.1" };
    await wrapper.setProps({ modelValue: updated });

    const emitted = wrapper.emitted("update:modelValue");
    expect(emitted).toBeTruthy();
    const lastEmission = emitted[emitted.length - 1][0];
    expect(lastEmission).toEqual(updated);
  });

  it("emits valid event when form validity changes", async ({ expect }) => {
    const wrapper = mountController({ hostname: "c0", controllerType: "RemoteController" });

    await nextTick();

    const validEvents = wrapper.emitted("valid");
    expect(validEvents).toBeTruthy();
    expect(validEvents.length).toBeGreaterThanOrEqual(1);
  });

  it("updates item fields through child component v-model events", async ({ expect }) => {
    const wrapper = mountController({
      hostname: "c0",
      controllerType: "RemoteController",
      ip: "",
      port: null,
      protocol: null,
    });

    await nextTick();

    const textFields = wrapper.findAllComponents({ name: "VTextField" });
    const hostnameField = textFields.find((tf) => tf.props("label") === "Label");
    const ipField = textFields.find((tf) => tf.props("label") === "IP");
    const portField = textFields.find((tf) => tf.props("label") === "Port");

    await hostnameField.setValue("c1");
    await nextTick();
    const afterHostname = wrapper.emitted("update:modelValue");
    expect(afterHostname[afterHostname.length - 1][0].hostname).toBe("c1");

    await ipField.setValue("10.0.0.1");
    await nextTick();
    const afterIp = wrapper.emitted("update:modelValue");
    expect(afterIp[afterIp.length - 1][0].ip).toBe("10.0.0.1");

    await portField.setValue(6653);
    await nextTick();
    const afterPort = wrapper.emitted("update:modelValue");
    expect(afterPort[afterPort.length - 1][0].port).toBe(6653);

    const selects = wrapper.findAllComponents({ name: "VSelect" });
    const typeSelect = selects.find((s) => s.props("label") === "Type");
    const protocolSelect = selects.find((s) => s.props("label") === "Protocol");

    await typeSelect.setValue("OVSController");
    await nextTick();
    const afterType = wrapper.emitted("update:modelValue");
    expect(afterType[afterType.length - 1][0].controllerType).toBe("OVSController");

    await protocolSelect.setValue("tcp");
    await nextTick();
    const afterProtocol = wrapper.emitted("update:modelValue");
    expect(afterProtocol[afterProtocol.length - 1][0].protocol).toBe("tcp");
  });
});
