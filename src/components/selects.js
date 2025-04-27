const switchTypes = [
  { value: "IVSSwitch", title: "IVS Switch" },
  { value: "LinuxBridge", title: "Linux Bridge" },
  { value: "OVSBridge", title: "OVS Bridge" },
  { value: "OVSSwitch", title: "OVS Switch" },
  { value: "UserSwitch", title: "User Switch" },
];
export { switchTypes };

const failModes = [
  { value: "secure", title: "Secure" },
  { value: "standalone", title: "Standalone" },
];
export { failModes };

const datapaths = [
  { value: "kernel", title: "Kernel" },
  { value: "user", title: "User" },
];
export { datapaths };

const protocolsOF = [
  { value: "OpenFlow12", title: "OpenFlow 1.2" },
  { value: "OpenFlow13", title: "OpenFlow 1.3" },
  { value: "OpenFlow14", title: "OpenFlow 1.4" },
  { value: "OpenFlow15", title: "OpenFlow 1.5" },
];
export { protocolsOF };

const controllerTypes = [
  { value: "Controller", title: "OpenFlow Reference Implementation" },
  { value: "NOX", title: "NOX" },
  { value: "OVSController", title: "OVS Controller" },
  { value: "RemoteController", title: "Remote Controller" },
  { value: "Ryu", title: "Ryu Controller" },
];
export { controllerTypes };

const protocolsIP = [
  { value: "tcp", title: "TCP" },
  { value: "ssl", title: "SSL" },
];
export { protocolsIP };

const schedulers = [
  { value: "cfs", title: "CFS" },
  { value: "rt", title: "RT" },
];
export { schedulers };

const logLevels = [
  { value: "debug", title: "Debug" },
  { value: "info", title: "Info" },
  { value: "output", title: "Output" },
  { value: "warning", title: "Warning" },
  { value: "error", title: "Error" },
  { value: "critical", title: "Critical" },
];
export { logLevels };

function reduceToMap(acc, val) {
  acc[val.value] = val.title;
  return acc;
}
const controllerTypesMap = controllerTypes.reduce(
  reduceToMap,
  Object.create(null),
);
export { controllerTypesMap };
const switchTypesMap = switchTypes.reduce(reduceToMap, Object.create(null));
export { switchTypesMap };
