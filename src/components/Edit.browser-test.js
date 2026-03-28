import { describe, it, vi, afterEach } from "vitest";
import { defineComponent, h, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import Edit from "@/components/Edit.vue";

const HostEditStub = defineComponent({
  name: "HostEdit",
  props: ["modelValue"],
  emits: ["update:modelValue", "valid"],
  setup(props, { emit }) {
    emit("valid", true);
    return () =>
      h(
        "div",
        { class: "host-edit-stub" },
        `HostEdit: ${props.modelValue?.hostname}`,
      );
  },
});

let wrapper;

afterEach(() => {
  wrapper?.unmount();
});

function mountEdit() {
  const vuetify = createVuetify();
  wrapper = mount(Edit, {
    attachTo: document.body,
    global: {
      plugins: [vuetify],
      stubs: {
        AssociationEdit: true,
        ControllerEdit: true,
        DummyEdit: true,
        HostEdit: HostEditStub,
        LinkEdit: true,
        PortEdit: true,
        SwitchEdit: true,
      },
    },
  });
  return wrapper;
}

describe("Edit", () => {
  it("mounts in Vuetify context and dialog is not visible initially", ({
    expect,
  }) => {
    const w = mountEdit();

    expect(w.exists()).toBe(true);
    // Dialog not visible: headline element should not be present in DOM
    const headline = document.querySelector(".headline");
    expect(headline).toBeNull();
  });

  it("opens dialog with correct headline when edit is called with a host item", async ({
    expect,
  }) => {
    const w = mountEdit();
    const callback = vi.fn();
    const hostItem = {
      id: "h1",
      type: "host",
      hostname: "h1",
      defaultRoute: "",
    };

    // edit() is the component's public API for parent callers (defineExpose candidate)
    w.vm.edit(hostItem, callback);
    await nextTick();

    // Dialog visible: headline element should be present in DOM with correct text
    const headline = document.querySelector(".headline");
    expect(headline).not.toBeNull();
    expect(headline.textContent).toBe("Host");
  });

  it("renders Cancel and Save buttons when dialog is open", async ({
    expect,
  }) => {
    const w = mountEdit();
    const callback = vi.fn();
    const hostItem = { id: "h1", type: "host", hostname: "h1" };

    w.vm.edit(hostItem, callback);
    await nextTick();

    const cancelBtn = document.querySelector('[data-cy="edit-cancel"]');
    const saveBtn = document.querySelector('[data-cy="edit-save"]');
    expect(cancelBtn).not.toBeNull();
    expect(saveBtn).not.toBeNull();
    expect(cancelBtn.textContent).toContain("Cancel");
    expect(saveBtn.textContent).toContain("Save");
  });

  it("save does nothing when Enter is pressed in a TEXTAREA", async ({
    expect,
  }) => {
    const w = mountEdit();
    const callback = vi.fn();
    const hostItem = { id: "h1", type: "host", hostname: "h1" };

    // edit() is the component's public API for parent callers (defineExpose candidate)
    w.vm.edit(hostItem, callback);
    await nextTick();

    // Simulate pressing Enter while a TEXTAREA is focused (the dialog's
    // @keydown.enter="save" handler checks event.target.tagName)
    const dialog = document.querySelector(".v-dialog");
    const enterEvent = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
    });
    Object.defineProperty(enterEvent, "target", {
      value: { tagName: "TEXTAREA" },
    });
    dialog.dispatchEvent(enterEvent);
    await nextTick();

    // Dialog should still be open and callback not called
    const headline = document.querySelector(".headline");
    expect(headline).not.toBeNull();
    expect(callback).not.toHaveBeenCalled();
  });

  it("save does nothing when form is invalid", async ({ expect }) => {
    const w = mountEdit();
    const callback = vi.fn();
    const switchItem = { id: "s1", type: "switch", name: "s1" };

    // edit() is the component's public API for parent callers (defineExpose candidate)
    w.vm.edit(switchItem, callback);
    await nextTick();

    // valid defaults to false; SwitchEdit stub does not emit valid
    // Save button should be disabled
    const saveBtn = document.querySelector('[data-cy="edit-save"]');
    expect(saveBtn.disabled).toBe(true);
    saveBtn.click();
    await nextTick();

    // Dialog should still be open and callback not called
    const headline = document.querySelector(".headline");
    expect(headline).not.toBeNull();
    expect(callback).not.toHaveBeenCalled();
  });

  it("save calls callback with item copy and closes dialog when valid", async ({
    expect,
  }) => {
    const w = mountEdit();
    const callback = vi.fn();
    const hostItem = { id: "h1", type: "host", hostname: "h1" };

    // edit() is the component's public API for parent callers (defineExpose candidate)
    w.vm.edit(hostItem, callback);
    await nextTick();
    // HostEditStub emits valid(true) on setup, making the save button enabled

    // Click the save button via data-cy selector
    const saveBtn = document.querySelector('[data-cy="edit-save"]');
    expect(saveBtn.disabled).toBe(false);
    saveBtn.click();
    await nextTick();

    expect(callback).toHaveBeenCalledOnce();
    const savedItem = callback.mock.calls[0][0];
    expect(savedItem).toEqual({ id: "h1", type: "host", hostname: "h1" });
    // Dialog should be closed (overlay no longer active)
    const activeOverlay = document.querySelector(".v-overlay--active");
    expect(activeOverlay).toBeNull();
  });

  it("cancel calls callback without arguments and closes dialog", async ({
    expect,
  }) => {
    const w = mountEdit();
    const callback = vi.fn();
    const hostItem = { id: "h1", type: "host", hostname: "h1" };

    // edit() is the component's public API for parent callers (defineExpose candidate)
    w.vm.edit(hostItem, callback);
    await nextTick();

    // Click the cancel button via data-cy selector
    const cancelBtn = document.querySelector('[data-cy="edit-cancel"]');
    cancelBtn.click();
    await nextTick();

    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith();
    // Dialog should be closed (overlay no longer active)
    const activeOverlay = document.querySelector(".v-overlay--active");
    expect(activeOverlay).toBeNull();
  });

  it("renders edge icon for association type", async ({ expect }) => {
    const w = mountEdit();
    const callback = vi.fn();

    // edit() is the component's public API for parent callers (defineExpose candidate)
    w.vm.edit({ id: "a1", type: "association" }, callback);
    await nextTick();

    // The template renders v-icon with `$net-${themeType}` -- for association, themeType is "edge"
    const icon = w.findComponent({ name: "VIcon" });
    expect(icon.exists()).toBe(true);
    expect(icon.text()).toContain("$net-edge");
  });

  it("renders edge icon for link type", async ({ expect }) => {
    const w = mountEdit();
    const callback = vi.fn();

    // edit() is the component's public API for parent callers (defineExpose candidate)
    w.vm.edit({ id: "l1", type: "link" }, callback);
    await nextTick();

    // The template renders v-icon with `$net-${themeType}` -- for link, themeType is "edge"
    const icon = w.findComponent({ name: "VIcon" });
    expect(icon.exists()).toBe(true);
    expect(icon.text()).toContain("$net-edge");
  });

  it("renders HostEdit component for known host type", async ({ expect }) => {
    const w = mountEdit();
    const callback = vi.fn();

    // edit() is the component's public API for parent callers (defineExpose candidate)
    w.vm.edit({ id: "h1", type: "host" }, callback);
    await nextTick();

    // HostEdit stub should be rendered in the DOM
    const hostEdit = w.findComponent({ name: "HostEdit" });
    expect(hostEdit.exists()).toBe(true);
  });

  it("renders div fallback for unknown type", async ({ expect }) => {
    const w = mountEdit();
    const callback = vi.fn();

    // edit() is the component's public API for parent callers (defineExpose candidate)
    w.vm.edit({ id: "x1", type: "unknown" }, callback);
    await nextTick();

    // No known edit component should be rendered; fallback div is used
    const hostEdit = w.findComponent({ name: "HostEdit" });
    expect(hostEdit.exists()).toBe(false);
    // The card text area should still exist (with a plain div inside)
    const cardText = document.querySelector(".v-card-text");
    expect(cardText).not.toBeNull();
  });
});
