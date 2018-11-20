const switchTypes = [
  { value: 'IVSSwitch', text: 'IVSSwitch' },
  { value: 'LinuxBridge', text: 'LinuxBridge' },
  { value: 'OVSBridge', text: 'OVSBridge' },
  { value: 'OVSSwitch', text: 'OVSSwitch' },
  { value: 'UserSwitch', text: 'UserSwitch' }
]
export { switchTypes }

const failModes = [
  { value: 'secure', text: 'Secure' },
  { value: 'standalone', text: 'Standalone' }
]
export { failModes }

const datapaths = [
  { value: 'kernel', text: 'Kernel' },
  { value: 'user', text: 'User' }
]
export { datapaths }

const protocolsOF = [
  { value: 'OpenFlow12', text: 'OpenFlow 1.2' },
  { value: 'OpenFlow13', text: 'OpenFlow 1.3' },
  { value: 'OpenFlow14', text: 'OpenFlow 1.4' },
  { value: 'OpenFlow15', text: 'OpenFlow 1.5' }
]
export { protocolsOF }

const controllerTypes = [
  { value: 'NOX', text: 'NOX' },
  { value: 'OVSController', text: 'OVSController' },
  { value: 'RemoteController', text: 'RemoteController' },
  { value: 'Ryu', text: 'Ryu' }
]
export { controllerTypes }

const protocolsIP = [
  { value: 'tcp', text: 'TCP' },
  { value: 'upd', text: 'UDP' }
]
export { protocolsIP }
