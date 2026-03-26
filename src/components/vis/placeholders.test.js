import { describe, it, expect } from "vitest";
import {
  labelPlaceholderRE,
  labelPlaceholderReplacers,
} from "@/components/vis/placeholders.js";

describe.concurrent("labelPlaceholderRE", () => {
  it.each([
    { input: "{{HOSTNAMES}}", expected: ["{{HOSTNAMES}}"] },
    { input: "{{IPS}}", expected: ["{{IPS}}"] },
    { input: "{{TYPES}}", expected: ["{{TYPES}}"] },
    { input: "{{custom}}", expected: ["{{custom}}"] },
    { input: "{{}}", expected: ["{{}}"] },
    {
      input: "prefix {{A}} middle {{B}} suffix",
      expected: ["{{A}}", "{{B}}"],
    },
  ])("matches $input", ({ input, expected }) => {
    expect([...input.matchAll(labelPlaceholderRE)].map((m) => m[0])).toEqual(
      expected,
    );
  });

  it.each([
    { input: "{{{foo}}}", desc: "triple braces" },
    { input: "{foo}", desc: "single braces" },
    { input: "plain text", desc: "no braces" },
  ])("does not fully match $desc ($input)", ({ input }) => {
    const matches = [...input.matchAll(labelPlaceholderRE)].map((m) => m[0]);
    // For triple braces {{{foo}}}, the regex must NOT match the full string
    // (it may match a substring like {{foo}}, but {{{foo}}} as a whole is not a valid match)
    expect(matches).not.toContain(input);
  });
});

