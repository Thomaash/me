import { describe, it, expect } from "vitest";
import importScript from "@/importScript/index.js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Helper: extract items by type from result
function itemsByType(items, type) {
  return items.filter((item) => item.type === type);
}

// Helper: find item by type and hostname
function findItem(items, type, hostname) {
  return items.find((item) => item.type === type && item.hostname === hostname);
}

// getCleanItems helper (from exportImportCommon.js)
function getCleanItems(items, typeOnly) {
  return items
    .filter((node) => !typeOnly || node.type === typeOnly)
    .map((orig) => {
      const type = orig.type;
      const isEdge = type === "link" || type === "association";
      const clean = {};
      Object.keys(orig).forEach((key) => {
        if (type === "port" && key === "ips") {
          clean[key] = orig[key].toSorted();
        } else if (key === "startScript" || key === "stopScript") {
          clean[key] = orig[key]
            .split("\n")
            .filter((line) => !/^(\s*#|$)/.test(line))
            .join("\n");
        } else if (
          (isEdge && !/^(id|hostname|from|to)$/.test(key)) ||
          (!isEdge && !/^(id|x|y)$/.test(key))
        ) {
          clean[key] = orig[key];
        }
      });
      return clean;
    });
}

// Helper: strip id/x/y from items for comparison (edges strip id/hostname/from/to)
function cleanItem(item) {
  const clean = {};
  const isEdge = item.type === "link" || item.type === "association";
  Object.keys(item).forEach((key) => {
    if (isEdge && /^(id|hostname|from|to)$/.test(key)) return;
    if (!isEdge && /^(id|x|y)$/.test(key)) return;
    clean[key] = item[key];
  });
  return clean;
}

describe.concurrent("importScript", () => {
  describe("return structure", () => {
    it("returns an object with log array and data object containing version, items, startScript, stopScript", ({
      expect,
    }) => {
      const script = `
net = Mininet(topo=None, build=False)
h1 = net.addHost('h1')
net.build()
CLI(net)
net.stop()
`;
      const result = importScript(script);

      expect(result).toHaveProperty("log");
      expect(result).toHaveProperty("data");
      expect(Array.isArray(result.log)).toBe(true);
      expect(result.data).toHaveProperty("version", 0);
      expect(Array.isArray(result.data.items)).toBe(true);
      expect(result.data).toHaveProperty("startScript");
      expect(result.data).toHaveProperty("stopScript");
    });
  });

  describe("addHost parsing", () => {
    it("extracts hostname and IP from addHost calls", ({ expect }) => {
      const script = `
net = Mininet(topo=None, build=False)
h1 = net.addHost('h1', ip='10.0.0.1/8')
h2 = net.addHost('h2', ip='10.0.0.2/8', defaultRoute='via 10.0.0.1')
net.build()
CLI(net)
net.stop()
`;
      const result = importScript(script);
      const hosts = itemsByType(result.data.items, "host");

      expect(hosts).toHaveLength(2);
      expect(findItem(result.data.items, "host", "h1")).toBeDefined();
      expect(findItem(result.data.items, "host", "h2")).toMatchObject({
        type: "host",
        hostname: "h2",
        defaultRoute: "10.0.0.1",
      });
    });
  });

  describe("addSwitch parsing", () => {
    it("extracts hostname, switchType, and switch properties from addSwitch calls", ({
      expect,
    }) => {
      const script = `
from mininet.node import OVSKernelSwitch, UserSwitch
net = Mininet(topo=None, build=False)
s1 = net.addSwitch('s1', cls=OVSKernelSwitch, listenPort=12345, dpid='acdc', protocols='OpenFlow13')
s2 = net.addSwitch('s2', cls=UserSwitch, failMode='standalone', inNamespace=True)
net.build()
CLI(net)
net.stop()
`;
      const result = importScript(script);
      const switches = itemsByType(result.data.items, "switch");

      expect(switches).toHaveLength(2);

      const s1 = findItem(result.data.items, "switch", "s1");
      expect(s1).toMatchObject({
        type: "switch",
        hostname: "s1",
        switchType: "OVSSwitch",
        dpctlPort: 12345,
        dpid: "acdc",
        protocol: "OpenFlow13",
      });

      const s2 = findItem(result.data.items, "switch", "s2");
      expect(s2).toMatchObject({
        type: "switch",
        hostname: "s2",
        switchType: "UserSwitch",
        failMode: "standalone",
        inNamespace: true,
      });
    });
  });

  describe("addController parsing", () => {
    it("extracts hostname, controllerType, ip, port, and protocol from addController calls", ({
      expect,
    }) => {
      const script = `
from mininet.node import RemoteController, OVSController
net = Mininet(topo=None, build=False)
c1 = net.addController(name='c1', controller=RemoteController, ip='127.0.0.1', port=6653, protocol='tcp')
c2 = net.addController(name='c2', controller=OVSController, port=6633)
net.build()
CLI(net)
net.stop()
`;
      const result = importScript(script);
      const controllers = itemsByType(result.data.items, "controller");

      expect(controllers).toHaveLength(2);

      const c1 = findItem(result.data.items, "controller", "c1");
      expect(c1).toMatchObject({
        type: "controller",
        hostname: "c1",
        controllerType: "RemoteController",
        ip: "127.0.0.1",
        port: 6653,
        protocol: "tcp",
      });

      const c2 = findItem(result.data.items, "controller", "c2");
      expect(c2).toMatchObject({
        type: "controller",
        hostname: "c2",
        controllerType: "OVSController",
        port: 6633,
      });
    });
  });

  describe("addLink parsing", () => {
    it("creates ports and links with bandwidth, delay, loss, maxQueueSize, and jitter properties", ({
      expect,
    }) => {
      const script = `
net = Mininet(topo=None, build=False)
h1 = net.addHost('h1')
s1 = net.addSwitch('s1')
net.addLink(s1, h1, intfName1='s1-eth0', intfName2='h1-eth0', bw=100, delay='10ms', loss=5, max_queue_size=42, jitter='5ms')
net.build()
CLI(net)
net.stop()
`;
      const result = importScript(script);
      const links = itemsByType(result.data.items, "link");
      const ports = itemsByType(result.data.items, "port");

      expect(links).toHaveLength(1);
      expect(ports.length).toBeGreaterThanOrEqual(2);

      // Verify link properties (cleaned, no from/to IDs)
      const cleanedLink = cleanItem(links[0]);
      expect(cleanedLink).toMatchObject({
        type: "link",
        bandwidth: 100,
        delay: "10ms",
        loss: 5,
        maxQueueSize: 42,
        jitter: "5ms",
      });

      // Verify ports were created for the link endpoints
      const portHostnames = ports.map((p) => p.hostname);
      expect(portHostnames).toContain("eth0");
    });
  });

  describe("IP assignment from cmd calls", () => {
    it("assigns IP addresses from cmd('ip a a ...') calls to the correct ports", ({
      expect,
    }) => {
      const script = `
net = Mininet(topo=None, build=False)
h1 = net.addHost('h1', ip=None)
h2 = net.addHost('h2', ip=None)
s1 = net.addSwitch('s1')
net.addLink(h1, s1, intfName1='h1-eth0', intfName2='s1-eth0')
net.addLink(h2, s1, intfName1='h2-eth0', intfName2='s1-eth1')
h1.cmd('ip a a 172.18.1.1/16 dev h1-eth0')
h1.cmd('ip a a fc00::1/32 dev h1-eth0')
h2.cmd('ip a a 172.18.1.2/16 dev h2-eth0')
net.build()
CLI(net)
net.stop()
`;
      const result = importScript(script);
      const ports = itemsByType(result.data.items, "port");

      // Find h1's eth0 port - should have both IPv4 and IPv6
      const h1Port = ports.find(
        (p) => p.ips && p.ips.includes("172.18.1.1/16"),
      );
      expect(h1Port).toBeDefined();
      expect(h1Port.ips).toContain("172.18.1.1/16");
      expect(h1Port.ips).toContain("fc00::1/32");

      // Find h2's eth0 port - should have only IPv4
      const h2Port = ports.find(
        (p) => p.ips && p.ips.includes("172.18.1.2/16"),
      );
      expect(h2Port).toBeDefined();
      expect(h2Port.ips).toContain("172.18.1.2/16");
    });
  });

  describe("startScript and stopScript split", () => {
    it("places script lines before CLI.run() in startScript and after in stopScript", ({
      expect,
    }) => {
      const script = `
net = Mininet(topo=None, build=False)
cli = CLI(net, script='/dev/null')
cli.onecmd('pingall')
cli.run()
cli.onecmd('links')
net.stop()
`;
      const result = importScript(script);

      expect(result.data.startScript).toBe("pingall");
      expect(result.data.stopScript).toBe("links");
    });
  });

  describe("Mininet constructor arguments", () => {
    it.each([
      ["ipBase", "ipBase='10.0.0.0/8'", { ipBase: "10.0.0.0/8" }],
      ["autoSetMAC", "autoSetMacs=True", { autoSetMAC: true }],
      ["autoStaticARP", "autoStaticArp=True", { autoStaticARP: true }],
      ["spawnTerminals", "xterms=True", { spawnTerminals: true }],
      ["listenPortBase", "listenPort=6634", { listenPortBase: 6634 }],
    ])("extracts %s from Mininet(%s)", (_label, argString, expectedProps) => {
      const script = `
net = Mininet(topo=None, build=False, ${argString})
net.build()
CLI(net)
net.stop()
`;
      const result = importScript(script);

      Object.entries(expectedProps).forEach(([key, value]) => {
        expect(result.data[key]).toBe(value);
      });
    });
  });

  describe("switch-controller associations", () => {
    it("creates associations from switch.start([controller]) calls", ({
      expect,
    }) => {
      const script = `
from mininet.node import RemoteController, OVSKernelSwitch
net = Mininet(topo=None, build=False)
c1 = net.addController(name='c1', controller=RemoteController, ip='127.0.0.1', port=6653)
s1 = net.addSwitch('s1', cls=OVSKernelSwitch)
h1 = net.addHost('h1')
net.addLink(s1, h1, intfName1='s1-eth0', intfName2='h1-eth0')
net.build()
s1.start([c1])
CLI(net)
net.stop()
`;
      const result = importScript(script);
      const associations = itemsByType(result.data.items, "association");

      // Should have at least: s1->c1 association plus port associations
      const switchControllerAssoc = associations.find((a) => {
        const fromItem = result.data.items.find((i) => i.id === a.from);
        const toItem = result.data.items.find((i) => i.id === a.to);
        return (
          fromItem &&
          toItem &&
          ((fromItem.type === "controller" && toItem.type === "switch") ||
            (fromItem.type === "switch" && toItem.type === "controller"))
        );
      });
      expect(
        switchControllerAssoc,
        "Expected a switch-controller association",
      ).toBeDefined();
    });
  });

  describe("node cmd scripts", () => {
    it("assigns cmd output to startScript before CLI.run() and stopScript after", ({
      expect,
    }) => {
      const script = `
net = Mininet(topo=None, build=False)
s1 = net.addSwitch('s1')
h1 = net.addHost('h1')
net.addLink(s1, h1, intfName1='s1-eth0', intfName2='h1-eth0')
s1.cmd('ifconfig s1 127.0.0.6')
net.build()
CLI(net)
s1.cmdPrint('ip a')
net.stop()
`;
      const result = importScript(script);
      const s1 = findItem(result.data.items, "switch", "s1");

      expect(s1).toBeDefined();
      expect(s1.startScript).toBe("ifconfig s1 127.0.0.6");
      expect(s1.stopScript).toBe("ip a");
    });
  });

  describe("addSwitch comprehensive property parsing", () => {
    it("extracts batch, datapath, dpid, dpopts, opts, failMode, inband from addSwitch", ({
      expect,
    }) => {
      const script = `
net = Mininet(topo=None, build=False)
s1 = net.addSwitch('s1', batch=True, datapath='kernel', dpid='ff01', dpopts='--no-slicing', opts='--verbose', failMode='secure', inband=True)
net.build()
CLI(net)
net.stop()
`;
      const result = importScript(script);
      const s1 = findItem(result.data.items, "switch", "s1");

      expect(s1.batch).toBe(true);
      expect(s1.datapath).toBe("kernel");
      expect(s1.dpid).toBe("ff01");
      expect(s1.dpopts).toBe("--no-slicing");
      expect(s1.opts).toBe("--verbose");
      expect(s1.failMode).toBe("secure");
      expect(s1.inband).toBe(true);
    });

    it("extracts protocols, reconnectms, ip, verbose, inNamespace, stp, prio from addSwitch", ({
      expect,
    }) => {
      const script = `
net = Mininet(topo=None, build=False)
s1 = net.addSwitch('s1', protocols='OpenFlow10', reconnectms=5000, ip='10.0.0.1', verbose=True, inNamespace=True, stp=True, prio=1000)
net.build()
CLI(net)
net.stop()
`;
      const result = importScript(script);
      const s1 = findItem(result.data.items, "switch", "s1");

      expect(s1.protocol).toBe("OpenFlow10");
      expect(s1.reconnectms).toBe("5000");
      expect(s1.ip).toBe("10.0.0.1");
      expect(s1.verbose).toBe(true);
      expect(s1.inNamespace).toBe(true);
      expect(s1.stp).toBe(true);
      expect(s1.stpPriority).toBe("1000");
    });

    it("maps OVSKernelSwitch class to OVSSwitch alias", ({ expect }) => {
      const script = `
from mininet.node import OVSKernelSwitch
net = Mininet(topo=None, build=False)
s1 = net.addSwitch('s1', cls=OVSKernelSwitch)
net.build()
CLI(net)
net.stop()
`;
      const result = importScript(script);
      const s1 = findItem(result.data.items, "switch", "s1");
      expect(s1.switchType).toBe("OVSSwitch");
    });

    it("preserves non-OVSKernelSwitch class names as-is", ({ expect }) => {
      const script = `
from mininet.node import IVSSwitch
net = Mininet(topo=None, build=False)
s1 = net.addSwitch('s1', cls=IVSSwitch)
net.build()
CLI(net)
net.stop()
`;
      const result = importScript(script);
      const s1 = findItem(result.data.items, "switch", "s1");
      expect(s1.switchType).toBe("IVSSwitch");
    });

    it("does not set missing optional switch properties", ({ expect }) => {
      const script = `
net = Mininet(topo=None, build=False)
s1 = net.addSwitch('s1')
net.build()
CLI(net)
net.stop()
`;
      const result = importScript(script);
      const s1 = findItem(result.data.items, "switch", "s1");

      expect(s1.batch).toBeUndefined();
      expect(s1.datapath).toBeUndefined();
      expect(s1.dpid).toBeUndefined();
      expect(s1.dpopts).toBeUndefined();
      expect(s1.opts).toBeUndefined();
      expect(s1.failMode).toBeUndefined();
      expect(s1.inband).toBeUndefined();
      expect(s1.protocol).toBeUndefined();
      expect(s1.reconnectms).toBeUndefined();
      expect(s1.ip).toBeUndefined();
      expect(s1.dpctlPort).toBeUndefined();
      expect(s1.verbose).toBeUndefined();
      expect(s1.inNamespace).toBeUndefined();
      expect(s1.stp).toBeUndefined();
      expect(s1.stpPriority).toBeUndefined();
      expect(s1.switchType).toBeUndefined();
    });
  });

  describe("addController with positional name argument", () => {
    it("extracts controller name from positional arg when name= keyword not used", ({
      expect,
    }) => {
      const script = `
from mininet.node import Controller
net = Mininet(topo=None, build=False)
c0 = net.addController('c0', controller=Controller)
net.build()
CLI(net)
net.stop()
`;
      const result = importScript(script);
      const c0 = findItem(result.data.items, "controller", "c0");
      expect(c0).toBeDefined();
      expect(c0.hostname).toBe("c0");
      expect(c0.controllerType).toBe("Controller");
    });
  });

  describe("Mininet constructor inNamespace property", () => {
    it("extracts inNamespace from Mininet constructor", ({ expect }) => {
      const script = `
net = Mininet(topo=None, build=False, inNamespace=True)
net.build()
CLI(net)
net.stop()
`;
      const result = importScript(script);
      expect(result.data.inNamespace).toBe(true);
    });
  });

  describe("Mininet constructor autoSetMacs=False handling", () => {
    it("extracts autoSetMAC as false when autoSetMacs=False", ({ expect }) => {
      const script = `
net = Mininet(topo=None, build=False, autoSetMacs=False)
net.build()
CLI(net)
net.stop()
`;
      const result = importScript(script);
      expect(result.data.autoSetMAC).toBe(false);
    });
  });

  describe("Mininet constructor autoStaticArp=False handling", () => {
    it("extracts autoStaticARP as false when autoStaticArp=False", ({
      expect,
    }) => {
      const script = `
net = Mininet(topo=None, build=False, autoStaticArp=False)
net.build()
CLI(net)
net.stop()
`;
      const result = importScript(script);
      expect(result.data.autoStaticARP).toBe(false);
    });
  });

  describe("Mininet constructor spawnTerminals false", () => {
    it("extracts spawnTerminals as false when xterms=False", ({ expect }) => {
      const script = `
net = Mininet(topo=None, build=False, xterms=False)
net.build()
CLI(net)
net.stop()
`;
      const result = importScript(script);
      expect(result.data.spawnTerminals).toBe(false);
    });
  });

  describe("setLogLevel parsing", () => {
    it("extracts logLevel from setLogLevel function call", ({ expect }) => {
      const script = `
from mininet.log import setLogLevel
net = Mininet(topo=None, build=False)
net.build()
CLI(net)
net.stop()
setLogLevel('debug')
`;
      const result = importScript(script);
      expect(result.data.logLevel).toBe("debug");
    });
  });

  describe("setCPUFrac parsing", () => {
    it("extracts cpuLimit and cpuScheduler from setCPUFrac", ({ expect }) => {
      const script = `
net = Mininet(topo=None, build=False)
h1 = net.addHost('h1')
h1.setCPUFrac(f=0.5, sched='cfs')
net.build()
CLI(net)
net.stop()
`;
      const result = importScript(script);
      const h1 = findItem(result.data.items, "host", "h1");
      expect(h1.cpuLimit).toBe(0.5);
      expect(h1.cpuScheduler).toBe("cfs");
    });

    it("does not set cpuLimit or cpuScheduler when setCPUFrac has no args", ({
      expect,
    }) => {
      const script = `
net = Mininet(topo=None, build=False)
h1 = net.addHost('h1')
net.build()
CLI(net)
net.stop()
`;
      const result = importScript(script);
      const h1 = findItem(result.data.items, "host", "h1");
      expect(h1.cpuLimit).toBeUndefined();
      expect(h1.cpuScheduler).toBeUndefined();
    });
  });

  describe("setCPUs parsing", () => {
    it("extracts cpuCores from setCPUs as integer array", ({ expect }) => {
      const script = `
net = Mininet(topo=None, build=False)
h1 = net.addHost('h1')
h1.setCPUs(cores='1,2,4')
net.build()
CLI(net)
net.stop()
`;
      const result = importScript(script);
      const h1 = findItem(result.data.items, "host", "h1");
      expect(h1.cpuCores).toEqual([1, 2, 4]);
    });

    it("handles single core value", ({ expect }) => {
      const script = `
net = Mininet(topo=None, build=False)
h1 = net.addHost('h1')
h1.setCPUs(cores='3')
net.build()
CLI(net)
net.stop()
`;
      const result = importScript(script);
      const h1 = findItem(result.data.items, "host", "h1");
      expect(h1.cpuCores).toEqual([3]);
    });
  });

  describe("Intf (physical port) parsing", () => {
    it("creates physical port with Intf call with node argument", ({
      expect,
    }) => {
      const script = `
from mininet.link import Intf
net = Mininet(topo=None, build=False)
s1 = net.addSwitch('s1')
Intf('extS1', node=s1)
net.build()
CLI(net)
net.stop()
`;
      const result = importScript(script);
      // The Intf call with node= should create a physical IP entry
      // When the port is set up, it should have physical = true
      const ports = itemsByType(result.data.items, "port");
      // Find any port that is physical
      const physicalPort = ports.find((p) => p.physical === true);
      expect(physicalPort).toBeDefined();
    });

    it("creates physical port item when Intf called without node argument", ({
      expect,
    }) => {
      const script = `
from mininet.link import Intf
net = Mininet(topo=None, build=False)
Intf('ext0')
net.build()
CLI(net)
net.stop()
`;
      const result = importScript(script);
      const ports = itemsByType(result.data.items, "port");
      const extPort = ports.find((p) => p.hostname === "ext0");
      expect(extPort).toBeDefined();
      expect(extPort.physical).toBe(true);
      expect(extPort.type).toBe("port");
    });
  });

  describe("link without intfName args uses positional varnames", () => {
    it("auto-generates port names when intfName1/intfName2 not specified", ({
      expect,
    }) => {
      const script = `
net = Mininet(topo=None, build=False)
h1 = net.addHost('h1')
s1 = net.addSwitch('s1')
net.addLink(s1, h1)
net.build()
CLI(net)
net.stop()
`;
      const result = importScript(script);
      const links = itemsByType(result.data.items, "link");
      const ports = itemsByType(result.data.items, "port");

      expect(links).toHaveLength(1);
      expect(ports.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("link properties are only set when present", () => {
    it("does not set bandwidth/delay/loss/maxQueueSize/jitter when not provided", ({
      expect,
    }) => {
      const script = `
net = Mininet(topo=None, build=False)
h1 = net.addHost('h1')
s1 = net.addSwitch('s1')
net.addLink(s1, h1, intfName1='s1-eth0', intfName2='h1-eth0')
net.build()
CLI(net)
net.stop()
`;
      const result = importScript(script);
      const links = itemsByType(result.data.items, "link");
      expect(links).toHaveLength(1);
      expect(links[0].bandwidth).toBeUndefined();
      expect(links[0].delay).toBeUndefined();
      expect(links[0].loss).toBeUndefined();
      expect(links[0].maxQueueSize).toBeUndefined();
      expect(links[0].jitter).toBeUndefined();
    });
  });

  describe("CLI(net) without script triggers beforeCLIRun=false", () => {
    it("splits cmd scripts before/after CLI(net) without script arg", ({
      expect,
    }) => {
      const script = `
net = Mininet(topo=None, build=False)
h1 = net.addHost('h1')
s1 = net.addSwitch('s1')
net.addLink(s1, h1, intfName1='s1-eth0', intfName2='h1-eth0')
h1.cmd('echo before')
net.build()
CLI(net)
h1.cmd('echo after')
net.stop()
`;
      const result = importScript(script);
      const h1 = findItem(result.data.items, "host", "h1");
      expect(h1.startScript).toBe("echo before");
      expect(h1.stopScript).toBe("echo after");
    });
  });

  describe("CLI(net) without script sets beforeCLIRun to false immediately", () => {
    it("CLI(net, script=None) sets beforeCLIRun=false, so onecmd after it goes to stopScript", ({
      expect,
    }) => {
      const script = `
net = Mininet(topo=None, build=False)
cli = CLI(net, script=None)
cli.onecmd('after_cmd')
net.stop()
`;
      const result = importScript(script);
      // CLI(net, script=None) sets beforeCLIRun=false immediately
      expect(result.data.startScript).toBe("");
      expect(result.data.stopScript).toBe("after_cmd");
    });

    it("CLI(net) without any script arg sets beforeCLIRun=false", ({
      expect,
    }) => {
      const script = `
net = Mininet(topo=None, build=False)
CLI(net)
net.stop()
`;
      const result = importScript(script);
      expect(result.data.startScript).toBe("");
      expect(result.data.stopScript).toBe("");
    });
  });

  describe("items ID generation", () => {
    it("generates IDs with 'script_import_' prefix", ({ expect }) => {
      const script = `
net = Mininet(topo=None, build=False)
h1 = net.addHost('h1')
s1 = net.addSwitch('s1')
net.build()
CLI(net)
net.stop()
`;
      const result = importScript(script);
      result.data.items.forEach((item) => {
        expect(item.id).toMatch(/^script_import_\d+$/);
      });
    });
  });

  describe("items merging by hostname", () => {
    it("merges multiple operations on same hostname into one item", ({
      expect,
    }) => {
      const script = `
net = Mininet(topo=None, build=False)
h1 = net.addHost('h1')
h1.setCPUs(cores='2')
h1.setCPUFrac(f=0.8, sched='rt')
net.build()
CLI(net)
net.stop()
`;
      const result = importScript(script);
      const hosts = itemsByType(result.data.items, "host");
      const h1 = findItem(result.data.items, "host", "h1");

      // Should be merged into one host, not three separate entries
      const h1Count = hosts.filter((h) => h.hostname === "h1").length;
      expect(h1Count).toBe(1);
      expect(h1.cpuCores).toEqual([2]);
      expect(h1.cpuLimit).toBe(0.8);
      expect(h1.cpuScheduler).toBe("rt");
    });
  });

  describe("script concatenation for same hostname", () => {
    it("concatenates multiple startScript cmd calls for same host", ({
      expect,
    }) => {
      const script = `
net = Mininet(topo=None, build=False)
h1 = net.addHost('h1')
s1 = net.addSwitch('s1')
net.addLink(h1, s1, intfName1='h1-eth0', intfName2='s1-eth0')
h1.cmd('echo first')
h1.cmd('echo second')
net.build()
CLI(net)
net.stop()
`;
      const result = importScript(script);
      const h1 = findItem(result.data.items, "host", "h1");
      expect(h1.startScript).toBe("echo first\necho second");
    });

    it("concatenates multiple stopScript cmd calls for same host", ({
      expect,
    }) => {
      const script = `
net = Mininet(topo=None, build=False)
h1 = net.addHost('h1')
s1 = net.addSwitch('s1')
net.addLink(h1, s1, intfName1='h1-eth0', intfName2='s1-eth0')
net.build()
CLI(net)
h1.cmd('echo stop1')
h1.cmd('echo stop2')
net.stop()
`;
      const result = importScript(script);
      const h1 = findItem(result.data.items, "host", "h1");
      expect(h1.stopScript).toBe("echo stop1\necho stop2");
    });
  });

  describe("log entries for errors", () => {
    it("returns log entries with severity, msg, and item properties", ({
      expect,
    }) => {
      const script = `
net = Mininet(topo=None, build=False)
h1 = net.addHost('h1')
net.build()
CLI(net)
net.stop()
`;
      const result = importScript(script);
      // log entries should be an array of objects with item property
      result.log.forEach((entry) => {
        expect(entry).toHaveProperty("item");
        expect(typeof entry.item).toBe("object");
      });
    });
  });

  describe("host defaultRoute via extraction", () => {
    it("extracts only the IP from defaultRoute 'via X.X.X.X' format", ({
      expect,
    }) => {
      const script = `
net = Mininet(topo=None, build=False)
h1 = net.addHost('h1', defaultRoute='via 192.168.1.1')
net.build()
CLI(net)
net.stop()
`;
      const result = importScript(script);
      const h1 = findItem(result.data.items, "host", "h1");
      expect(h1.defaultRoute).toBe("192.168.1.1");
    });
  });

  describe("switch class name extraction strips module prefix", () => {
    it("strips module prefix from cls argument for controller", ({
      expect,
    }) => {
      const script = `
import mininet.node
net = Mininet(topo=None, build=False)
c1 = net.addController(name='c1', controller=mininet.node.RemoteController)
net.build()
CLI(net)
net.stop()
`;
      const result = importScript(script);
      const c1 = findItem(result.data.items, "controller", "c1");
      expect(c1.controllerType).toBe("RemoteController");
    });
  });

  describe("addLink with only bandwidth property", () => {
    it("sets only bandwidth when only bw is provided", ({ expect }) => {
      const script = `
net = Mininet(topo=None, build=False)
h1 = net.addHost('h1')
s1 = net.addSwitch('s1')
net.addLink(h1, s1, intfName1='h1-eth0', intfName2='s1-eth0', bw=50)
net.build()
CLI(net)
net.stop()
`;
      const result = importScript(script);
      const links = itemsByType(result.data.items, "link");
      expect(links[0].bandwidth).toBe(50);
      expect(links[0].delay).toBeUndefined();
      expect(links[0].loss).toBeUndefined();
    });
  });

  describe("addLink with only delay property", () => {
    it("sets only delay when only delay is provided", ({ expect }) => {
      const script = `
net = Mininet(topo=None, build=False)
h1 = net.addHost('h1')
s1 = net.addSwitch('s1')
net.addLink(h1, s1, intfName1='h1-eth0', intfName2='s1-eth0', delay='20ms')
net.build()
CLI(net)
net.stop()
`;
      const result = importScript(script);
      const links = itemsByType(result.data.items, "link");
      expect(links[0].delay).toBe("20ms");
      expect(links[0].bandwidth).toBeUndefined();
    });
  });

  describe("addLink with only loss property", () => {
    it("sets only loss when only loss is provided", ({ expect }) => {
      const script = `
net = Mininet(topo=None, build=False)
h1 = net.addHost('h1')
s1 = net.addSwitch('s1')
net.addLink(h1, s1, intfName1='h1-eth0', intfName2='s1-eth0', loss=3)
net.build()
CLI(net)
net.stop()
`;
      const result = importScript(script);
      const links = itemsByType(result.data.items, "link");
      expect(links[0].loss).toBe(3);
      expect(links[0].bandwidth).toBeUndefined();
    });
  });

  describe("addLink with only max_queue_size property", () => {
    it("sets only maxQueueSize when only max_queue_size is provided", ({
      expect,
    }) => {
      const script = `
net = Mininet(topo=None, build=False)
h1 = net.addHost('h1')
s1 = net.addSwitch('s1')
net.addLink(h1, s1, intfName1='h1-eth0', intfName2='s1-eth0', max_queue_size=100)
net.build()
CLI(net)
net.stop()
`;
      const result = importScript(script);
      const links = itemsByType(result.data.items, "link");
      expect(links[0].maxQueueSize).toBe(100);
      expect(links[0].bandwidth).toBeUndefined();
    });
  });

  describe("addLink with only jitter property", () => {
    it("sets only jitter when only jitter is provided", ({ expect }) => {
      const script = `
net = Mininet(topo=None, build=False)
h1 = net.addHost('h1')
s1 = net.addSwitch('s1')
net.addLink(h1, s1, intfName1='h1-eth0', intfName2='s1-eth0', jitter='3ms')
net.build()
CLI(net)
net.stop()
`;
      const result = importScript(script);
      const links = itemsByType(result.data.items, "link");
      expect(links[0].jitter).toBe("3ms");
      expect(links[0].bandwidth).toBeUndefined();
    });
  });

  describe("switch.start with multiple controllers", () => {
    it("creates associations for each controller in the start array", ({
      expect,
    }) => {
      const script = `
from mininet.node import RemoteController, OVSKernelSwitch
net = Mininet(topo=None, build=False)
c1 = net.addController(name='c1', controller=RemoteController, ip='127.0.0.1', port=6653)
c2 = net.addController(name='c2', controller=RemoteController, ip='127.0.0.1', port=6633)
s1 = net.addSwitch('s1', cls=OVSKernelSwitch)
h1 = net.addHost('h1')
net.addLink(s1, h1, intfName1='s1-eth0', intfName2='h1-eth0')
net.build()
s1.start([c1,c2])
CLI(net)
net.stop()
`;
      const result = importScript(script);
      const associations = itemsByType(result.data.items, "association");

      // There should be associations for c1->s1 and c2->s1 (plus port associations)
      // At minimum 2 controller-switch associations
      const controllerAssocs = associations.filter((a) => {
        const fromItem = result.data.items.find((i) => i.id === a.from);
        const toItem = result.data.items.find((i) => i.id === a.to);
        return (
          fromItem &&
          toItem &&
          (fromItem.type === "controller" || toItem.type === "controller")
        );
      });
      expect(controllerAssocs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("net.get() variant for switch start", () => {
    it("handles net.get('s1').start([c1]) syntax", ({ expect }) => {
      const script = `
from mininet.node import RemoteController, OVSKernelSwitch
net = Mininet(topo=None, build=False)
c1 = net.addController(name='c1', controller=RemoteController, ip='127.0.0.1', port=6653)
s1 = net.addSwitch('s1', cls=OVSKernelSwitch)
h1 = net.addHost('h1')
net.addLink(s1, h1, intfName1='s1-eth0', intfName2='h1-eth0')
net.build()
net.get('s1').start([c1])
CLI(net)
net.stop()
`;
      const result = importScript(script);
      const associations = itemsByType(result.data.items, "association");
      expect(associations.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("host addHost with ip specified", () => {
    it("stores IP and uses it for port setup", ({ expect }) => {
      const script = `
net = Mininet(topo=None, build=False)
h1 = net.addHost('h1', ip='192.168.1.100/24')
s1 = net.addSwitch('s1')
net.addLink(h1, s1, intfName1='h1-eth0', intfName2='s1-eth0')
net.build()
CLI(net)
net.stop()
`;
      const result = importScript(script);
      const ports = itemsByType(result.data.items, "port");
      // The IP should be applied to the port via hostIPs
      const portWithIP = ports.find(
        (p) => p.ips && p.ips.includes("192.168.1.100/24"),
      );
      expect(portWithIP).toBeDefined();
    });
  });

  describe("fixNextHostDev auto-generates dev names", () => {
    it("auto-generates eth0 port name when no dev specified in link", ({
      expect,
    }) => {
      const script = `
net = Mininet(topo=None, build=False)
h1 = net.addHost('h1')
h2 = net.addHost('h2')
s1 = net.addSwitch('s1')
net.addLink(h1, s1)
net.addLink(h2, s1)
net.build()
CLI(net)
net.stop()
`;
      const result = importScript(script);
      const ports = itemsByType(result.data.items, "port");
      // Should have ports with auto-generated names
      expect(ports.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("data startScript and stopScript are joined with newlines", () => {
    it("joins multiple global onecmd startScripts with newline", ({
      expect,
    }) => {
      const script = `
net = Mininet(topo=None, build=False)
cli = CLI(net, script='/dev/null')
cli.onecmd('cmd1')
cli.onecmd('cmd2')
cli.onecmd('cmd3')
cli.run()
net.stop()
`;
      const result = importScript(script);
      expect(result.data.startScript).toBe("cmd1\ncmd2\ncmd3");
    });

    it("joins multiple global onecmd stopScripts with newline", ({
      expect,
    }) => {
      const script = `
net = Mininet(topo=None, build=False)
cli = CLI(net, script='/dev/null')
cli.run()
cli.onecmd('stop1')
cli.onecmd('stop2')
net.stop()
`;
      const result = importScript(script);
      expect(result.data.stopScript).toBe("stop1\nstop2");
    });
  });

  describe("empty script produces correct defaults", () => {
    it("produces empty startScript and stopScript for minimal script", ({
      expect,
    }) => {
      const script = `
net = Mininet(topo=None, build=False)
net.build()
CLI(net)
net.stop()
`;
      const result = importScript(script);
      expect(result.data.startScript).toBe("");
      expect(result.data.stopScript).toBe("");
    });
  });

  describe("miniedit fixture detailed property verification", () => {
    let result;

    // Parse fixture once for all tests in this describe block
    const fixturePath = resolve(
      import.meta.dirname,
      "../../tests/unit/fixtures/miniedit-script.py",
    );
    const script = readFileSync(fixturePath, "utf-8");
    result = importScript(script);

    it("extracts s5 switch with failMode standalone", ({ expect }) => {
      const s5 = findItem(result.data.items, "switch", "s5");
      expect(s5).toBeDefined();
      expect(s5.failMode).toBe("standalone");
    });

    it("extracts s8 switch with inNamespace true", ({ expect }) => {
      const s8 = findItem(result.data.items, "switch", "s8");
      expect(s8).toBeDefined();
      expect(s8.inNamespace).toBe(true);
    });

    it("extracts s7 as UserSwitch type", ({ expect }) => {
      const s7 = findItem(result.data.items, "switch", "s7");
      expect(s7).toBeDefined();
      expect(s7.switchType).toBe("UserSwitch");
    });

    it("extracts s3 as IVSSwitch type", ({ expect }) => {
      const s3 = findItem(result.data.items, "switch", "s3");
      expect(s3).toBeDefined();
      expect(s3.switchType).toBe("IVSSwitch");
    });

    it("extracts h4 with cpuCores [2] and cpuLimit 0.4 and scheduler cfs", ({
      expect,
    }) => {
      const h4 = findItem(result.data.items, "host", "h4");
      expect(h4).toBeDefined();
      expect(h4.cpuCores).toEqual([2]);
      expect(h4.cpuLimit).toBe(0.4);
      expect(h4.cpuScheduler).toBe("cfs");
    });

    it("extracts h5 with cpuCores [1,2,4] and cpuLimit 0.5 and scheduler host", ({
      expect,
    }) => {
      const h5 = findItem(result.data.items, "host", "h5");
      expect(h5).toBeDefined();
      expect(h5.cpuCores).toEqual([1, 2, 4]);
      expect(h5.cpuLimit).toBe(0.5);
      expect(h5.cpuScheduler).toBe("host");
    });

    it("extracts c2 as OVSController", ({ expect }) => {
      const c2 = findItem(result.data.items, "controller", "c2");
      expect(c2).toBeDefined();
      expect(c2.controllerType).toBe("OVSController");
      expect(c2.protocol).toBe("tcp");
      expect(c2.port).toBe(6653);
    });

    it("extracts c0 as Controller type", ({ expect }) => {
      const c0 = findItem(result.data.items, "controller", "c0");
      expect(c0).toBeDefined();
      expect(c0.controllerType).toBe("Controller");
      expect(c0.protocol).toBe("tcp");
      expect(c0.port).toBe(6633);
    });

    it("h1 has physical ports ext0, ext1, ext2", ({ expect }) => {
      const ports = itemsByType(result.data.items, "port");
      const physicalPorts = ports.filter((p) => p.physical === true);
      const physicalNames = physicalPorts.map((p) => p.hostname);
      expect(physicalNames).toContain("extS1");
      expect(physicalNames).toContain("ext0");
      expect(physicalNames).toContain("ext1");
      expect(physicalNames).toContain("ext2");
    });

    it("s2 has startScript from cmd call", ({ expect }) => {
      const s2 = findItem(result.data.items, "switch", "s2");
      expect(s2).toBeDefined();
      expect(s2.startScript).toBe("ifconfig s2 127.0.0.6");
    });

    it("s1 has stopScript from cmdPrint call", ({ expect }) => {
      const s1 = findItem(result.data.items, "switch", "s1");
      expect(s1).toBeDefined();
      expect(s1.stopScript).toBe("ip a");
    });

    it("s1 has startScript from cmdPrint call", ({ expect }) => {
      const s1 = findItem(result.data.items, "switch", "s1");
      expect(s1.startScript).toBe("ip l");
    });

    it("h6 has concatenated startScript from multiple cmd calls", ({
      expect,
    }) => {
      const h6 = findItem(result.data.items, "host", "h6");
      expect(h6).toBeDefined();
      expect(h6.startScript).toContain("vconfig add h6-eth0 600");
      expect(h6.startScript).toContain("ifconfig h6-eth0.600 172.16.0.6");
      expect(h6.startScript).toContain("vconfig add h6-eth0 700");
      expect(h6.startScript).toContain("ifconfig h6-eth0.700 172.17.0.6");
    });

    it("h2 has defaultRoute via extraction", ({ expect }) => {
      const h2 = findItem(result.data.items, "host", "h2");
      expect(h2).toBeDefined();
      expect(h2.defaultRoute).toBe("192.168.1.1");
    });

    it("h1 has defaultRoute via extraction", ({ expect }) => {
      const h1 = findItem(result.data.items, "host", "h1");
      expect(h1).toBeDefined();
      expect(h1.defaultRoute).toBe("192.168.1.1");
    });

    it("has log level set to 'info'", ({ expect }) => {
      expect(result.data.logLevel).toBe("info");
    });

    it("r4 is treated as a host (addHost with cls=Node)", ({ expect }) => {
      const r4 = findItem(result.data.items, "host", "r4");
      expect(r4).toBeDefined();
      expect(r4.type).toBe("host");
    });

    it("r4 has startScript from cmd", ({ expect }) => {
      const r4 = findItem(result.data.items, "host", "r4");
      expect(r4.startScript).toBe("sysctl -w net.ipv4.ip_forward=1");
    });
  });

  describe("miniedit comprehensive import", () => {
    const fixturePath = resolve(
      import.meta.dirname,
      "../../tests/unit/fixtures/miniedit-script.py",
    );
    const script = readFileSync(fixturePath, "utf-8");
    const json = importScript(script).data;

    // Types map for property validation
    const types = {
      autoSetMAC: "boolean",
      autoStaticARP: "boolean",
      inNamespace: "boolean",
      ipBase: "string",
      items: "array",
      listenPortBase: "number",
      logLevel: "string",
      spawnTerminals: "boolean",
      startScript: "string",
      stopScript: "string",
      version: "number",
    };

    describe("Types", () => {
      Object.keys(json).forEach((key) => {
        it(`property "${key}" has known type`, ({ expect }) => {
          expect(types).toHaveProperty(key);
          const expectedType = types[key];
          if (expectedType === "array") {
            expect(Array.isArray(json[key])).toBe(true);
          } else {
            expect(typeof json[key]).toBe(expectedType);
          }
        });
      });
    });

    describe("Mandatory properties", () => {
      ["version", "items"].forEach((key) => {
        it(`${key} exists`, ({ expect }) => {
          expect(json).toHaveProperty(key);
        });
      });
    });

    describe("Root properties", () => {
      it("startScript is empty string", ({ expect }) => {
        expect(json.startScript).toBe("");
      });

      it("stopScript is empty string", ({ expect }) => {
        expect(json.stopScript).toBe("");
      });
    });

    describe("Item properties via getCleanItems", () => {
      const cleanItems = getCleanItems(json.items);

      [
        { type: "port", hostname: "eth0", ips: ["192.168.1.101/8"] },
        { type: "port", hostname: "eth0", ips: ["192.168.1.102/8"] },
        { type: "port", hostname: "eth0", ips: ["192.168.1.103/8"] },
        { type: "port", hostname: "eth0", ips: ["192.168.1.104/8"] },
        { type: "port", hostname: "eth0", ips: ["192.168.1.105/8"] },
        { type: "port", hostname: "eth0", ips: ["192.168.1.106/8"] },
      ].forEach((expected) => {
        it(`port with IP ${expected.ips}`, ({ expect }) => {
          expect(cleanItems).toEqual(
            expect.arrayContaining([expect.objectContaining(expected)]),
          );
        });
      });

      it("s2 has switchType OVSSwitch", ({ expect }) => {
        const s2 = findItem(json.items, "switch", "s2");
        expect(s2.switchType).toBe("OVSSwitch");
      });

      it("s5 has switchType OVSSwitch", ({ expect }) => {
        const s5 = findItem(json.items, "switch", "s5");
        expect(s5.switchType).toBe("OVSSwitch");
      });

      it("s8 has switchType UserSwitch", ({ expect }) => {
        const s8 = findItem(json.items, "switch", "s8");
        expect(s8.switchType).toBe("UserSwitch");
      });

      it("h4 has defaultRoute 192.168.1.1", ({ expect }) => {
        const h4 = findItem(json.items, "host", "h4");
        expect(h4.defaultRoute).toBe("192.168.1.1");
      });

      it("h5 has defaultRoute 192.168.1.1", ({ expect }) => {
        const h5 = findItem(json.items, "host", "h5");
        expect(h5.defaultRoute).toBe("192.168.1.1");
      });
    });
  });

  describe("me-script fixture detailed property verification", () => {
    let result;

    const fixturePath = resolve(
      import.meta.dirname,
      "../../tests/unit/fixtures/me-script.py",
    );
    const script = readFileSync(fixturePath, "utf-8");
    result = importScript(script);

    it("c2 controller with port 6633", ({ expect }) => {
      const c2 = findItem(result.data.items, "controller", "c2");
      expect(c2).toBeDefined();
      expect(c2.controllerType).toBe("RemoteController");
      expect(c2.ip).toBe("127.0.0.1");
      expect(c2.port).toBe(6633);
    });

    it("switches are OVSSwitch type", ({ expect }) => {
      const s1 = findItem(result.data.items, "switch", "s1");
      expect(s1).toBeDefined();
      expect(s1.switchType).toBe("OVSSwitch");
    });

    it("h4 has defaultRoute via 172.18.0.1", ({ expect }) => {
      const h4 = findItem(result.data.items, "host", "h4");
      expect(h4).toBeDefined();
      expect(h4.defaultRoute).toBe("172.18.0.1");
    });

    it("has correct number of ports", ({ expect }) => {
      const ports = itemsByType(result.data.items, "port");
      expect(ports.length).toBeGreaterThanOrEqual(30);
    });

    it("h4 port with 192.168.1.2/24 IP exists", ({ expect }) => {
      const ports = itemsByType(result.data.items, "port");
      const h4Port = ports.find(
        (p) => p.ips && p.ips.includes("192.168.1.2/24"),
      );
      expect(h4Port).toBeDefined();
    });

    it("h3 port with 192.168.1.1/24 IP exists (from h3-eth1)", ({ expect }) => {
      const ports = itemsByType(result.data.items, "port");
      const h3Port = ports.find(
        (p) => p.ips && p.ips.includes("192.168.1.1/24"),
      );
      expect(h3Port).toBeDefined();
    });

    it("link with only bw=10 (h4-h3 link) has bandwidth but no delay", ({
      expect,
    }) => {
      const links = itemsByType(result.data.items, "link");
      const bw10Link = links.find((l) => l.bandwidth === 10);
      expect(bw10Link).toBeDefined();
      expect(bw10Link.delay).toBeUndefined();
    });

    it("has switch-controller associations", ({ expect }) => {
      const associations = itemsByType(result.data.items, "association");
      expect(associations.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("fixture file integration", () => {
    it("parses miniedit-script.py fixture with correct item counts and properties", ({
      expect,
    }) => {
      const fixturePath = resolve(
        import.meta.dirname,
        "../../tests/unit/fixtures/miniedit-script.py",
      );
      const script = readFileSync(fixturePath, "utf-8");
      const result = importScript(script);

      // Verify overall structure
      expect(result.data.version).toBe(0);
      expect(result.data.ipBase).toBe("10.0.0.0/8");
      expect(result.data.logLevel).toBe("info");

      // Verify item counts
      const counts = {};
      result.data.items.forEach((item) => {
        counts[item.type] = (counts[item.type] || 0) + 1;
      });

      expect(counts.controller).toBe(3);
      expect(counts.host).toBe(7);
      expect(counts.switch).toBe(6);
      expect(counts.link).toBe(10);
      expect(counts.port).toBe(24);
      expect(counts.association).toBe(28);

      // Verify specific controller properties
      const c1 = findItem(result.data.items, "controller", "c1");
      expect(c1).toMatchObject({
        type: "controller",
        hostname: "c1",
        controllerType: "RemoteController",
        ip: "127.0.0.1",
        port: 6643,
        protocol: "tcp",
      });

      // Verify specific switch properties
      const s1 = findItem(result.data.items, "switch", "s1");
      expect(s1).toMatchObject({
        type: "switch",
        hostname: "s1",
        switchType: "OVSSwitch",
        dpctlPort: 12345,
        dpid: "acdc",
      });

      // Verify host with CPU settings
      const h3 = findItem(result.data.items, "host", "h3");
      expect(h3).toMatchObject({
        type: "host",
        hostname: "h3",
        defaultRoute: "192.168.1.1",
        cpuCores: [1],
        cpuLimit: 0.3,
        cpuScheduler: "rt",
      });

      // Verify link with TC properties
      const tcLink = result.data.items.find(
        (item) =>
          item.type === "link" &&
          item.bandwidth === 100 &&
          item.delay === "15ms",
      );
      expect(tcLink).toMatchObject({
        type: "link",
        bandwidth: 100,
        delay: "15ms",
        loss: 7,
        maxQueueSize: 145,
        jitter: "25ms",
      });
    });

    it("parses me-script.py fixture with correct item counts and link properties", ({
      expect,
    }) => {
      const fixturePath = resolve(
        import.meta.dirname,
        "../../tests/unit/fixtures/me-script.py",
      );
      const script = readFileSync(fixturePath, "utf-8");
      const result = importScript(script);

      // Verify overall structure
      expect(result.data.version).toBe(0);
      expect(result.data.startScript).toBe("pingall");
      expect(result.data.stopScript).toBe("");

      // Verify item counts
      const counts = {};
      result.data.items.forEach((item) => {
        counts[item.type] = (counts[item.type] || 0) + 1;
      });

      expect(counts.controller).toBe(2);
      expect(counts.host).toBe(13);
      expect(counts.switch).toBe(3);
      expect(counts.link).toBe(16);

      // Verify controller with IP and port
      const c1 = findItem(result.data.items, "controller", "c1");
      expect(c1).toMatchObject({
        type: "controller",
        hostname: "c1",
        controllerType: "RemoteController",
        ip: "127.0.0.1",
        port: 6653,
      });

      // Verify link with TC properties
      const tcLink = result.data.items.find(
        (item) =>
          item.type === "link" &&
          item.bandwidth === 100 &&
          item.delay === "10ms",
      );
      expect(tcLink).toMatchObject({
        type: "link",
        bandwidth: 100,
        delay: "10ms",
        maxQueueSize: 42,
        jitter: "5ms",
      });

      // Verify IPv6 on ports
      const h1Port = result.data.items.find(
        (p) => p.type === "port" && p.ips && p.ips.includes("172.18.1.1/16"),
      );
      expect(h1Port).toBeDefined();
      expect(h1Port.ips).toContain("fc00::1/32");
    });
  });
});
