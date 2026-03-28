import { describe, it, expect } from "vitest";
import {
  compare,
  compareNodes,
  compareItems,
} from "@/components/vis/locale.js";

describe.concurrent("compare", () => {
  it.each([
    {
      a: "apple",
      b: "banana",
      desc: "alphabetically lesser",
      check: "negative",
    },
    {
      a: "banana",
      b: "apple",
      desc: "alphabetically greater",
      check: "positive",
    },
    { a: "same", b: "same", desc: "identical strings", check: "zero" },
    {
      a: "h2",
      b: "h10",
      desc: "numeric collation (h2 before h10)",
      check: "negative",
    },
    {
      a: "file10",
      b: "file2",
      desc: "numeric collation (file10 after file2)",
      check: "positive",
    },
  ])("returns $check for $desc ($a vs $b)", ({ a, b, check }) => {
    const result = compare(a, b);
    if (check === "negative") {
      expect(result).toBeLessThan(0);
    } else if (check === "positive") {
      expect(result).toBeGreaterThan(0);
    } else {
      expect(result).toBe(0);
    }
  });
});

describe("compareNodes", () => {
  it("sorts objects by label property with numeric collation", ({ expect }) => {
    const nodes = [
      { label: "switch10" },
      { label: "switch2" },
      { label: "switch1" },
    ];
    const sorted = [...nodes].sort(compareNodes);
    expect(sorted.map((n) => n.label)).toEqual([
      "switch1",
      "switch2",
      "switch10",
    ]);
  });
});

describe("compareItems", () => {
  it("sorts objects by hostname property with numeric collation", ({
    expect,
  }) => {
    const items = [{ hostname: "h10" }, { hostname: "h2" }, { hostname: "h1" }];
    const sorted = [...items].sort(compareItems);
    expect(sorted.map((i) => i.hostname)).toEqual(["h1", "h2", "h10"]);
  });
});