describe("labelPlaceholderReplacers", () => {
  describe("{{HOSTNAMES}}", () => {
    const replacer = labelPlaceholderReplacers["{{HOSTNAMES}}"];

    it("returns comma-separated sorted hostnames of port, host, switch, and controller neighbors", ({ expect }) => {
      const neighbors = [
        { type: "switch", hostname: "s1" },
        { type: "host", hostname: "h2" },
        { type: "port", hostname: "p1" },
        { type: "controller", hostname: "c0" },
      ];
      expect(replacer(neighbors)).toBe("c0, h2, p1, s1");
    });

    it("ignores neighbors of other types", ({ expect }) => {
      const neighbors = [
        { type: "port", hostname: "p1" },
        { type: "link", hostname: "link1" },
        { type: "unknown", hostname: "u1" },
      ];
      expect(replacer(neighbors)).toBe("p1");
    });

    it("excludes types that only partially match allowed type names", ({ expect }) => {
      const neighbors = [
        { type: "viewport", hostname: "vp1" },
        { type: "portico", hostname: "pt1" },
        { type: "localhost", hostname: "lh1" },
        { type: "controllers", hostname: "cs1" },
        { type: "port", hostname: "p1" },
      ];
      expect(replacer(neighbors)).toBe("p1");
    });

    it("returns empty string for empty neighbors", ({ expect }) => {
      expect(replacer([])).toBe("");
    });
  });

  describe("{{IPS}}", () => {
    const replacer = labelPlaceholderReplacers["{{IPS}}"];

    it("returns IP addresses for a single port neighbor", ({ expect }) => {
      const neighbors = [
        { type: "port", hostname: "p1", ips: ["10.0.0.1", "10.0.0.2"] },
      ];
      expect(replacer(neighbors)).toBe("10.0.0.1\n10.0.0.2");
    });

    it("returns 'no addresses' for a port without ips", ({ expect }) => {
      const neighbors = [{ type: "port", hostname: "p1" }];
      expect(replacer(neighbors)).toBe("no addresses");
    });

    it("returns ip:port for a controller with both values", ({ expect }) => {
      const neighbors = [
        { type: "controller", hostname: "c0", ip: "127.0.0.1", port: 6653 },
      ];
      expect(replacer(neighbors)).toBe("127.0.0.1:6653");
    });

    it("returns '<default IP>:<default port>' for a controller without ip and port", ({ expect }) => {
      const neighbors = [{ type: "controller", hostname: "c0" }];
      expect(replacer(neighbors)).toBe("<default IP>:<default port>");
    });

    it("returns defaultRoute for a host", ({ expect }) => {
      const neighbors = [
        { type: "host", hostname: "h1", defaultRoute: "10.0.0.1" },
      ];
      expect(replacer(neighbors)).toBe("10.0.0.1");
    });

    it("returns 'no default route' for a host without defaultRoute", ({ expect }) => {
      const neighbors = [{ type: "host", hostname: "h1" }];
      expect(replacer(neighbors)).toBe("no default route");
    });

    it("returns ip for a switch", ({ expect }) => {
      const neighbors = [{ type: "switch", hostname: "s1", ip: "10.0.0.5" }];
      expect(replacer(neighbors)).toBe("10.0.0.5");
    });

    it("returns 'no address' for a switch without ip", ({ expect }) => {
      const neighbors = [{ type: "switch", hostname: "s1" }];
      expect(replacer(neighbors)).toBe("no address");
    });

    it("pads and aligns output for multiple neighbors", ({ expect }) => {
      const neighbors = [
        { type: "host", hostname: "h1", defaultRoute: "10.0.0.1" },
        { type: "switch", hostname: "s1", ip: "10.0.0.2" },
      ];
      const result = replacer(neighbors);
      // With multiple items, buildOutputString formats as "hostname:  ip"
      // sorted by hostname: h1, s1. Max hostname length = 2, indent = 4
      expect(result).toBe("h1: 10.0.0.1\ns1: 10.0.0.2");
    });

    it("aligns indentation based on longest hostname across all items", ({ expect }) => {
      const neighbors = [
        { type: "host", hostname: "h1", defaultRoute: "10.0.0.1" },
        { type: "switch", hostname: "switch1", ip: "10.0.0.2" },
      ];
      const result = replacer(neighbors);
      // max hostname length = 7 ("switch1"), indent = 7 + 2 = 9
      // "h1:".padEnd(9) = "h1:      " (9 chars)
      // "switch1:".padEnd(9) = "switch1: " (9 chars)
      expect(result).toBe("h1:      10.0.0.1\nswitch1: 10.0.0.2");
    });

    it("indents continuation lines of multi-value entries to align with the first value", ({ expect }) => {
      const neighbors = [
        { type: "port", hostname: "p1", ips: ["10.0.0.1", "10.0.0.2"] },
        { type: "switch", hostname: "s1", ip: "10.0.0.3" },
      ];
      const result = replacer(neighbors);
      // max hostname length = 2, indent = 4
      // p1 has 2 IPs, so separator between items is "\n\n"
      // p1's IPs joined by "\n".padEnd(5, " ") = "\n    " (newline + 4 spaces)
      expect(result).toBe("p1: 10.0.0.1\n    10.0.0.2\n\ns1: 10.0.0.3");
    });

    it("uses single newline separator when all items have single-value arrays", ({ expect }) => {
      const neighbors = [
        { type: "host", hostname: "h1", defaultRoute: "10.0.0.1" },
        { type: "host", hostname: "h2", defaultRoute: "10.0.0.2" },
      ];
      const result = replacer(neighbors);
      // Both have single IPs, so separator is "\n" (not "\n\n")
      expect(result).toContain("h1:");
      expect(result).toContain("h2:");
      expect(result).not.toContain("\n\n");
    });

    it("uses double newline separator when any item has multiple values", ({ expect }) => {
      const neighbors = [
        { type: "port", hostname: "p1", ips: ["10.0.0.1", "10.0.0.2"] },
        { type: "host", hostname: "h1", defaultRoute: "10.0.0.3" },
      ];
      const result = replacer(neighbors);
      // p1 has 2 IPs, so max right length > 1, uses "\n\n" separator
      expect(result).toContain("\n\n");
    });

    it("ignores non-port/controller/host/switch neighbors", ({ expect }) => {
      const neighbors = [
        { type: "link", hostname: "link1" },
        { type: "port", hostname: "p1", ips: ["10.0.0.1"] },
      ];
      expect(replacer(neighbors)).toBe("10.0.0.1");
    });

    it("returns 'nothing is connected' for empty neighbors", ({ expect }) => {
      expect(replacer([])).toBe("nothing is connected");
    });
  });

  describe("{{TYPES}}", () => {
    const replacer = labelPlaceholderReplacers["{{TYPES}}"];

    it("returns mapped type title for a controller", ({ expect }) => {
      const neighbors = [
        { type: "controller", hostname: "c0", controllerType: "RemoteController" },
      ];
      expect(replacer(neighbors)).toBe("Remote Controller");
    });

    it("returns mapped type title for a switch", ({ expect }) => {
      const neighbors = [
        { type: "switch", hostname: "s1", switchType: "OVSSwitch" },
      ];
      expect(replacer(neighbors)).toBe("OVS Switch");
    });

    it("returns 'default type' when controllerType is not set", ({ expect }) => {
      const neighbors = [{ type: "controller", hostname: "c0" }];
      expect(replacer(neighbors)).toBe("default type");
    });

    it("returns 'default type' when switchType is not set", ({ expect }) => {
      const neighbors = [{ type: "switch", hostname: "s1" }];
      expect(replacer(neighbors)).toBe("default type");
    });

    it("ignores non-controller/non-switch neighbors", ({ expect }) => {
      const neighbors = [
        { type: "host", hostname: "h1" },
        { type: "port", hostname: "p1" },
        { type: "controller", hostname: "c0", controllerType: "Ryu" },
      ];
      expect(replacer(neighbors)).toBe("Ryu Controller");
    });

    it("pads and aligns types output for multiple controller/switch neighbors", ({ expect }) => {
      const neighbors = [
        { type: "controller", hostname: "c0", controllerType: "Ryu" },
        { type: "switch", hostname: "switch1", switchType: "OVSSwitch" },
      ];
      const result = replacer(neighbors);
      // max hostname length = 7 ("switch1"), indent = 9
      // sorted by hostname: c0, switch1
      // "c0:".padEnd(9) = "c0:      " then "Ryu Controller"
      // "switch1:".padEnd(9) = "switch1: " then "OVS Switch"
      expect(result).toBe("c0:      Ryu Controller\nswitch1: OVS Switch");
    });

    it("returns the raw type value for unmapped controllerType", ({ expect }) => {
      const neighbors = [
        { type: "controller", hostname: "c0", controllerType: "CustomCtrl" },
      ];
      expect(replacer(neighbors)).toBe("CustomCtrl");
    });

    it("returns the raw type value for unmapped switchType", ({ expect }) => {
      const neighbors = [
        { type: "switch", hostname: "s1", switchType: "CustomSwitch" },
      ];
      expect(replacer(neighbors)).toBe("CustomSwitch");
    });

    it("returns 'nothing is connected' for empty neighbors", ({ expect }) => {
      expect(replacer([])).toBe("nothing is connected");
    });
  });

  describe("fallback", () => {
    it("returns 'unknown placeholder: <match>' for unrecognized placeholders", ({ expect }) => {
      expect(labelPlaceholderReplacers.fallback([], "{{FOO}}")).toBe(
        "unknown placeholder: {{FOO}}",
      );
    });
  });
});
