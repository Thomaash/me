import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, it, beforeEach } from "vitest";
import { Builder } from "@/builder/index.js";
import medium2Controllers from "@/examples/medium_2_controllers.json";

// Extract content lines from the "# Log {{{ ... # }}}" block of a rendered
// script. Returns the lines between the markers, excluding empty lines and
// the markers themselves.
function extractLogBlock(script) {
  const lines = script.split("\n");
  const start = lines.findIndex((l) => l === "# Log {{{");
  if (start === -1) return [];
  const end = lines.indexOf("# }}}", start + 1);
  if (end === -1) return [];
  return lines.slice(start + 1, end).filter((l) => l !== "");
}

// --- Minimal Fixture Helpers ---

// Unique ID counter to avoid collisions across fixtures
let lastUid = 0;
function uid() {
  return `uid-${++lastUid}`;
}

function makeAssociation(fromId, toId) {
  return { id: uid(), type: "association", from: fromId, to: toId };
}

function makeController({ id = uid(), ...overrides } = {}) {
  return {
    id,
    type: "controller",
    hostname: "c1",
    x: 0,
    y: 0,
    ...overrides,
  };
}

function makeHost({ id = uid(), ...overrides } = {}) {
  return { id, type: "host", hostname: "h1", x: 0, y: 0, ...overrides };
}

function makeSwitch({ id = uid(), ...overrides } = {}) {
  return {
    id,
    type: "switch",
    hostname: "s1",
    x: 0,
    y: 0,
    ...overrides,
  };
}

function makePort({ id = uid(), ...overrides } = {}) {
  return {
    id,
    type: "port",
    hostname: "eth0",
    x: 0,
    y: 0,
    ...overrides,
  };
}

function makeLink(fromPortId, toPortId, { id = uid(), ...overrides } = {}) {
  return {
    id,
    type: "link",
    from: fromPortId,
    to: toPortId,
    ...overrides,
  };
}

/**
 * Builds a minimal topology with a switch, two hosts, two ports per node,
 * and a link between h1-eth0 and s1-eth0, and h2-eth0 and s1-eth1.
 * Returns { data, ids } where ids contains all relevant IDs.
 */
function buildMinimalTopology(dataOverrides = {}) {
  const s1 = makeSwitch({ hostname: "s1" });
  const h1 = makeHost({ hostname: "h1" });
  const h2 = makeHost({ hostname: "h2" });

  const s1Eth0 = makePort({ hostname: "eth0" });
  const s1Eth1 = makePort({ hostname: "eth1" });
  const h1Eth0 = makePort({ hostname: "eth0", ips: ["192.168.1.1/8"] });
  const h2Eth0 = makePort({ hostname: "eth0", ips: ["192.168.1.2/8"] });

  const items = [
    s1,
    h1,
    h2,
    s1Eth0,
    s1Eth1,
    h1Eth0,
    h2Eth0,
    makeAssociation(s1.id, s1Eth0.id),
    makeAssociation(s1.id, s1Eth1.id),
    makeAssociation(h1.id, h1Eth0.id),
    makeAssociation(h2.id, h2Eth0.id),
    makeLink(h1Eth0.id, s1Eth0.id),
    makeLink(h2Eth0.id, s1Eth1.id),
  ];

  return {
    data: { version: 0, items, ...dataOverrides },
    ids: { s1, h1, h2, s1Eth0, s1Eth1, h1Eth0, h2Eth0 },
  };
}

/**
 * Builds a simple topology with one switch (s1) and one host (h1),
 * each with one port (eth0), wired together via association + link.
 * Accepts optional overrides for host, switch, and ports, plus extra items.
 */
function buildSimpleTopology({
  hostOverrides,
  switchOverrides,
  h1PortOverrides,
  s1PortOverrides,
  extraItems = [],
} = {}) {
  const s1 = makeSwitch({ hostname: "s1", ...switchOverrides });
  const h1 = makeHost({ hostname: "h1", ...hostOverrides });
  const s1Eth0 = makePort({ hostname: "eth0", ...s1PortOverrides });
  const h1Eth0 = makePort({ hostname: "eth0", ...h1PortOverrides });

  const items = [
    s1,
    h1,
    s1Eth0,
    h1Eth0,
    makeAssociation(s1.id, s1Eth0.id),
    makeAssociation(h1.id, h1Eth0.id),
    makeLink(h1Eth0.id, s1Eth0.id),
    ...extraItems,
  ];

  return { version: 0, items };
}

function buildAndGetScript(data) {
  const builder = new Builder(JSON.parse(JSON.stringify(data)));
  return builder.build();
}

