import { describe, it } from "vitest";
import { generateTooltip } from "@/components/vis/generateTooltip.js";

describe.concurrent("generateTooltip", () => {
  describe("dispatch", () => {
    it("delegates to the correct generator based on item.type", ({
      expect,
    }) => {
      expect(generateTooltip({ type: "host", defaultRoute: "10.0.0.1" })).toBe(
        "Default Route: 10.0.0.1",
      );
    });

    it("returns undefined for an unknown item type", ({ expect }) => {
      expect(generateTooltip({ type: "unknown" })).toBeUndefined();
    });
  });

  describe("port generator", () => {
    it("prefixes 'Physical interface' when physical is true", ({ expect }) => {
      const result = generateTooltip({
        type: "port",
        physical: true,
        ips: ["10.0.0.1"],
      });
      expect(result).toBe("Physical interface<br/>10.0.0.1");
    });

    it("omits 'Physical interface' when physical is falsy", ({ expect }) => {
      const result = generateTooltip({
        type: "port",
        physical: false,
        ips: ["10.0.0.1"],
      });
      expect(result).toBe("10.0.0.1");
    });

    it("joins multiple IP addresses with <br/>", ({ expect }) => {
      const result = generateTooltip({
        type: "port",
        ips: ["10.0.0.1", "10.0.0.2", "fd00::1"],
      });
      expect(result).toBe("10.0.0.1<br/>10.0.0.2<br/>fd00::1");
    });

    it("shows 'No addresses' when ips is absent", ({ expect }) => {
      const result = generateTooltip({ type: "port" });
      expect(result).toBe("No addresses");
    });
  });

  describe("link generator", () => {
    it.for([
      {
        props: { bandwidth: 100 },
        desc: "bandwidth",
        expected:
          "<table><tr><td>Bandwidth</td><td>100 MBit/s</td></tr></table>",
      },
      {
        props: { delay: "10ms" },
        desc: "delay",
        expected: "<table><tr><td>Delay</td><td>10 ms</td></tr></table>",
      },
      {
        props: { loss: 5 },
        desc: "loss",
        expected: "<table><tr><td>Loss</td><td>5 %</td></tr></table>",
      },
      {
        props: { maxQueueSize: 500 },
        desc: "maxQueueSize",
        expected:
          "<table><tr><td>Max Queue</td><td>500 packets</td></tr></table>",
      },
      {
        props: { jitter: "2ms" },
        desc: "jitter",
        expected: "<table><tr><td>Jitter</td><td>2 ms</td></tr></table>",
      },
    ])(
      "renders $desc in an HTML table row",
      ({ props, expected }, { expect }) => {
        const result = generateTooltip({ type: "link", ...props });
        expect(result).toBe(expected);
      },
    );

    it("renders all link properties in order", ({ expect }) => {
      const result = generateTooltip({
        type: "link",
        bandwidth: 50,
        delay: "5ms",
        loss: 1,
        maxQueueSize: 200,
        jitter: "3us",
      });
      expect(result).toBe(
        "<table>" +
          "<tr><td>Bandwidth</td><td>50 MBit/s</td></tr>" +
          "<tr><td>Delay</td><td>5 ms</td></tr>" +
          "<tr><td>Loss</td><td>1 %</td></tr>" +
          "<tr><td>Max Queue</td><td>200 packets</td></tr>" +
          "<tr><td>Jitter</td><td>3 us</td></tr>" +
          "</table>",
      );
    });

    it("returns 'No limits' when no link properties are set", ({ expect }) => {
      expect(generateTooltip({ type: "link" })).toBe("No limits");
    });
  });

  describe("host generator", () => {
    it("returns 'Default Route: <route>' when defaultRoute is set", ({
      expect,
    }) => {
      expect(
        generateTooltip({ type: "host", defaultRoute: "192.168.1.1" }),
      ).toBe("Default Route: 192.168.1.1");
    });

    it("returns 'No default route' when defaultRoute is absent", ({
      expect,
    }) => {
      expect(generateTooltip({ type: "host" })).toBe("No default route");
    });
  });

  describe("switch generator", () => {
    it.for([
      { switchType: "OVSSwitch", expected: "OVS Switch" },
      { switchType: "LinuxBridge", expected: "Linux Bridge" },
      { switchType: "OVSBridge", expected: "OVS Bridge" },
      { switchType: "IVSSwitch", expected: "IVS Switch" },
      { switchType: "UserSwitch", expected: "User Switch" },
    ])(
      "maps $switchType to '$expected'",
      ({ switchType, expected }, { expect }) => {
        expect(generateTooltip({ type: "switch", switchType })).toBe(expected);
      },
    );

    it("returns 'Default' when switchType is null", ({ expect }) => {
      expect(generateTooltip({ type: "switch", switchType: null })).toBe(
        "Default",
      );
    });

    it("returns the raw switchType value when it is not in switchTypesMap", ({
      expect,
    }) => {
      expect(
        generateTooltip({ type: "switch", switchType: "CustomSwitch" }),
      ).toBe("CustomSwitch");
    });
  });

  describe("controller generator", () => {
    it("includes mapped controller type and IPv4:port", ({ expect }) => {
      const result = generateTooltip({
        type: "controller",
        controllerType: "RemoteController",
        ip: "127.0.0.1",
        port: 6653,
      });
      expect(result).toBe("Remote Controller<br/>127.0.0.1:6653");
    });

    it("wraps IPv6 address in brackets", ({ expect }) => {
      const result = generateTooltip({
        type: "controller",
        controllerType: "Ryu",
        ip: "::1",
        port: 6633,
      });
      expect(result).toBe("Ryu Controller<br/>[::1]:6633");
    });

    it("shows only IP when port is missing", ({ expect }) => {
      const result = generateTooltip({
        type: "controller",
        controllerType: "Controller",
        ip: "10.0.0.1",
      });
      expect(result).toBe("OpenFlow Reference Implementation<br/>10.0.0.1");
    });

    it("shows '<No IP>:port' when ip is missing", ({ expect }) => {
      const result = generateTooltip({
        type: "controller",
        controllerType: "NOX",
        port: 6653,
      });
      expect(result).toBe("NOX<br/>&lt;No IP&gt;:6653");
    });

    it("shows 'Default' for controllerType when controllerType is absent", ({
      expect,
    }) => {
      const result = generateTooltip({
        type: "controller",
        ip: "10.0.0.1",
        port: 8080,
      });
      expect(result).toBe("Default<br/>10.0.0.1:8080");
    });

    it("returns the raw controllerType when not in controllerTypesMap", ({
      expect,
    }) => {
      const result = generateTooltip({
        type: "controller",
        controllerType: "CustomCtrl",
        ip: "10.0.0.1",
        port: 9000,
      });
      expect(result).toBe("CustomCtrl<br/>10.0.0.1:9000");
    });

    it("shows only 'Default<br/>' when neither ip nor port is set", ({
      expect,
    }) => {
      const result = generateTooltip({ type: "controller" });
      expect(result).toBe("Default<br/>");
    });

    it("shows controllerType and '<br/>' only when both ip and port are null", ({
      expect,
    }) => {
      const result = generateTooltip({
        type: "controller",
        controllerType: "Ryu",
        ip: null,
        port: null,
      });
      expect(result).toBe("Ryu Controller<br/>");
    });

    it("shows ip only (no colon) when ip is present and port is explicitly null", ({
      expect,
    }) => {
      const result = generateTooltip({
        type: "controller",
        controllerType: "NOX",
        ip: "192.168.1.1",
        port: null,
      });
      expect(result).toBe("NOX<br/>192.168.1.1");
    });

    it("shows '<No IP>:port' when ip is explicitly null and port is present", ({
      expect,
    }) => {
      const result = generateTooltip({
        type: "controller",
        controllerType: "OVSController",
        ip: null,
        port: 6633,
      });
      expect(result).toBe("OVS Controller<br/>&lt;No IP&gt;:6633");
    });
  });

  describe("port generator edge cases", () => {
    it("shows 'Physical interface' and 'No addresses' when physical is true but ips is absent", ({
      expect,
    }) => {
      const result = generateTooltip({ type: "port", physical: true });
      expect(result).toBe("Physical interface<br/>No addresses");
    });

    it("shows only 'No addresses' when both physical and ips are absent", ({
      expect,
    }) => {
      const result = generateTooltip({ type: "port", physical: false });
      expect(result).toBe("No addresses");
    });
  });
});
