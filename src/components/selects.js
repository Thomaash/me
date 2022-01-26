const switchTypes = [
  { value: "IVSSwitch", text: "IVS Switch" },
  { value: "LinuxBridge", text: "Linux Bridge" },
  { value: "OVSBridge", text: "OVS Bridge" },
  { value: "OVSSwitch", text: "OVS Switch" },
  { value: "UserSwitch", text: "User Switch" },
];
export { switchTypes };

const failModes = [
  { value: "secure", text: "Secure" },
  { value: "standalone", text: "Standalone" },
];
export { failModes };

const datapaths = [
  { value: "kernel", text: "Kernel" },
  { value: "user", text: "User" },
];
export { datapaths };

const protocolsOF = [
  { value: "OpenFlow12", text: "OpenFlow 1.2" },
  { value: "OpenFlow13", text: "OpenFlow 1.3" },
  { value: "OpenFlow14", text: "OpenFlow 1.4" },
  { value: "OpenFlow15", text: "OpenFlow 1.5" },
];
export { protocolsOF };

const controllerTypes = [
  { value: "Controller", text: "OpenFlow Reference Implementation" },
  { value: "NOX", text: "NOX" },
  { value: "OVSController", text: "OVS Controller" },
  { value: "RemoteController", text: "Remote Controller" },
  { value: "Ryu", text: "Ryu Controller" },
];
export { controllerTypes };

const protocolsIP = [
  { value: "tcp", text: "TCP" },
  { value: "ssl", text: "SSL" },
];
export { protocolsIP };

const schedulers = [
  { value: "cfs", text: "CFS" },
  { value: "rt", text: "RT" },
];
export { schedulers };

const logLevels = [
  { value: "debug", text: "Debug" },
  { value: "info", text: "Info" },
  { value: "output", text: "Output" },
  { value: "warning", text: "Warning" },
  { value: "error", text: "Error" },
  { value: "critical", text: "Critical" },
];
export { logLevels };

function reduceToMap(acc, val) {
  acc[val.value] = val.text;
  return acc;
}
const controllerTypesMap = controllerTypes.reduce(
  reduceToMap,
  Object.create(null)
);
export { controllerTypesMap };
const switchTypesMap = switchTypes.reduce(reduceToMap, Object.create(null));
export { switchTypesMap };
