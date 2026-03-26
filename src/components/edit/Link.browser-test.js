import { describe, it } from "vitest";
import { nextTick } from "vue";
import { mountWithVuetify } from "../../test-utils/browser-setup.js";
import Link from "@/components/edit/Link.vue";
import { between, integer, minValue, timeWithUnit } from "@/validation/rules";

function mountLink(modelValue = { hostname: "link1" }) {
  return mountWithVuetify(Link, {
    props: { modelValue },
  });
}

function fullLinkModel() {
  return {
    hostname: "link1",
    bandwidth: 100,
    delay: "10ms",
    jitter: "5ms",
    loss: 2,
    maxQueueSize: 50,
  };
}

describe.concurrent("Link (edit)", () => {
  it("mounts successfully in Vuetify context", ({ expect }) => {
    const wrapper = mountLink();

    expect(wrapper.exists()).toBe(true);
  });

  it("renders a v-form with Label, Bandwidth, Delay, Jitter, Loss, and Max queue fields", ({ expect }) => {
    const wrapper = mountLink();

    const form = wrapper.findComponent({ name: "VForm" });
    expect(form.exists()).toBe(true);

    const textFields = wrapper.findAllComponents({ name: "VTextField" });
    const labels = textFields.map((tf) => tf.props("label"));

    expect(labels).toContain("Label");
    expect(labels).toContain("Bandwidth");
    expect(labels).toContain("Delay");
    expect(labels).toContain("Jitter");
    expect(labels).toContain("Loss");
    expect(labels).toContain("Max queue");

    const hostnameEl = wrapper.find("[data-cy='edit-hostname']");
    expect(hostnameEl.exists()).toBe(true);
  });

  it("has data-cy attributes for key fields", ({ expect }) => {
    const wrapper = mountLink();

    expect(wrapper.find("[data-cy='edit-bandwidth']").exists()).toBe(true);
    expect(wrapper.find("[data-cy='edit-delay']").exists()).toBe(true);
    expect(wrapper.find("[data-cy='edit-jitter']").exists()).toBe(true);
    expect(wrapper.find("[data-cy='edit-loss']").exists()).toBe(true);
    expect(wrapper.find("[data-cy='edit-max-queue-size']").exists()).toBe(true);
  });

  it("emits valid and new-item events on mount via common mixin mounted hook", async ({ expect }) => {
    const wrapper = mountLink(fullLinkModel());

    await nextTick();

    expect(wrapper.emitted("valid")).toBeTruthy();
    expect(wrapper.emitted("new-item")).toBeTruthy();
    expect(wrapper.emitted("new-item")[0][0]).toEqual(fullLinkModel());
  });

  it("updates internal item when modelValue prop changes via common mixin watcher", async ({ expect }) => {
    const wrapper = mountLink(fullLinkModel());

    await nextTick();

    const updatedModel = { ...fullLinkModel(), hostname: "link2", bandwidth: 200 };
    await wrapper.setProps({ modelValue: updatedModel });

    await nextTick();

    const emitted = wrapper.emitted("update:modelValue");
    expect(emitted).toBeTruthy();
    const lastEmission = emitted[emitted.length - 1][0];
    expect(lastEmission).toEqual(updatedModel);
  });

  it("emits update:modelValue and new-item when modelValue changes via common mixin watcher", async ({ expect }) => {
    const wrapper = mountLink(fullLinkModel());

    await nextTick();

    const newItem = { ...fullLinkModel(), loss: 50 };
    await wrapper.setProps({ modelValue: newItem });

    await nextTick();

    const updateEmitted = wrapper.emitted("update:modelValue");
    expect(updateEmitted).toBeTruthy();

    const newItemEmitted = wrapper.emitted("new-item");
    expect(newItemEmitted).toBeTruthy();
    expect(newItemEmitted.length).toBeGreaterThanOrEqual(2);
  });

  it("uses validator functions between, integer, minValue, and timeWithUnit for field rules", ({ expect }) => {
    expect(typeof between).toBe("function");
    expect(typeof integer).toBe("function");
    expect(typeof minValue).toBe("function");
    expect(typeof timeWithUnit).toBe("function");

    expect(between(0, 100)(50)).toBe(true);
    expect(between(0, 100)(150)).toBe("Has to be between 0 and 100 inclusive.");
    expect(integer()(5)).toBe(true);
    expect(integer()(5.5)).toBe("Has to be an integer.");
    expect(minValue(0)(10)).toBe(true);
    expect(minValue(0)(-1)).toBe("Has to be at least 0.");
    expect(timeWithUnit()("10ms")).toBe(true);
    expect(timeWithUnit()("bad")).toBe("Has to be expressed as time + unit (e.g. 10ms or 443us).");
  });

  it("binds field values to item properties via v-model", async ({ expect }) => {
    const wrapper = mountLink(fullLinkModel());

    await nextTick();

    const textFields = wrapper.findAllComponents({ name: "VTextField" });
    const fieldByLabel = (label) =>
      textFields.find((tf) => tf.props("label") === label);

    const bandwidthField = fieldByLabel("Bandwidth");
    await bandwidthField.setValue(200);
    await nextTick();
    const afterBandwidth = wrapper.emitted("update:modelValue");
    expect(afterBandwidth[afterBandwidth.length - 1][0].bandwidth).toBe(200);

    const delayField = fieldByLabel("Delay");
    await delayField.setValue("20ms");
    await nextTick();
    const afterDelay = wrapper.emitted("update:modelValue");
    expect(afterDelay[afterDelay.length - 1][0].delay).toBe("20ms");

    const jitterField = fieldByLabel("Jitter");
    await jitterField.setValue("3ms");
    await nextTick();
    const afterJitter = wrapper.emitted("update:modelValue");
    expect(afterJitter[afterJitter.length - 1][0].jitter).toBe("3ms");

    const lossField = fieldByLabel("Loss");
    await lossField.setValue(5);
    await nextTick();
    const afterLoss = wrapper.emitted("update:modelValue");
    expect(afterLoss[afterLoss.length - 1][0].loss).toBe(5);

    const maxQueueField = fieldByLabel("Max queue");
    await maxQueueField.setValue(100);
    await nextTick();
    const afterMaxQueue = wrapper.emitted("update:modelValue");
    expect(afterMaxQueue[afterMaxQueue.length - 1][0].maxQueueSize).toBe(100);
  });
});