function removeNonCode(script) {
  return script
    .split("\n")
    .filter((line) => !/^($|#)/.test(line))
    .join("\n");
}

// --- Tests ---

describe("Builder", () => {
  beforeEach(() => {
    lastUid = 0;
  });

  describe("controller generation", () => {
    it("generates addController with hostname, type, IP, port, and protocol", ({
      expect,
    }) => {
      const ctrl = makeController({
        hostname: "c1",
        controllerType: "RemoteController",
        ip: "127.0.0.1",
        port: 6653,
        protocol: "tcp",
      });
      const s1 = makeSwitch({ hostname: "s1" });
      const s1Eth0 = makePort({ hostname: "eth0" });
      const h1 = makeHost({ hostname: "h1" });
      const h1Eth0 = makePort({ hostname: "eth0", ips: ["10.0.0.1/8"] });

      const items = [
        ctrl,
        s1,
        h1,
        s1Eth0,
        h1Eth0,
        makeAssociation(ctrl.id, s1.id),
        makeAssociation(s1.id, s1Eth0.id),
        makeAssociation(h1.id, h1Eth0.id),
        makeLink(h1Eth0.id, s1Eth0.id),
      ];

      const script = buildAndGetScript({ version: 0, items });

      expect(script).toContain(
        "c1 = net.addController('c1', controller=mininet.node.RemoteController, ip='127.0.0.1', port=6653, protocol='tcp')",
      );
      expect(script).toContain("c1.start()");
    });
  });

  describe("host generation", () => {
    it("generates addHost with hostname and default route", ({ expect }) => {
      const script = buildAndGetScript(
        buildSimpleTopology({ hostOverrides: { defaultRoute: "10.0.0.1" } }),
      );

      expect(script).toContain(
        "h1 = net.addHost('h1', ip=None, defaultRoute='via 10.0.0.1')",
      );
    });

    it("generates addHost with CPULimitedHost class when CPU settings present", ({
      expect,
    }) => {
      const s1 = makeSwitch({ hostname: "s1" });
      const h1 = makeHost({
        hostname: "h1",
        cpuScheduler: "cfs",
        cpuLimit: 0.5,
        cpuCores: [0, 1],
      });
      const s1Eth0 = makePort({ hostname: "eth0" });
      const h1Eth0 = makePort({ hostname: "eth0" });

      const items = [
        s1,
        h1,
        s1Eth0,
        h1Eth0,
        makeAssociation(s1.id, s1Eth0.id),
        makeAssociation(h1.id, h1Eth0.id),
        makeLink(h1Eth0.id, s1Eth0.id),
      ];

      const script = buildAndGetScript({ version: 0, items });

      expect(script).toContain("cls=mininet.node.CPULimitedHost");
      expect(script).toContain("h1.setCPUFrac(sched='cfs', f=0.5)");
      expect(script).toContain("h1.setCPUs(cores='0,1')");
    });
  });

  describe("switch generation", () => {
    it("generates addSwitch with hostname and optional parameters", ({
      expect,
    }) => {
      const s1 = makeSwitch({
        hostname: "s1",
        switchType: "OVSSwitch",
        dpid: "0000000000000001",
        protocol: "OpenFlow13",
        failMode: "secure",
        stp: true,
        batch: false,
        datapath: "kernel",
        dpctlPort: 6634,
        dpopts: "--extra",
        inNamespace: true,
        inband: false,
        ip: "10.0.0.100",
        opts: "-O",
        reconnectms: 5000,
        stpPriority: 32768,
        verbose: true,
      });
      const h1 = makeHost({ hostname: "h1" });
      const s1Eth0 = makePort({ hostname: "eth0" });
      const h1Eth0 = makePort({ hostname: "eth0" });

      const items = [
        s1,
        h1,
        s1Eth0,
        h1Eth0,
        makeAssociation(s1.id, s1Eth0.id),
        makeAssociation(h1.id, h1Eth0.id),
        makeLink(h1Eth0.id, s1Eth0.id),
      ];

      const script = buildAndGetScript({ version: 0, items });

      expect(script).toContain("net.addSwitch('s1'");
      expect(script).toContain("batch=False");
      expect(script).toContain("datapath='kernel'");
      expect(script).toContain("listenPort=6634");
      expect(script).toContain("dpid='0000000000000001'");
      expect(script).toContain("dpopts='--extra'");
      expect(script).toContain("failMode='secure'");
      expect(script).toContain("inNamespace=True");
      expect(script).toContain("inband=False");
      expect(script).toContain("ip='10.0.0.100'");
      expect(script).toContain("opts='-O'");
      expect(script).toContain("protocols='OpenFlow13'");
      expect(script).toContain("reconnectms=5000");
      expect(script).toContain("stp=True");
      expect(script).toContain("prio=32768");
      expect(script).toContain("cls=mininet.node.OVSSwitch");
      expect(script).toContain("verbose=True");
    });

    it("generates switch start with connected controller hostnames", ({
      expect,
    }) => {
      const ctrl = makeController({ hostname: "c1" });
      const s1 = makeSwitch({ hostname: "s1", switchType: "OVSSwitch" });
      const h1 = makeHost({ hostname: "h1" });
      const s1Eth0 = makePort({ hostname: "eth0" });
      const h1Eth0 = makePort({ hostname: "eth0" });

      const items = [
        ctrl,
        s1,
        h1,
        s1Eth0,
        h1Eth0,
        makeAssociation(ctrl.id, s1.id),
        makeAssociation(s1.id, s1Eth0.id),
        makeAssociation(h1.id, h1Eth0.id),
        makeLink(h1Eth0.id, s1Eth0.id),
      ];

      const script = buildAndGetScript({ version: 0, items });

      expect(script).toContain("s1.start([c1])");
    });
  });

  describe("link generation", () => {
    it("generates addLink with interface names and traffic control parameters", ({
      expect,
    }) => {
      const s1 = makeSwitch({ hostname: "s1" });
      const h1 = makeHost({ hostname: "h1" });
      const s1Eth0 = makePort({ hostname: "eth0" });
      const h1Eth0 = makePort({ hostname: "eth0" });

      const link = makeLink(h1Eth0.id, s1Eth0.id, {
        hostname: "link1",
        bandwidth: 10,
        delay: "10ms",
        loss: 5,
        maxQueueSize: 1000,
        jitter: "2ms",
      });

      const items = [
        s1,
        h1,
        s1Eth0,
        h1Eth0,
        makeAssociation(s1.id, s1Eth0.id),
        makeAssociation(h1.id, h1Eth0.id),
        link,
      ];

      const script = buildAndGetScript({ version: 0, items });

      expect(script).toContain(
        "net.addLink(h1, s1, intfName1='h1-eth0', intfName2='s1-eth0', bw=10, delay='10ms', loss=5, max_queue_size=1000, jitter='2ms')",
      );
    });
  });

  describe("port generation", () => {
    it("generates Intf creation for physical ports", ({ expect }) => {
      const s1 = makeSwitch({ hostname: "s1", switchType: "OVSBridge" });
      const h1 = makeHost({ hostname: "h1" });
      const s1Eth0 = makePort({ hostname: "eth0" });
      const h1Eth0 = makePort({ hostname: "eth0" });
      const h1Eth1 = makePort({
        hostname: "eth1",
        physical: true,
        ips: ["172.16.0.101/12"],
      });

      const items = [
        s1,
        h1,
        s1Eth0,
        h1Eth0,
        h1Eth1,
        makeAssociation(s1.id, s1Eth0.id),
        makeAssociation(h1.id, h1Eth0.id),
        makeAssociation(h1.id, h1Eth1.id),
        makeLink(h1Eth0.id, s1Eth0.id),
      ];

      const script = buildAndGetScript({ version: 0, items });

      expect(script).toContain("mininet.link.Intf('eth1', node=h1)");
    });

    it("generates IP address assignment commands for ports with IPs", ({
      expect,
    }) => {
      const { data } = buildMinimalTopology();
      const script = buildAndGetScript(data);

      // First IP on an interface sets .ip and .prefixLen
      expect(script).toContain("h1.intf('h1-eth0').ip = '192.168.1.1'");
      expect(script).toContain("h1.intf('h1-eth0').prefixLen = 8");
      expect(script).toContain("h1.cmd('ip a a 192.168.1.1/8 dev h1-eth0')");
    });
  });

  describe("global configuration", () => {
    it("includes log level setting in preInit when logLevel is specified", ({
      expect,
    }) => {
      const { data } = buildMinimalTopology({ logLevel: "debug" });
      const script = buildAndGetScript(data);

      expect(script).toContain("mininet.log.setLogLevel('debug')");
    });

    it("includes global start and stop script commands", ({ expect }) => {
      const { data } = buildMinimalTopology({
        startScript: "pingall\n",
        stopScript: "cleanup\n",
      });
      const script = buildAndGetScript(data);

      expect(script).toContain("cli.onecmd('pingall')");
      expect(script).toContain("cli.onecmd('cleanup')");
    });

    it.for([
      ["autoSetMAC", true, "autoSetMacs=True"],
      ["autoStaticARP", false, "autoStaticArp=False"],
      ["inNamespace", false, "inNamespace=False"],
      ["ipBase", "192.168.1.0/8", "ipBase='192.168.1.0/8'"],
      ["listenPortBase", 6634, "listenPort=6634"],
      ["spawnTerminals", true, "xterms=True"],
    ])(
      "includes Mininet constructor argument %s",
      ([configKey, configValue, expectedArg], { expect }) => {
        const { data } = buildMinimalTopology({
          [configKey]: configValue,
        });
        const script = buildAndGetScript(data);

        expect(script).toContain(expectedArg);
      },
    );
  });

  describe("error conditions", () => {
    it("throws Error on hostname collision", ({ expect }) => {
      const s1 = makeSwitch({ hostname: "s1" });
      const h1 = makeHost({ hostname: "s1" }); // collision with switch

      const items = [s1, h1];

      expect(() => buildAndGetScript({ version: 0, items })).toThrow(
        "Script building failure.",
      );
    });

    it("throws Error on devname collision", ({ expect }) => {
      // Two ports on the same node with the same hostname produce the same devname
      const s1 = makeSwitch({ hostname: "s1" });
      const h1 = makeHost({ hostname: "h1" });
      const s1Eth0a = makePort({ hostname: "eth0" });
      const s1Eth0b = makePort({ hostname: "eth0" });
      const h1Eth0 = makePort({ hostname: "eth0" });

      const items = [
        s1,
        h1,
        s1Eth0a,
        s1Eth0b,
        h1Eth0,
        makeAssociation(s1.id, s1Eth0a.id),
        makeAssociation(s1.id, s1Eth0b.id),
        makeAssociation(h1.id, h1Eth0.id),
        makeLink(h1Eth0.id, s1Eth0a.id),
        makeLink(s1Eth0b.id, s1Eth0b.id), // need a second link to trigger devname check
      ];

      expect(() => buildAndGetScript({ version: 0, items })).toThrow(
        "Script building failure.",
      );
    });

    it("throws Error when a single port has multiple links", ({ expect }) => {
      const s1 = makeSwitch({ hostname: "s1" });
      const h1 = makeHost({ hostname: "h1" });
      const h2 = makeHost({ hostname: "h2" });
      const s1Eth0 = makePort({ hostname: "eth0" });
      const s1Eth1 = makePort({ hostname: "eth1" });
      const h1Eth0 = makePort({ hostname: "eth0" });
      const h2Eth0 = makePort({ hostname: "eth0" });

      // h1Eth0 is used in two links -- triggers "Multiple links per port"
      const items = [
        s1,
        h1,
        h2,
        s1Eth0,
        s1Eth1,
        h1Eth0,
        h2Eth0,
        makeAssociation(s1.id, s1Eth0.id),
        makeAssociation(s1.id, s1Eth1.id),
        makeAssociation(h1.id, h1Eth0.id),
        makeAssociation(h2.id, h2Eth0.id),
        makeLink(h1Eth0.id, s1Eth0.id),
        makeLink(h1Eth0.id, s1Eth1.id), // h1Eth0 used twice
      ];

      expect(() => buildAndGetScript({ version: 0, items })).toThrow(
        "Script building failure.",
      );
    });

    it("throws Error when a physical port is connected to a link", ({
      expect,
    }) => {
      const s1 = makeSwitch({ hostname: "s1" });
      const h1 = makeHost({ hostname: "h1" });
      const s1Eth0 = makePort({ hostname: "eth0" });
      const h1Eth0 = makePort({ hostname: "eth0", physical: true });

      const items = [
        s1,
        h1,
        s1Eth0,
        h1Eth0,
        makeAssociation(s1.id, s1Eth0.id),
        makeAssociation(h1.id, h1Eth0.id),
        makeLink(h1Eth0.id, s1Eth0.id),
      ];

      expect(() => buildAndGetScript({ version: 0, items })).toThrow(
        "Script building failure.",
      );
    });
  });

  describe("edge cases", () => {
    it("logs warning for links connected to disconnected ports", ({
      expect,
    }) => {
      const s1 = makeSwitch({ hostname: "s1" });
      const h1 = makeHost({ hostname: "h1" });
      const s1Eth0 = makePort({ hostname: "eth0" });
      const h1Eth0 = makePort({ hostname: "eth0" });
      const disconnectedPort = makePort({ hostname: "eth9" });

      // The disconnected port link will either trigger multi-link or disconnected warning
      // Let's create a proper scenario: link between a disconnected port and a connected port
      const s1Eth1 = makePort({ hostname: "eth1" });
      const items2 = [
        s1,
        h1,
        s1Eth0,
        s1Eth1,
        h1Eth0,
        disconnectedPort,
        makeAssociation(s1.id, s1Eth0.id),
        makeAssociation(s1.id, s1Eth1.id),
        makeAssociation(h1.id, h1Eth0.id),
        makeLink(h1Eth0.id, s1Eth0.id),
        makeLink(disconnectedPort.id, s1Eth1.id),
      ];

      const builder = new Builder(
        JSON.parse(JSON.stringify({ version: 0, items: items2 })),
      );
      builder.build();

      const warningLogs = builder.log.filter((l) => l.severity === "warning");
      expect(warningLogs.length).toBeGreaterThan(0);
      expect(warningLogs[0].msg).toContain("disconnected port");
    });

    it("skips ports not connected to any node", ({ expect }) => {
      const s1 = makeSwitch({ hostname: "s1" });
      const h1 = makeHost({ hostname: "h1" });
      const s1Eth0 = makePort({ hostname: "eth0" });
      const h1Eth0 = makePort({ hostname: "eth0" });
      const orphanPort = makePort({ hostname: "orphan0" });

      const items = [
        s1,
        h1,
        s1Eth0,
        h1Eth0,
        orphanPort, // not associated with any node
        makeAssociation(s1.id, s1Eth0.id),
        makeAssociation(h1.id, h1Eth0.id),
        makeLink(h1Eth0.id, s1Eth0.id),
      ];

      const builder = new Builder(
        JSON.parse(JSON.stringify({ version: 0, items })),
      );
      const script = builder.build();

      // The orphan port should be skipped with an info log
      const infoLogs = builder.log.filter((l) => l.severity === "info");
      expect(infoLogs.length).toBeGreaterThan(0);
      expect(infoLogs[0].msg).toContain("not connected to any node");
      // The orphan port should not appear as Intf or addLink in the script
      expect(script).not.toContain("mininet.link.Intf('orphan0'");
      expect(script).not.toContain("intfName1='orphan0'");
      expect(script).not.toContain("intfName2='orphan0'");
    });
  });

  describe("integration with example data", () => {
    it("generates complete script from tiny_controller example", async ({
      expect,
    }) => {
      const { default: data } = await import("@/examples/tiny_controller.json");
      const script = buildAndGetScript(data);

      // Verify script structure
      expect(script).toContain("#!/usr/bin/env python2");
      expect(script).toContain("from mininet.cli import CLI");
      expect(script).toContain("from mininet.net import Mininet");

      // Controller
      expect(script).toContain("net.addController('c1'");
      expect(script).toContain("controller=mininet.node.RemoteController");
      expect(script).toContain("ip='127.0.0.1'");
      expect(script).toContain("port=6653");

      // Switch
      expect(script).toContain("net.addSwitch('s1'");

      // Hosts
      expect(script).toContain("net.addHost('h1'");
      expect(script).toContain("net.addHost('h2'");

      // Links
      expect(script).toContain("net.addLink(h1, s1");
      expect(script).toContain("net.addLink(h2, s1");

      // IPs
      expect(script).toContain("192.168.1.1");
      expect(script).toContain("192.168.1.2");

      // Start script
      expect(script).toContain("cli.onecmd('pingall')");

      // Network lifecycle
      expect(script).toContain("net.build()");
      expect(script).toContain("cli.run()");
      expect(script).toContain("net.stop()");
    });
  });

  describe("log formatting", () => {
    it("prefixes log messages with '# ' via _log regex", ({ expect }) => {
      const s1 = makeSwitch({ hostname: "s1" });
      const h1 = makeHost({ hostname: "s1" }); // hostname collision

      const builder = new Builder(
        JSON.parse(JSON.stringify({ version: 0, items: [s1, h1] })),
      );

      try {
        builder.build();
      } catch {
        // expected
      }

      // The _log method uses /^(.*)$/gm to prefix each line with "# "
      // Check the builder log entries have the expected messages
      expect(builder.log.length).toBeGreaterThan(0);
      expect(builder.log[0].msg).toContain("conflicting hostname");

      // Render the script via the public Code.toString() and assert
      // the Log section's content lines are all prefixed with "# ".
      const script = builder._code.toString();
      const logBlock = extractLogBlock(script);
      expect(logBlock.length).toBeGreaterThan(0);
      logBlock.forEach((line) => {
        expect(line).toMatch(/^# /);
      });
      // And the conflict message text appears in the rendered log block.
      expect(logBlock.join("\n")).toContain("conflicting hostname");
    });

    it("prefixes multi-line log messages with '# ' on each line", ({
      expect,
    }) => {
      // Create a scenario that generates a log message
      const s1 = makeSwitch({ hostname: "s1" });
      const h1 = makeHost({ hostname: "h1" });
      const s1Eth0 = makePort({ hostname: "eth0" });
      const h1Eth0 = makePort({ hostname: "eth0" });
      const orphanPort = makePort({ hostname: "orphan0" });

      const items = [
        s1,
        h1,
        s1Eth0,
        h1Eth0,
        orphanPort,
        makeAssociation(s1.id, s1Eth0.id),
        makeAssociation(h1.id, h1Eth0.id),
        makeLink(h1Eth0.id, s1Eth0.id),
      ];

      const builder = new Builder(
        JSON.parse(JSON.stringify({ version: 0, items })),
      );
      builder.build();

      // Verify each rendered log line (including multi-line messages)
      // starts with "# " in the rendered Python script's Log section.
      const script = builder._code.toString();
      const logBlock = extractLogBlock(script);
      expect(logBlock.length).toBeGreaterThan(0);
      logBlock.forEach((line) => {
        expect(line).toMatch(/^# /);
      });
    });
  });

  describe("script command generation (_scriptToCmds)", () => {
    it("filters out comment lines starting with # from scripts", ({
      expect,
    }) => {
      const { data } = buildMinimalTopology({
        startScript: "# This is a comment\npingall\n",
      });
      const script = buildAndGetScript(data);

      expect(script).toContain("cli.onecmd('pingall')");
      expect(script).not.toContain("cli.onecmd('# This is a comment')");
    });

    it("filters out empty lines from scripts", ({ expect }) => {
      const { data } = buildMinimalTopology({
        startScript: "pingall\n\nlinks\n",
      });
      const script = buildAndGetScript(data);

      expect(script).toContain("cli.onecmd('pingall')");
      expect(script).toContain("cli.onecmd('links')");
    });

    it("generates debug log lines with [mininet] prefix for global scripts", ({
      expect,
    }) => {
      const { data } = buildMinimalTopology({
        startScript: "pingall\n",
      });
      const script = buildAndGetScript(data);

      expect(script).toContain("mininet.log.debug('[mininet]> pingall\\n')");
    });

    it("generates debug log lines with node hostname prefix for node scripts", ({
      expect,
    }) => {
      const s1 = makeSwitch({ hostname: "s1" });
      const h1 = makeHost({
        hostname: "h1",
        startScript: "ifconfig\n",
      });
      const s1Eth0 = makePort({ hostname: "eth0" });
      const h1Eth0 = makePort({ hostname: "eth0" });

      const items = [
        s1,
        h1,
        s1Eth0,
        h1Eth0,
        makeAssociation(s1.id, s1Eth0.id),
        makeAssociation(h1.id, h1Eth0.id),
        makeLink(h1Eth0.id, s1Eth0.id),
      ];

      const script = buildAndGetScript({ version: 0, items });

      expect(script).toContain("mininet.log.debug('h1> ifconfig\\n')");
      expect(script).toContain("h1.cmdPrint('ifconfig')");
    });

    it("generates cmdPrint for node scripts instead of cli.onecmd", ({
      expect,
    }) => {
      const s1 = makeSwitch({ hostname: "s1" });
      const h1 = makeHost({
        hostname: "h1",
        startScript: "echo hello\n",
      });
      const s1Eth0 = makePort({ hostname: "eth0" });
      const h1Eth0 = makePort({ hostname: "eth0" });

      const items = [
        s1,
        h1,
        s1Eth0,
        h1Eth0,
        makeAssociation(s1.id, s1Eth0.id),
        makeAssociation(h1.id, h1Eth0.id),
        makeLink(h1Eth0.id, s1Eth0.id),
      ];

      const script = buildAndGetScript({ version: 0, items });

      expect(script).toContain("h1.cmdPrint('echo hello')");
      expect(script).not.toContain("cli.onecmd('echo hello')");
    });
  });

  describe("node start and stop scripts", () => {
    it("generates node start script commands in the correct section", ({
      expect,
    }) => {
      const s1 = makeSwitch({
        hostname: "s1",
        startScript: "ovs-vsctl show\n",
      });
      const h1 = makeHost({ hostname: "h1" });
      const s1Eth0 = makePort({ hostname: "eth0" });
      const h1Eth0 = makePort({ hostname: "eth0" });

      const items = [
        s1,
        h1,
        s1Eth0,
        h1Eth0,
        makeAssociation(s1.id, s1Eth0.id),
        makeAssociation(h1.id, h1Eth0.id),
        makeLink(h1Eth0.id, s1Eth0.id),
      ];

      const script = buildAndGetScript({ version: 0, items });

      expect(script).toContain("s1.cmdPrint('ovs-vsctl show')");
      expect(script).toContain("mininet.log.debug('s1> ovs-vsctl show\\n')");
    });

    it("generates node stop script commands", ({ expect }) => {
      const s1 = makeSwitch({ hostname: "s1", stopScript: "cleanup\n" });
      const h1 = makeHost({ hostname: "h1" });
      const s1Eth0 = makePort({ hostname: "eth0" });
      const h1Eth0 = makePort({ hostname: "eth0" });

      const items = [
        s1,
        h1,
        s1Eth0,
        h1Eth0,
        makeAssociation(s1.id, s1Eth0.id),
        makeAssociation(h1.id, h1Eth0.id),
        makeLink(h1Eth0.id, s1Eth0.id),
      ];

      const script = buildAndGetScript({ version: 0, items });

      expect(script).toContain("s1.cmdPrint('cleanup')");
    });

    it("generates both start and stop scripts for a host node", ({
      expect,
    }) => {
      const s1 = makeSwitch({ hostname: "s1" });
      const h1 = makeHost({
        hostname: "h1",
        startScript: "echo start\n",
        stopScript: "echo stop\n",
      });
      const s1Eth0 = makePort({ hostname: "eth0" });
      const h1Eth0 = makePort({ hostname: "eth0" });

      const items = [
        s1,
        h1,
        s1Eth0,
        h1Eth0,
        makeAssociation(s1.id, s1Eth0.id),
        makeAssociation(h1.id, h1Eth0.id),
        makeLink(h1Eth0.id, s1Eth0.id),
      ];

      const script = buildAndGetScript({ version: 0, items });

      expect(script).toContain("h1.cmdPrint('echo start')");
      expect(script).toContain("h1.cmdPrint('echo stop')");
    });
  });

  describe("global stop script", () => {
    it("generates global stop script commands with cli.onecmd", ({
      expect,
    }) => {
      const { data } = buildMinimalTopology({
        stopScript: "net\nlinks\n",
      });
      const script = buildAndGetScript(data);

      expect(script).toContain("cli.onecmd('net')");
      expect(script).toContain("cli.onecmd('links')");
      expect(script).toContain("mininet.log.debug('[mininet]> net\\n')");
      expect(script).toContain("mininet.log.debug('[mininet]> links\\n')");
    });
  });

  describe("error message details", () => {
    it("logs specific conflicting hostname error messages for each colliding node", ({
      expect,
    }) => {
      const s1 = makeSwitch({ hostname: "clash" });
      const h1 = makeHost({ hostname: "clash" });

      const builder = new Builder(
        JSON.parse(JSON.stringify({ version: 0, items: [s1, h1] })),
      );

      try {
        builder.build();
      } catch {
        // expected
      }

      const errorLogs = builder.log.filter((l) => l.severity === "error");
      expect(errorLogs.length).toBeGreaterThanOrEqual(2);
      // Both the switch and host should be logged as conflicting
      const messages = errorLogs.map((l) => l.msg);
      expect(messages).toEqual(
        expect.arrayContaining([
          expect.stringContaining("switch/clash"),
          expect.stringContaining("host/clash"),
        ]),
      );
      expect(messages[0]).toContain("conflicting hostname");
    });

    it("logs devname collision error messages with the conflicting interface name", ({
      expect,
    }) => {
      const s1 = makeSwitch({ hostname: "s1" });
      const h1 = makeHost({ hostname: "h1" });
      // Two ports that will generate the same devname (s1-eth0)
      const s1Eth0a = makePort({ hostname: "eth0" });
      const s1Eth0b = makePort({ hostname: "eth0" });
      const h1Eth0 = makePort({ hostname: "eth0" });

      const items = [
        s1,
        h1,
        s1Eth0a,
        s1Eth0b,
        h1Eth0,
        makeAssociation(s1.id, s1Eth0a.id),
        makeAssociation(s1.id, s1Eth0b.id),
        makeAssociation(h1.id, h1Eth0.id),
        makeLink(h1Eth0.id, s1Eth0a.id),
        makeLink(s1Eth0b.id, s1Eth0b.id),
      ];

      const builder = new Builder(
        JSON.parse(JSON.stringify({ version: 0, items })),
      );

      try {
        builder.build();
      } catch {
        // expected
      }

      const errorLogs = builder.log.filter((l) => l.severity === "error");
      expect(errorLogs.length).toBeGreaterThan(0);
      // Check for interface name in message
      const devnameMessages = errorLogs.filter((l) =>
        l.msg.includes("conflicting interface name"),
      );
      expect(devnameMessages.length).toBeGreaterThan(0);
      expect(devnameMessages[0].msg).toContain("s1-eth0");
    });

    it("logs multiple links per port error message with port details", ({
      expect,
    }) => {
      const s1 = makeSwitch({ hostname: "s1" });
      const h1 = makeHost({ hostname: "h1" });
      const h2 = makeHost({ hostname: "h2" });
      const s1Eth0 = makePort({ hostname: "eth0" });
      const s1Eth1 = makePort({ hostname: "eth1" });
      const h1Eth0 = makePort({ hostname: "eth0" });
      const h2Eth0 = makePort({ hostname: "eth0" });

      const items = [
        s1,
        h1,
        h2,
        s1Eth0,
        s1Eth1,
        h1Eth0,
        h2Eth0,
        makeAssociation(s1.id, s1Eth0.id),
        makeAssociation(s1.id, s1Eth1.id),
        makeAssociation(h1.id, h1Eth0.id),
        makeAssociation(h2.id, h2Eth0.id),
        makeLink(h1Eth0.id, s1Eth0.id),
        makeLink(h1Eth0.id, s1Eth1.id),
      ];

      const builder = new Builder(
        JSON.parse(JSON.stringify({ version: 0, items })),
      );

      try {
        builder.build();
      } catch {
        // expected
      }

      const errorLogs = builder.log.filter((l) => l.severity === "error");
      expect(errorLogs.length).toBeGreaterThan(0);
      expect(errorLogs[0].msg).toContain("single port has multiple links");
      expect(errorLogs[0].msg).toContain("port/eth0");
    });

    it("logs physical port connected to a link error message", ({ expect }) => {
      const s1 = makeSwitch({ hostname: "s1" });
      const h1 = makeHost({ hostname: "h1" });
      const s1Eth0 = makePort({ hostname: "eth0" });
      const h1Eth0 = makePort({ hostname: "phys0", physical: true });

      const items = [
        s1,
        h1,
        s1Eth0,
        h1Eth0,
        makeAssociation(s1.id, s1Eth0.id),
        makeAssociation(h1.id, h1Eth0.id),
        makeLink(h1Eth0.id, s1Eth0.id),
      ];

      const builder = new Builder(
        JSON.parse(JSON.stringify({ version: 0, items })),
      );

      try {
        builder.build();
      } catch {
        // expected
      }

      const errorLogs = builder.log.filter((l) => l.severity === "error");
      expect(errorLogs.length).toBeGreaterThan(0);
      expect(errorLogs[0].msg).toContain(
        "port can't be both physical and connected to a link",
      );
      expect(errorLogs[0].msg).toContain("port/phys0");
    });
  });

  describe("port skipping conditions", () => {
    it("logs info when port is neither physical nor connected to a link", ({
      expect,
    }) => {
      const s1 = makeSwitch({ hostname: "s1" });
      const h1 = makeHost({ hostname: "h1" });
      const s1Eth0 = makePort({ hostname: "eth0" });
      const h1Eth0 = makePort({ hostname: "eth0" });
      // A port connected to a node but with no link and not physical
      const h1Eth1 = makePort({ hostname: "eth1" });

      const items = [
        s1,
        h1,
        s1Eth0,
        h1Eth0,
        h1Eth1,
        makeAssociation(s1.id, s1Eth0.id),
        makeAssociation(h1.id, h1Eth0.id),
        makeAssociation(h1.id, h1Eth1.id),
        makeLink(h1Eth0.id, s1Eth0.id),
      ];

      const builder = new Builder(
        JSON.parse(JSON.stringify({ version: 0, items })),
      );
      builder.build();

      const infoLogs = builder.log.filter((l) => l.severity === "info");
      const portSkipMsg = infoLogs.find((l) =>
        l.msg.includes("port has to be either physical or connected to a link"),
      );
      expect(portSkipMsg).toBeDefined();
      expect(portSkipMsg.msg).toContain("port/eth1");
    });
  });

  describe("host CPU configuration variants", () => {
    it("generates setCPUFrac with only cpuScheduler (no cpuLimit)", ({
      expect,
    }) => {
      const s1 = makeSwitch({ hostname: "s1" });
      const h1 = makeHost({ hostname: "h1", cpuScheduler: "rt" });
      const s1Eth0 = makePort({ hostname: "eth0" });
      const h1Eth0 = makePort({ hostname: "eth0" });

      const items = [
        s1,
        h1,
        s1Eth0,
        h1Eth0,
        makeAssociation(s1.id, s1Eth0.id),
        makeAssociation(h1.id, h1Eth0.id),
        makeLink(h1Eth0.id, s1Eth0.id),
      ];

      const script = buildAndGetScript({ version: 0, items });

      expect(script).toContain("h1.setCPUFrac(sched='rt')");
      expect(script).toContain("cls=mininet.node.CPULimitedHost");
    });

    it("generates setCPUFrac with only cpuLimit (no cpuScheduler)", ({
      expect,
    }) => {
      const s1 = makeSwitch({ hostname: "s1" });
      const h1 = makeHost({ hostname: "h1", cpuLimit: 0.25 });
      const s1Eth0 = makePort({ hostname: "eth0" });
      const h1Eth0 = makePort({ hostname: "eth0" });

      const items = [
        s1,
        h1,
        s1Eth0,
        h1Eth0,
        makeAssociation(s1.id, s1Eth0.id),
        makeAssociation(h1.id, h1Eth0.id),
        makeLink(h1Eth0.id, s1Eth0.id),
      ];

      const script = buildAndGetScript({ version: 0, items });

      expect(script).toContain("h1.setCPUFrac(f=0.25)");
      expect(script).toContain("cls=mininet.node.CPULimitedHost");
    });

    it("generates setCPUs with only cpuCores (no scheduler or limit)", ({
      expect,
    }) => {
      const s1 = makeSwitch({ hostname: "s1" });
      const h1 = makeHost({ hostname: "h1", cpuCores: [2, 3] });
      const s1Eth0 = makePort({ hostname: "eth0" });
      const h1Eth0 = makePort({ hostname: "eth0" });

      const items = [
        s1,
        h1,
        s1Eth0,
        h1Eth0,
        makeAssociation(s1.id, s1Eth0.id),
        makeAssociation(h1.id, h1Eth0.id),
        makeLink(h1Eth0.id, s1Eth0.id),
      ];

      const script = buildAndGetScript({ version: 0, items });

      expect(script).toContain("h1.setCPUs(cores='2,3')");
      expect(script).toContain("cls=mininet.node.CPULimitedHost");
      // Should NOT have setCPUFrac without scheduler or limit
      expect(script).not.toContain("h1.setCPUFrac(");
    });
  });

  describe("multiple IPs per port", () => {
    it("sets .ip and .prefixLen only for the first IP on an interface", ({
      expect,
    }) => {
      const s1 = makeSwitch({ hostname: "s1" });
      const h1 = makeHost({ hostname: "h1" });
      const s1Eth0 = makePort({ hostname: "eth0" });
      const h1Eth0 = makePort({
        hostname: "eth0",
        ips: ["10.0.0.1/24", "10.0.0.2/24", "10.0.0.3/24"],
      });

      const items = [
        s1,
        h1,
        s1Eth0,
        h1Eth0,
        makeAssociation(s1.id, s1Eth0.id),
        makeAssociation(h1.id, h1Eth0.id),
        makeLink(h1Eth0.id, s1Eth0.id),
      ];

      const script = buildAndGetScript({ version: 0, items });

      // First IP: sets .ip, .prefixLen, and ip a a
      expect(script).toContain("h1.intf('h1-eth0').ip = '10.0.0.1'");
      expect(script).toContain("h1.intf('h1-eth0').prefixLen = 24");
      expect(script).toContain("h1.cmd('ip a a 10.0.0.1/24 dev h1-eth0')");

      // Second and third IPs: only ip a a, no .ip or .prefixLen
      expect(script).toContain("h1.cmd('ip a a 10.0.0.2/24 dev h1-eth0')");
      expect(script).toContain("h1.cmd('ip a a 10.0.0.3/24 dev h1-eth0')");

      // Verify .ip is set only once for this interface (for 10.0.0.1)
      const ipAssignments = script.match(/h1\.intf\('h1-eth0'\)\.ip = /g);
      expect(ipAssignments).toHaveLength(1);
    });

    it("uses physical port hostname as dev when port is physical with multiple IPs", ({
      expect,
    }) => {
      const s1 = makeSwitch({ hostname: "s1" });
      const h1 = makeHost({ hostname: "h1" });
      const s1Eth0 = makePort({ hostname: "eth0" });
      const h1Eth0 = makePort({ hostname: "eth0" });
      const h1Phys = makePort({
        hostname: "enp0s3",
        physical: true,
        ips: ["192.168.1.100/24", "192.168.1.101/24"],
      });

      const items = [
        s1,
        h1,
        s1Eth0,
        h1Eth0,
        h1Phys,
        makeAssociation(s1.id, s1Eth0.id),
        makeAssociation(h1.id, h1Eth0.id),
        makeAssociation(h1.id, h1Phys.id),
        makeLink(h1Eth0.id, s1Eth0.id),
      ];

      const script = buildAndGetScript({ version: 0, items });

      // Physical port uses hostname directly as dev, not node-port
      expect(script).toContain("h1.intf('enp0s3').ip = '192.168.1.100'");
      expect(script).toContain("h1.intf('enp0s3').prefixLen = 24");
      expect(script).toContain("h1.cmd('ip a a 192.168.1.100/24 dev enp0s3')");
      expect(script).toContain("h1.cmd('ip a a 192.168.1.101/24 dev enp0s3')");
    });
  });

  describe("link with disconnected ports", () => {
    it("logs warning when both ports of a link are disconnected from nodes", ({
      expect,
    }) => {
      const s1 = makeSwitch({ hostname: "s1" });
      const h1 = makeHost({ hostname: "h1" });
      const s1Eth0 = makePort({ hostname: "eth0" });
      const h1Eth0 = makePort({ hostname: "eth0" });
      // Two disconnected ports linked to each other
      const dp1 = makePort({ hostname: "dp1" });
      const dp2 = makePort({ hostname: "dp2" });

      const items = [
        s1,
        h1,
        s1Eth0,
        h1Eth0,
        dp1,
        dp2,
        makeAssociation(s1.id, s1Eth0.id),
        makeAssociation(h1.id, h1Eth0.id),
        makeLink(h1Eth0.id, s1Eth0.id),
        makeLink(dp1.id, dp2.id),
      ];

      const builder = new Builder(
        JSON.parse(JSON.stringify({ version: 0, items })),
      );
      builder.build();

      const warningLogs = builder.log.filter((l) => l.severity === "warning");
      // Should have warnings about both disconnected ports
      expect(warningLogs.length).toBeGreaterThanOrEqual(1);
      const linkWarning = warningLogs.find((l) =>
        l.msg.includes("disconnected port"),
      );
      expect(linkWarning).toBeDefined();

      // Should also have warnings for the individual disconnected ports
      const portWarnings = warningLogs.filter((l) =>
        l.msg.includes("port can't be connected to a link but not to a node"),
      );
      expect(portWarnings.length).toBe(2);
    });
  });

  describe("script structure", () => {
    it("includes Python shebang line and encoding header", ({ expect }) => {
      const { data } = buildMinimalTopology();
      const script = buildAndGetScript(data);

      expect(script).toMatch(/^#!/);
      expect(script).toContain("#!/usr/bin/env python2");
      expect(script).toContain("# -*- coding: utf-8 -*-");
    });

    it("includes all required Python imports", ({ expect }) => {
      const { data } = buildMinimalTopology();
      const script = buildAndGetScript(data);

      expect(script).toContain("from mininet.cli import CLI");
      expect(script).toContain("from mininet.net import Mininet");
      expect(script).toContain("import mininet.link");
      expect(script).toContain("import mininet.log");
      expect(script).toContain("import mininet.node");
    });

    it("includes Mininet initialization with default arguments", ({
      expect,
    }) => {
      const { data } = buildMinimalTopology();
      const script = buildAndGetScript(data);

      expect(script).toContain("net = Mininet(");
      expect(script).toContain("build=False");
      expect(script).toContain("controller=mininet.node.RemoteController");
      expect(script).toContain("link=mininet.link.TCLink");
      expect(script).toContain("topo=None");
    });

    it("includes CLI initialization", ({ expect }) => {
      const { data } = buildMinimalTopology();
      const script = buildAndGetScript(data);

      expect(script).toContain("cli = CLI(net, script='/dev/null')");
    });

    it("includes vim modeline at the end", ({ expect }) => {
      const { data } = buildMinimalTopology();
      const script = buildAndGetScript(data);

      expect(script).toContain("# vim:fdm=marker");
    });

    it("includes section markers with fold markers", ({ expect }) => {
      const { data } = buildMinimalTopology();
      const script = buildAndGetScript(data);

      expect(script).toContain("# Add nodes {{{");
      expect(script).toContain("# Add links {{{");
      expect(script).toContain("# Add IP addresses {{{");
      expect(script).toContain("# Build the network {{{");
      expect(script).toContain("# Start CLI {{{");
      expect(script).toContain("# Finish {{{");
      expect(script).toContain("# }}}");
    });

    it("includes log info messages for non-silent sections", ({ expect }) => {
      const { data } = buildMinimalTopology();
      const script = buildAndGetScript(data);

      expect(script).toContain("mininet.log.info('\\n*** Add nodes\\n')");
      expect(script).toContain("mininet.log.info('\\n*** Add links\\n')");
      expect(script).toContain(
        "mininet.log.info('\\n*** Build the network\\n')",
      );
    });
  });

  describe("controller without optional params", () => {
    it("generates addController with hostname only when no type/ip/port/protocol", ({
      expect,
    }) => {
      const ctrl = makeController({ hostname: "c0" });
      const s1 = makeSwitch({ hostname: "s1" });
      const h1 = makeHost({ hostname: "h1" });
      const s1Eth0 = makePort({ hostname: "eth0" });
      const h1Eth0 = makePort({ hostname: "eth0" });

      const items = [
        ctrl,
        s1,
        h1,
        s1Eth0,
        h1Eth0,
        makeAssociation(ctrl.id, s1.id),
        makeAssociation(s1.id, s1Eth0.id),
        makeAssociation(h1.id, h1Eth0.id),
        makeLink(h1Eth0.id, s1Eth0.id),
      ];

      const script = buildAndGetScript({ version: 0, items });

      expect(script).toContain("c0 = net.addController('c0')");
      expect(script).toContain("c0.start()");
    });
  });

  describe("switch without optional params", () => {
    it("generates addSwitch with hostname only", ({ expect }) => {
      const s1 = makeSwitch({ hostname: "sw1" });
      const h1 = makeHost({ hostname: "h1" });
      const s1Eth0 = makePort({ hostname: "eth0" });
      const h1Eth0 = makePort({ hostname: "eth0" });

      const items = [
        s1,
        h1,
        s1Eth0,
        h1Eth0,
        makeAssociation(s1.id, s1Eth0.id),
        makeAssociation(h1.id, h1Eth0.id),
        makeLink(h1Eth0.id, s1Eth0.id),
      ];

      const script = buildAndGetScript({ version: 0, items });

      expect(script).toContain("sw1 = net.addSwitch('sw1')");
      expect(script).toContain("sw1.start([])");
    });
  });

  describe("host without default route", () => {
    it("generates addHost with hostname and ip=None only", ({ expect }) => {
      const s1 = makeSwitch({ hostname: "s1" });
      const h1 = makeHost({ hostname: "h1" });
      const s1Eth0 = makePort({ hostname: "eth0" });
      const h1Eth0 = makePort({ hostname: "eth0" });

      const items = [
        s1,
        h1,
        s1Eth0,
        h1Eth0,
        makeAssociation(s1.id, s1Eth0.id),
        makeAssociation(h1.id, h1Eth0.id),
        makeLink(h1Eth0.id, s1Eth0.id),
      ];

      const script = buildAndGetScript({ version: 0, items });

      expect(script).toContain("h1 = net.addHost('h1', ip=None)");
      expect(script).not.toContain("defaultRoute");
    });
  });

  describe("link without traffic control parameters", () => {
    it("generates addLink with only node names and interface names", ({
      expect,
    }) => {
      const s1 = makeSwitch({ hostname: "s1" });
      const h1 = makeHost({ hostname: "h1" });
      const s1Eth0 = makePort({ hostname: "eth0" });
      const h1Eth0 = makePort({ hostname: "eth0" });

      const items = [
        s1,
        h1,
        s1Eth0,
        h1Eth0,
        makeAssociation(s1.id, s1Eth0.id),
        makeAssociation(h1.id, h1Eth0.id),
        makeLink(h1Eth0.id, s1Eth0.id),
      ];

      const script = buildAndGetScript({ version: 0, items });

      expect(script).toContain(
        "net.addLink(h1, s1, intfName1='h1-eth0', intfName2='s1-eth0')",
      );
      expect(script).not.toContain("bw=");
      expect(script).not.toContain("delay=");
      expect(script).not.toContain("loss=");
    });
  });

  describe("log level omission", () => {
    it("does not include setLogLevel when logLevel is not specified", ({
      expect,
    }) => {
      const { data } = buildMinimalTopology();
      const script = buildAndGetScript(data);

      expect(script).not.toContain("setLogLevel");
    });
  });

  describe("scripts omission", () => {
    it("does not include start or stop script sections when not specified", ({
      expect,
    }) => {
      const { data } = buildMinimalTopology();
      const script = buildAndGetScript(data);

      // No global start commands, so section should not appear
      expect(script).not.toContain("cli.onecmd(");
    });
  });

  describe("full script fixture comparison", () => {
    it("builds the expected script from medium_2_controllers example", ({
      expect,
    }) => {
      const script = new Builder(
        JSON.parse(JSON.stringify(medium2Controllers)),
      ).build();
      const correctScript = readFileSync(
        resolve(import.meta.dirname, "../../tests/unit/fixtures/me-script.py"),
        "utf-8",
      );

      expect(typeof script).toBe("string");
      expect(removeNonCode(script)).toEqual(removeNonCode(correctScript));
    });
  });
});
