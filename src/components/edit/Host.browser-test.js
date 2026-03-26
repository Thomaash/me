import { describe, it } from "vitest";
import { nextTick } from "vue";
import { mountWithVuetify } from "../../test-utils/browser-setup.js";
import Host from "@/components/edit/Host.vue";

function mountHost(modelValue = { hostname: "test" }) {
  return mountWithVuetify(Host, {
    props: { modelValue },
  });
}

describe.concurrent("Host (edit)", () => {
  it("mounts successfully in Vuetify context", ({ expect }) => {
    const wrapper = mountHost();

    expect(wrapper.exists()).toBe(true);
  });

  it("renders a v-form with Hostname, Default Route, and other host-specific fields", ({ expect }) => {
    const wrapper = mountHost();

    const form = wrapper.findComponent({ name: "VForm" });
    expect(form.exists()).toBe(true);

    const textFields = wrapper.findAllComponents({ name: "VTextField" });
    const labels = textFields.map((tf) => tf.props("label"));

    expect(labels).toContain("Hostname");
    expect(labels).toContain("Default Route");
    expect(labels).toContain("CPU Utilization Limit");
    expect(labels).toContain("CPU cores");

    const hostnameField = wrapper.find("[data-cy='edit-hostname']");
    expect(hostnameField.exists()).toBe(true);

    const defaultRouteField = wrapper.find("[data-cy='edit-default-route']");
    expect(defaultRouteField.exists()).toBe(true);
  });

  it("enforces validation on the Hostname field with required and hostname rules", ({ expect }) => {
    const wrapper = mountHost({ hostname: "" });

    const textFields = wrapper.findAllComponents({ name: "VTextField" });
    const hostnameField = textFields.find((tf) => tf.props("label") === "Hostname");

    expect(hostnameField).toBeDefined();
    const rules = hostnameField.props("rules");
    expect(rules).toBeDefined();
    expect(rules.length).toBe(2);
  });

  it("renders Startup Script and Shutdown Script textareas", ({ expect }) => {
    const wrapper = mountHost({
      hostname: "h1",
      startScript: "#!/bin/bash\necho start",
      stopScript: "#!/bin/bash\necho stop",
    });

    const textareas = wrapper.findAllComponents({ name: "VTextarea" });
    const labels = textareas.map((ta) => ta.props("label"));

    expect(labels).toContain("Startup Script");
    expect(labels).toContain("Shutdown Script");

    const startField = wrapper.find("[data-cy='edit-start-script']");
    expect(startField.exists()).toBe(true);

    const stopField = wrapper.find("[data-cy='edit-stop-script']");
    expect(stopField.exists()).toBe(true);
  });

  it("computes cpuCoresStr getter as comma-separated string from cpuCores array", async ({ expect }) => {
    const wrapper = mountHost({
      hostname: "h1",
      cpuCores: [0, 2, 4],
    });

    await nextTick();

    const textFields = wrapper.findAllComponents({ name: "VTextField" });
    const cpuCoresField = textFields.find((tf) => tf.props("label") === "CPU cores");
    expect(cpuCoresField.props("modelValue")).toBe("0, 2, 4");
  });

  it("returns empty string from cpuCoresStr getter when cpuCores is undefined", async ({ expect }) => {
    const wrapper = mountHost({ hostname: "h1" });

    await nextTick();

    const textFields = wrapper.findAllComponents({ name: "VTextField" });
    const cpuCoresField = textFields.find((tf) => tf.props("label") === "CPU cores");
    expect(cpuCoresField.props("modelValue")).toBe("");
  });

  it("parses cpuCoresStr setter into deduplicated numeric array", async ({ expect }) => {
    const wrapper = mountHost({ hostname: "h1", cpuCores: [] });

    await nextTick();

    const textFields = wrapper.findAllComponents({ name: "VTextField" });
    const cpuCoresField = textFields.find((tf) => tf.props("label") === "CPU cores");
    await cpuCoresField.setValue("1, 2, 3, 2");
    await nextTick();

    const emitted = wrapper.emitted("update:modelValue");
    expect(emitted).toBeTruthy();
    const lastEmission = emitted[emitted.length - 1][0];
    expect(lastEmission.cpuCores).toEqual([1, 2, 3]);
  });

  it("preserves trailing comma in cpuCoresStr display when input ends with comma", async ({ expect }) => {
    const wrapper = mountHost({ hostname: "h1", cpuCores: [] });

    await nextTick();

    const textFields = wrapper.findAllComponents({ name: "VTextField" });
    const cpuCoresField = textFields.find((tf) => tf.props("label") === "CPU cores");
    await cpuCoresField.setValue("1, 2, ");
    await nextTick();

    expect(cpuCoresField.props("modelValue")).toBe("1, 2, ");
  });

  it("clears cpuCores when cpuCoresStr field is cleared", async ({ expect }) => {
    const wrapper = mountHost({ hostname: "h1", cpuCores: [1, 2] });

    await nextTick();

    const textFields = wrapper.findAllComponents({ name: "VTextField" });
    const cpuCoresField = textFields.find((tf) => tf.props("label") === "CPU cores");
    await cpuCoresField.setValue(null);
    await nextTick();

    const emitted = wrapper.emitted("update:modelValue");
    expect(emitted).toBeTruthy();
    const lastEmission = emitted[emitted.length - 1][0];
    expect(lastEmission).not.toHaveProperty("cpuCores");
    expect(cpuCoresField.props("modelValue")).toBe("");
  });

  it("emits valid and new-item events on mount via common mixin lifecycle", async ({ expect }) => {
    const wrapper = mountHost({ hostname: "h1" });

    await nextTick();

    expect(wrapper.emitted("valid")).toBeTruthy();
    expect(wrapper.emitted("new-item")).toBeTruthy();
    expect(wrapper.emitted("new-item")[0][0]).toEqual({ hostname: "h1" });
  });

  it("syncs internal item when modelValue prop changes via common mixin watcher", async ({ expect }) => {
    const wrapper = mountHost({ hostname: "h1" });

    const updated = { hostname: "h2", cpuCores: [0, 1] };
    await wrapper.setProps({ modelValue: updated });

    const emitted = wrapper.emitted("update:modelValue");
    expect(emitted).toBeTruthy();
    const lastEmission = emitted[emitted.length - 1][0];
    expect(lastEmission).toEqual(updated);
  });

  it("emits valid event when form validity changes via common mixin watcher", async ({ expect }) => {
    const wrapper = mountHost({ hostname: "h1" });

    await nextTick();

    const validEvents = wrapper.emitted("valid");
    expect(validEvents).toBeTruthy();
    expect(validEvents.length).toBeGreaterThanOrEqual(1);
  });
});
