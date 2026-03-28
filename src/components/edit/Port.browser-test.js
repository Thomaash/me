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

  it("renders a v-form with a required Dev Name field and IPs textarea", ({
    expect,
  }) => {
    const wrapper = mountPort();

    const form = wrapper.findComponent({ name: "VForm" });
    expect(form.exists()).toBe(true);

    const hostnameEl = wrapper.find("[data-cy='edit-hostname']");
    expect(hostnameEl.exists()).toBe(true);

    const textFields = wrapper.findAllComponents({ name: "VTextField" });
    const devNameField = textFields.find(
      (tf) => tf.props("label") === "Dev Name",
    );
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

  it("displays ips as newline-joined text in textarea and preserves trailing newline", async ({
    expect,
  }) => {
    const wrapper = mountPort({
      hostname: "eth0",
      ips: ["10.0.0.1/24", "192.168.1.1/16"],
    });

    await nextTick();

    const textarea = wrapper.findComponent({ name: "VTextarea" });
    expect(textarea.props("modelValue")).toBe("10.0.0.1/24\n192.168.1.1/16");

    await textarea.setValue("10.0.0.1/24\n192.168.1.1/16\n");
    await nextTick();

    expect(textarea.props("modelValue")).toBe("10.0.0.1/24\n192.168.1.1/16\n");
  });

  it("splits textarea text into ips array and tracks trailing newline", async ({
    expect,
  }) => {
    const wrapper = mountPort({ hostname: "eth0", ips: [] });

    await nextTick();

    const textarea = wrapper.findComponent({ name: "VTextarea" });

    await textarea.setValue("10.0.0.1/24\n192.168.1.1/16");
    await nextTick();
    expect(textarea.props("modelValue")).toBe("10.0.0.1/24\n192.168.1.1/16");

    await textarea.setValue("10.0.0.1/24\n");
    await nextTick();
    expect(textarea.props("modelValue")).toBe("10.0.0.1/24\n");

    await textarea.setValue(null);
    await nextTick();
    expect(textarea.props("modelValue")).toBe("");
  });

  it("deletes physical property from item when physical switch is set to false", async ({
    expect,
  }) => {
    const wrapper = mountPort({
      hostname: "eth0",
      ips: ["10.0.0.1/24"],
      physical: true,
    });

    await nextTick();

    const switchToggle = wrapper.findComponent({ name: "VSwitch" });
    expect(switchToggle.props("modelValue")).toBe(true);

    await switchToggle.setValue(false);
    await nextTick();

    expect(switchToggle.props("modelValue")).toBeUndefined();
  });

  it("emits valid event on mount", async ({ expect }) => {
    const wrapper = mountPort();

    await nextTick();

    expect(wrapper.emitted("valid")).toBeTruthy();
  });

  it("reflects updated modelValue in form fields", async ({ expect }) => {
    const wrapper = mountPort();

    const updated = { hostname: "eth1", ips: ["172.16.0.1/12", "10.0.0.5/8"] };
    await wrapper.setProps({ modelValue: updated });
    await nextTick();

    const textFields = wrapper.findAllComponents({ name: "VTextField" });
    const devNameField = textFields.find(
      (tf) => tf.props("label") === "Dev Name",
    );
    expect(devNameField.props("modelValue")).toBe("eth1");

    const textarea = wrapper.findComponent({ name: "VTextarea" });
    expect(textarea.props("modelValue")).toBe("172.16.0.1/12\n10.0.0.5/8");
  });
});
