import { describe, it, vi, afterEach } from "vitest";
import { defineComponent, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import common from "@/components/edit/common.js";

const TestComponent = defineComponent({
  name: "CommonMixinTest",
  mixins: [common],
  template: "<div></div>",
});

let wrapper;

afterEach(() => {
  wrapper?.unmount();
});

function mountTestComponent(options = {}) {
  wrapper = mount(TestComponent, {
    props: { modelValue: options.modelValue ?? {} },
    ...options,
  });
  return wrapper;
}

describe("edit common mixin", () => {
  describe("component setup", () => {
    it("accepts modelValue prop", ({ expect }) => {
      const w = mountTestComponent({ modelValue: { hostname: "test" } });

      expect(w.props("modelValue")).toEqual({ hostname: "test" });
    });

    it("declares emits for update:modelValue, new-item, and valid", ({ expect }) => {
      const w = mountTestComponent();

      expect(w.vm.$options.emits).toEqual([
        "update:modelValue",
        "new-item",
        "valid",
      ]);
    });

    it("initializes with valid as false, item synced from modelValue, and _lastItem set after mount", ({ expect }) => {
      const modelValue = { hostname: "init" };
      const w = mountTestComponent({ modelValue });

      expect(w.vm.valid).toBe(false);
      expect(w.vm.item).toEqual(modelValue);
      expect(w.vm._lastItem).toEqual(modelValue);
      expect(w.vm._lastItem).not.toBeNull();
    });
  });

  describe("item watcher", () => {
    it("emits update:modelValue and new-item when item changes", async ({ expect }) => {
      const w = mountTestComponent({ modelValue: { hostname: "original" } });

      // Clear mount-time emissions
      const mountEmissions = {
        "update:modelValue": (w.emitted("update:modelValue") || []).length,
        "new-item": (w.emitted("new-item") || []).length,
      };

      const newItem = { hostname: "changed" };
      w.vm.item = newItem;
      await nextTick();

      const updateEmissions = w.emitted("update:modelValue");
      const newItemEmissions = w.emitted("new-item");

      expect(updateEmissions.length).toBeGreaterThan(mountEmissions["update:modelValue"]);
      expect(updateEmissions[updateEmissions.length - 1]).toEqual([newItem]);

      expect(newItemEmissions.length).toBeGreaterThan(mountEmissions["new-item"]);
      expect(newItemEmissions[newItemEmissions.length - 1]).toEqual([newItem]);
    });
  });

  describe("modelValue watcher", () => {
    it("syncs item to the new modelValue when prop changes", async ({ expect }) => {
      const w = mountTestComponent({ modelValue: { hostname: "original" } });

      const newVal = { hostname: "updated" };
      await w.setProps({ modelValue: newVal });

      expect(w.vm.item).toEqual(newVal);
    });
  });

  describe("valid watcher", () => {
    it("emits the valid event when valid changes", async ({ expect }) => {
      const w = mountTestComponent();

      // Clear mount-time valid emission
      const mountValidCount = (w.emitted("valid") || []).length;

      w.vm.valid = true;
      await nextTick();

      const validEmissions = w.emitted("valid");
      expect(validEmissions.length).toBeGreaterThan(mountValidCount);
      expect(validEmissions[validEmissions.length - 1]).toEqual([true]);
    });
  });

  describe("new-item emission", () => {
    it("emits new-item when item is set to a different reference", async ({ expect }) => {
      const w = mountTestComponent({ modelValue: { id: 1 } });

      const mountNewItemCount = (w.emitted("new-item") || []).length;

      const differentItem = { id: 2 };
      w.vm.item = differentItem;
      await nextTick();

      const newItemEmissions = w.emitted("new-item");
      expect(newItemEmissions.length).toBeGreaterThan(mountNewItemCount);
      expect(newItemEmissions[newItemEmissions.length - 1]).toEqual([differentItem]);
    });

    it("does not emit new-item when item is set to the same reference", async ({ expect }) => {
      const w = mountTestComponent({ modelValue: { id: 1 } });
      await nextTick();

      const mountNewItemCount = (w.emitted("new-item") || []).length;

      // The item watcher fires on any assignment, but _newItemEmit guards
      // against duplicate emissions by comparing references. After mount,
      // _lastItem already holds the current item reference, so re-assigning
      // the same reference should not produce another new-item event.
      const sameRef = w.vm.item;
      w.vm.item = sameRef;
      await nextTick();

      const newItemEmissions = w.emitted("new-item") || [];
      expect(newItemEmissions.length).toBe(mountNewItemCount);
    });
  });

  describe("mounted behavior", () => {
    it("sets item from modelValue, emits new-item and valid on mount", ({ expect }) => {
      const modelValue = { id: 42 };
      const w = mountTestComponent({ modelValue });

      expect(w.vm.item).toEqual(modelValue);

      const newItemEmissions = w.emitted("new-item");
      expect(newItemEmissions).toBeTruthy();
      expect(newItemEmissions.length).toBeGreaterThanOrEqual(1);
      expect(newItemEmissions[0]).toEqual([modelValue]);

      const validEmissions = w.emitted("valid");
      expect(validEmissions).toBeTruthy();
      expect(validEmissions[0]).toEqual([false]);
    });

    it("calls $v.$touch on mount when $v is present", ({ expect }) => {
      const $touch = vi.fn();

      wrapper = mount(TestComponent, {
        props: { modelValue: { id: 99 } },
        global: {
          mocks: { $v: { $touch } },
        },
      });

      expect($touch).toHaveBeenCalledOnce();
    });

    it("does not fail on mount when $v is absent", ({ expect }) => {
      const w = mountTestComponent({ modelValue: { id: 99 } });

      // Component mounts without error and emits expected events
      expect(w.vm.item).toEqual({ id: 99 });
      expect(w.emitted("new-item")).toBeTruthy();
      expect(w.emitted("valid")).toBeTruthy();
    });
  });
});
