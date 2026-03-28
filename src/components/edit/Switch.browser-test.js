import { describe, it } from "vitest";
import { nextTick } from "vue";
import { mountWithVuetify } from "../../test-utils/browser-setup.js";
import Switch from "@/components/edit/Switch.vue";
import ThreeStateCheckbox from "@/components/ThreeStateCheckbox.vue";

function fullSwitchModel() {
  return {
    hostname: "s1",
    switchType: "OVSSwitch",
    stp: true,
    stpPriority: 4096,
    ip: "10.0.0.1",
    dpctlPort: 6634,
    protocol: "OpenFlow13",
    datapath: "kernel",
    dpid: "0000000000000001",
    dpopts: "--some-opt",
    reconnectms: 5000,
    failMode: "secure",
    inband: true,
    inNamespace: false,
    batch: true,
    verbose: false,
    opts: "--extra",
    startScript: "echo start",
    stopScript: "echo stop",
  };
}

function mountSwitch(modelValue = { hostname: "test", switchType: "OVSSwitch" }) {
  return mountWithVuetify(Switch, {
    props: { modelValue },
  });
}

describe.concurrent("Switch (edit)", () => {
  it("mounts successfully in Vuetify context", ({ expect }) => {
    const wrapper = mountSwitch();

    expect(wrapper.exists()).toBe(true);
  });

  it("renders a v-form with a required Hostname text field", ({ expect }) => {
    const wrapper = mountSwitch();

    const form = wrapper.findComponent({ name: "VForm" });
    expect(form.exists()).toBe(true);

    const hostnameField = wrapper.find("[data-cy='edit-hostname']");
    expect(hostnameField.exists()).toBe(true);

    const textFields = wrapper.findAllComponents({ name: "VTextField" });
    const hostnameTextField = textFields.find((tf) => tf.props("label") === "Hostname");
    expect(hostnameTextField).toBeDefined();

    const rules = hostnameTextField.props("rules");
    expect(rules).toBeDefined();
    expect(rules.length).toBe(2);
  });

  it("renders a Type select with switch type options", ({ expect }) => {
    const wrapper = mountSwitch();

    const switchTypeCol = wrapper.find("[data-cy='edit-switch-type']");
    expect(switchTypeCol.exists()).toBe(true);

    const selects = wrapper.findAllComponents({ name: "VSelect" });
    const typeSelect = selects.find((s) => s.props("label") === "Type");
    expect(typeSelect).toBeDefined();

    const items = typeSelect.props("items");
    expect(items.length).toBe(5);

    const values = items.map((item) => item.value);
    expect(values).toContain("OVSSwitch");
    expect(values).toContain("OVSBridge");
    expect(values).toContain("LinuxBridge");
  });

  it("renders IP, DPCTL Port, Datapath ID, Ofdatapath arguments, Reconnect Timeout, opts, and script fields", ({ expect }) => {
    const wrapper = mountSwitch(fullSwitchModel());

    const textFields = wrapper.findAllComponents({ name: "VTextField" });
    const labels = textFields.map((tf) => tf.props("label"));

    expect(labels).toContain("IP");
    expect(labels).toContain("DPCTL Port");
    expect(labels).toContain("Datapath ID");
    expect(labels).toContain("Ofdatapath arguments");
    expect(labels).toContain("Reconnect Timeout");
    expect(labels).toContain("STP Priority");
    expect(labels).toContain("Additional Switch Options");

    const textareas = wrapper.findAllComponents({ name: "VTextarea" });
    const textareaLabels = textareas.map((ta) => ta.props("label"));

    expect(textareaLabels).toContain("Startup Script");
    expect(textareaLabels).toContain("Shutdown Script");

    expect(wrapper.find("[data-cy='edit-ip']").exists()).toBe(true);
    expect(wrapper.find("[data-cy='edit-dpctl-port']").exists()).toBe(true);
    expect(wrapper.find("[data-cy='edit-dpid']").exists()).toBe(true);
    expect(wrapper.find("[data-cy='edit-dpopts']").exists()).toBe(true);
    expect(wrapper.find("[data-cy='edit-reconnect-ms']").exists()).toBe(true);
    expect(wrapper.find("[data-cy='edit-opts']").exists()).toBe(true);
    expect(wrapper.find("[data-cy='edit-start-script']").exists()).toBe(true);
    expect(wrapper.find("[data-cy='edit-stop-script']").exists()).toBe(true);
  });

  it("renders Protocol, Datapath, and Fail Mode selects with correct options", ({ expect }) => {
    const wrapper = mountSwitch(fullSwitchModel());

    const selects = wrapper.findAllComponents({ name: "VSelect" });

    const protocolSelect = selects.find((s) => s.props("label") === "Protocol");
    expect(protocolSelect).toBeDefined();
    const protocolValues = protocolSelect.props("items").map((i) => i.value);
    expect(protocolValues).toContain("OpenFlow13");
    expect(protocolValues).toContain("OpenFlow15");

    const datapathSelect = selects.find((s) => s.props("label") === "Datapath");
    expect(datapathSelect).toBeDefined();
    const datapathValues = datapathSelect.props("items").map((i) => i.value);
    expect(datapathValues).toContain("kernel");
    expect(datapathValues).toContain("user");

    const failModeSelect = selects.find((s) => s.props("label") === "Fail Mode");
    expect(failModeSelect).toBeDefined();
    const failModeValues = failModeSelect.props("items").map((i) => i.value);
    expect(failModeValues).toContain("secure");
    expect(failModeValues).toContain("standalone");
  });

  it("emits valid event on mount", async ({ expect }) => {
    const wrapper = mountSwitch(fullSwitchModel());

    await nextTick();

    expect(wrapper.emitted("valid")).toBeTruthy();
  });

  it("reflects updated modelValue in form fields", async ({ expect }) => {
    const wrapper = mountSwitch(fullSwitchModel());
    await nextTick();

    const updated = { ...fullSwitchModel(), hostname: "s2", ip: "192.168.1.1" };
    await wrapper.setProps({ modelValue: updated });
    await nextTick();

    const textFields = wrapper.findAllComponents({ name: "VTextField" });
    const hostnameField = textFields.find((tf) => tf.props("label") === "Hostname");
    expect(hostnameField.props("modelValue")).toBe("s2");

    const ipField = textFields.find((tf) => tf.props("label") === "IP");
    expect(ipField.props("modelValue")).toBe("192.168.1.1");
  });

  it("binds IP, opts, startScript, and stopScript fields to item via v-model", async ({ expect }) => {
    const wrapper = mountSwitch(fullSwitchModel());

    await nextTick();

    const textFields = wrapper.findAllComponents({ name: "VTextField" });
    const fieldByLabel = (label) =>
      textFields.find((tf) => tf.props("label") === label);

    const ipField = fieldByLabel("IP");
    await ipField.setValue("192.168.0.1");
    await nextTick();
    expect(ipField.props("modelValue")).toBe("192.168.0.1");

    const optsField = fieldByLabel("Additional Switch Options");
    await optsField.setValue("--new-opt");
    await nextTick();
    expect(optsField.props("modelValue")).toBe("--new-opt");

    const textareas = wrapper.findAllComponents({ name: "VTextarea" });
    const textareaByLabel = (label) =>
      textareas.find((ta) => ta.props("label") === label);

    const startScriptField = textareaByLabel("Startup Script");
    await startScriptField.setValue("echo hello");
    await nextTick();
    expect(startScriptField.props("modelValue")).toBe("echo hello");

    const stopScriptField = textareaByLabel("Shutdown Script");
    await stopScriptField.setValue("echo bye");
    await nextTick();
    expect(stopScriptField.props("modelValue")).toBe("echo bye");

    const checkboxes = wrapper.findAllComponents(ThreeStateCheckbox);
    const checkboxByLabel = (label) =>
      checkboxes.find((cb) => cb.props("label") === label);

    const inbandCb = checkboxByLabel("Inband");
    await inbandCb.setValue(false);
    await nextTick();
    expect(inbandCb.props("modelValue")).toBe(false);

    const inNamespaceCb = checkboxByLabel("In Namespace");
    await inNamespaceCb.setValue(true);
    await nextTick();
    expect(inNamespaceCb.props("modelValue")).toBe(true);

    const batchCb = checkboxByLabel("Batch");
    await batchCb.setValue(false);
    await nextTick();
    expect(batchCb.props("modelValue")).toBe(false);

    const verboseCb = checkboxByLabel("Verbose");
    await verboseCb.setValue(true);
    await nextTick();
    expect(verboseCb.props("modelValue")).toBe(true);
  });

  it("emits valid event when form validity changes", async ({ expect }) => {
    const wrapper = mountSwitch(fullSwitchModel());

    await nextTick();

    const validEvents = wrapper.emitted("valid");
    expect(validEvents).toBeTruthy();
    expect(validEvents.length).toBeGreaterThanOrEqual(1);
  });
});
