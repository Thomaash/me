import { describe, it } from "vitest";
import {
  switchTypes,
  failModes,
  datapaths,
  protocolsOF,
  controllerTypes,
  protocolsIP,
  schedulers,
  logLevels,
  controllerTypesMap,
  switchTypesMap,
} from "@/components/selects.js";

describe.concurrent("switchTypes", () => {
  it("contains exactly 5 entries with correct value/title pairs", ({ expect }) => {
    expect(switchTypes).toEqual([
      { value: "IVSSwitch", title: "IVS Switch" },
      { value: "LinuxBridge", title: "Linux Bridge" },
      { value: "OVSBridge", title: "OVS Bridge" },
      { value: "OVSSwitch", title: "OVS Switch" },
      { value: "UserSwitch", title: "User Switch" },
    ]);
  });
});

describe("failModes", () => {
  it("contains secure and standalone entries", ({ expect }) => {
    expect(failModes).toEqual([
      { value: "secure", title: "Secure" },
      { value: "standalone", title: "Standalone" },
    ]);
  });
});

describe("datapaths", () => {
  it("contains kernel and user entries", ({ expect }) => {
    expect(datapaths).toEqual([
      { value: "kernel", title: "Kernel" },
      { value: "user", title: "User" },
    ]);
  });
});

describe("protocolsOF", () => {
  it("contains OpenFlow12 through OpenFlow15 entries", ({ expect }) => {
    expect(protocolsOF).toEqual([
      { value: "OpenFlow12", title: "OpenFlow 1.2" },
      { value: "OpenFlow13", title: "OpenFlow 1.3" },
      { value: "OpenFlow14", title: "OpenFlow 1.4" },
      { value: "OpenFlow15", title: "OpenFlow 1.5" },
    ]);
  });
});

describe("controllerTypes", () => {
  it("contains Controller, NOX, OVSController, RemoteController, Ryu entries", ({ expect }) => {
    expect(controllerTypes).toEqual([
      { value: "Controller", title: "OpenFlow Reference Implementation" },
      { value: "NOX", title: "NOX" },
      { value: "OVSController", title: "OVS Controller" },
      { value: "RemoteController", title: "Remote Controller" },
      { value: "Ryu", title: "Ryu Controller" },
    ]);
  });
});

describe("protocolsIP", () => {
  it("contains tcp and ssl entries", ({ expect }) => {
    expect(protocolsIP).toEqual([
      { value: "tcp", title: "TCP" },
      { value: "ssl", title: "SSL" },
    ]);
  });
});

describe("schedulers", () => {
  it("contains cfs and rt entries", ({ expect }) => {
    expect(schedulers).toEqual([
      { value: "cfs", title: "CFS" },
      { value: "rt", title: "RT" },
    ]);
  });
});

describe("logLevels", () => {
  it("contains debug, info, output, warning, error, critical entries", ({ expect }) => {
    expect(logLevels).toEqual([
      { value: "debug", title: "Debug" },
      { value: "info", title: "Info" },
      { value: "output", title: "Output" },
      { value: "warning", title: "Warning" },
      { value: "error", title: "Error" },
      { value: "critical", title: "Critical" },
    ]);
  });
});

describe("controllerTypesMap", () => {
  it("maps each controllerTypes value to its title", ({ expect }) => {
    expect(controllerTypesMap).toEqual({
      Controller: "OpenFlow Reference Implementation",
      NOX: "NOX",
      OVSController: "OVS Controller",
      RemoteController: "Remote Controller",
      Ryu: "Ryu Controller",
    });
  });

  it("has null prototype", ({ expect }) => {
    expect(Object.getPrototypeOf(controllerTypesMap)).toBeNull();
  });
});

describe("switchTypesMap", () => {
  it("maps each switchTypes value to its title", ({ expect }) => {
    expect(switchTypesMap).toEqual({
      IVSSwitch: "IVS Switch",
      LinuxBridge: "Linux Bridge",
      OVSBridge: "OVS Bridge",
      OVSSwitch: "OVS Switch",
      UserSwitch: "User Switch",
    });
  });

  it("has null prototype", ({ expect }) => {
    expect(Object.getPrototypeOf(switchTypesMap)).toBeNull();
  });
});
