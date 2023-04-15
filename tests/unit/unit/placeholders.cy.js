import { expect } from "chai";

import placeholders from "@/components/vis/placeholders";
import { controllerTypesMap, switchTypesMap } from "@/components/selects";

describe("Placeholders", () => {
  it("Matching", () => {
    const expected = ["{{HOSTNAMES}}", "{{}}", "{{IPS}}", "{{TYPES}}"];
    const actual = [];
    '{{HOSTNAMES}}I saw you with those two "la{{}}dies of the evening"{{IPS}} at Elzars.\nExplain that.{{TYPES}}'.replace(
      placeholders.re,
      (match) => {
        actual.push(match);
      }
    );

    expect(actual).to.deep.equal(expected);
  });

  it("HOSTNAMES", () => {
    const text = placeholders.replace["{{HOSTNAMES}}"]([
      {
        type: "host",
        hostname: "h2",
      },
      {
        type: "host",
        hostname: "h1",
      },
      {
        type: "switch",
        hostname: "s3",
      },
      {
        type: "switch",
        hostname: "s12",
      },
      {
        type: "controller",
        hostname: "c0",
      },
      {
        type: "port",
        hostname: "eth3",
      },
      {
        type: "dummy",
        hostname: "fail",
      },
      {
        type: "fail",
        hostname: "fail",
      },
    ]);

    expect(text).to.equal("c0, eth3, h1, h2, s3, s12");
  });

  it("IPS (one)", () => {
    const text = placeholders.replace["{{IPS}}"]([
      {
        type: "port",
        hostname: "eth2",
        ips: ["172.16.4.3/24", "192.7.0.14/22"],
      },
    ]);

    expect(text).to.equal(["172.16.4.3/24", "192.7.0.14/22"].join("\n"));
  });

  it("IPS (many)", () => {
    const text = placeholders.replace["{{IPS}}"]([
      {
        type: "host",
        defaultRoute: "192.168.1.1",
        hostname: "h2",
      },
      {
        type: "fail",
      },
      {
        type: "dummy",
      },
      {
        type: "controller",
        ip: "10.15.6.75",
        port: "6948",
        hostname: "c2",
      },
      {
        type: "controller",
        ip: "10.15.6.75",
        hostname: "c1",
      },
      {
        type: "port",
        hostname: "eth41",
        ips: ["172.16.4.41/24"],
      },
      {
        type: "switch",
        hostname: "s15",
        ip: "8.4.9.3",
      },
      {
        type: "host",
        hostname: "h1",
      },
      {
        type: "switch",
        hostname: "s1",
      },
      {
        type: "port",
        hostname: "eth2",
        ips: ["172.16.4.3/24", "192.7.0.14/22"],
      },
      {
        type: "controller",
        port: "6633",
        hostname: "c11",
      },
      {
        type: "controller",
        hostname: "c0",
      },
      {
        type: "port",
        hostname: "eth3",
      },
      {
        type: "switch",
        hostname: "s2",
      },
    ]);

    expect(text).to.equal(
      [
        "c0:    <default IP>:<default port>",
        "c1:    10.15.6.75:<default port>",
        "c2:    10.15.6.75:6948",
        "c11:   <default IP>:6633",

        ["eth2:  172.16.4.3/24", "       192.7.0.14/22"].join("\n"),
        "eth3:  no addresses",
        "eth41: 172.16.4.41/24",

        "h1:    no default route",
        "h2:    192.168.1.1",

        "s1:    no address",
        "s2:    no address",
        "s15:   8.4.9.3",
      ].join("\n\n")
    );
  });

  it("TYPES (one)", () => {
    const text = placeholders.replace["{{TYPES}}"]([
      {
        type: "host",
      },
      {
        type: "switch",
        switchType: "OVSBridge",
        hostname: "s1",
      },
      {
        type: "port",
        hostname: "eth3",
      },
    ]);

    expect(text).to.equal(switchTypesMap.OVSBridge);
  });

  it("TYPES (many)", () => {
    const text = placeholders.replace["{{TYPES}}"]([
      {
        type: "host",
      },
      {
        type: "controller",
        controllerType: "RemoteController",
        hostname: "c2",
      },
      {
        type: "controller",
        controllerType: "OVSController",
        hostname: "c12",
      },
      {
        type: "switch",
        switchType: "OVSBridge",
        hostname: "s1",
      },
      {
        type: "controller",
        hostname: "c0",
      },
      {
        type: "port",
        hostname: "eth3",
      },
      {
        type: "switch",
        hostname: "s2",
      },
    ]);

    expect(text).to.equal(
      [
        "c0:  default type",
        `c2:  ${controllerTypesMap.RemoteController}`,
        `c12: ${controllerTypesMap.OVSController}`,
        `s1:  ${switchTypesMap.OVSBridge}`,
        "s2:  default type",
      ].join("\n")
    );
  });
});
