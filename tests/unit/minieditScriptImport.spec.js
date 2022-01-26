import { expect } from "chai";

import importScript from "../../src/importScript";
import { getCleanItems, testTypes } from "./exportImportCommon.js";

import minieditScript from "./minieditScriptImport.script.py";

describe("Import Miniedit script", () => {
  [
    {
      script: minieditScript,
      name: "Miniedit",
      props: {
        ipBase: "10.0.0.0/8",
        logLevel: "info",
        startScript: "",
        stopScript: "",
      },
      amounts: [
        ["association", 28],
        ["controller", 3],
        ["host", 7],
        ["link", 10],
        ["port", 24],
        ["switch", 6],
      ],
      items: [
        {
          type: "controller",
          hostname: "c0",
          protocol: "tcp",
          port: 6633,
          controllerType: "Controller",
        },
        {
          type: "controller",
          hostname: "c1",
          protocol: "tcp",
          port: 6643,
          controllerType: "RemoteController",
          ip: "127.0.0.1",
        },
        {
          type: "controller",
          hostname: "c2",
          protocol: "tcp",
          port: 6653,
          controllerType: "OVSController",
        },
        { type: "host", hostname: "h1", defaultRoute: "192.168.1.1" },
        { type: "host", hostname: "h2", defaultRoute: "192.168.1.1" },
        {
          type: "host",
          hostname: "h3",
          defaultRoute: "192.168.1.1",
          cpuCores: [1],
          cpuLimit: 0.3,
          cpuScheduler: "rt",
        },
        {
          type: "host",
          hostname: "h4",
          defaultRoute: "192.168.1.1",
          cpuCores: [2],
          cpuLimit: 0.4,
          cpuScheduler: "cfs",
        },
        {
          type: "host",
          hostname: "h5",
          defaultRoute: "192.168.1.1",
          cpuCores: [1, 2, 4],
          cpuLimit: 0.5,
          cpuScheduler: "host",
        },
        {
          type: "host",
          hostname: "h6",
          startScript:
            "vconfig add h6-eth0 600\nifconfig h6-eth0.600 172.16.0.6\nvconfig add h6-eth0 700\nifconfig h6-eth0.700 172.17.0.6",
        },
        {
          type: "host",
          hostname: "r4",
          startScript: "sysctl -w net.ipv4.ip_forward=1",
        },
        {
          type: "link",
          bandwidth: 100,
          delay: "15ms",
          loss: 7,
          maxQueueSize: 145,
          jitter: "25ms",
        },
        { type: "port", hostname: "eth0", ips: ["192.168.1.101/8"] },
        { type: "port", hostname: "eth0", ips: ["192.168.1.102/8"] },
        { type: "port", hostname: "eth0", ips: ["192.168.1.103/8"] },
        { type: "port", hostname: "eth0", ips: ["192.168.1.104/8"] },
        { type: "port", hostname: "eth0", ips: ["192.168.1.105/8"] },
        { type: "port", hostname: "eth0", ips: ["192.168.1.106/8"] },
        { type: "port", hostname: "ext0", physical: true },
        { type: "port", hostname: "ext1", physical: true },
        { type: "port", hostname: "ext2", physical: true },
        { type: "port", hostname: "extS1", physical: true },
        {
          type: "switch",
          hostname: "s1",
          switchType: "OVSSwitch",
          dpctlPort: 12345,
          dpid: "acdc",
          startScript: "ip l",
          stopScript: "ip a",
        },
        {
          type: "switch",
          hostname: "s2",
          switchType: "OVSSwitch",
          startScript: "ifconfig s2 127.0.0.6",
        },
        { type: "switch", hostname: "s3", switchType: "IVSSwitch" },
        {
          type: "switch",
          hostname: "s5",
          switchType: "OVSSwitch",
          failMode: "standalone",
        },
        { type: "switch", hostname: "s7", switchType: "UserSwitch" },
        {
          type: "switch",
          hostname: "s8",
          switchType: "UserSwitch",
          inNamespace: true,
        },
      ],
    },
  ].forEach(({ script, name, props, amounts, items: expectedItems }) =>
    describe(name, () => {
      const json = importScript(script).data;

      testTypes(json);

      describe("Root properties", () => {
        Object.keys(props).forEach((key) => {
          it(key, () => {
            expect(json[key], "Invalid property value.").to.be.equal(
              props[key]
            );
          });
        });
      });

      describe("Item amounts", () => {
        amounts.forEach(([type, amount]) => {
          it(type, () => {
            expect(
              json.items.filter((item) => item.type === type),
              `Unexpected amount of ${type} items.`
            ).to.have.lengthOf(amount);
          });
        });
      });

      describe("Item properties", () => {
        const cleanItems = getCleanItems(json.items);
        expectedItems.forEach((item) => {
          it(`${item.type}/${item.hostname || "∅"}`, () => {
            expect(cleanItems).to.deep.include(item);
          });
        });
      });
    })
  );
});
