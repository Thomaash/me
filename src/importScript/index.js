import * as antlr4 from "antlr4";
import Python2Lexer from "./generated/Python2Lexer";
import Python2Parser from "./generated/Python2Parser";

import CustomListener from "./CustomListener";
import { pyBoolean, pyNotNull, pyNumber, pyString } from "./pyTypes";

const ipAARE = /^'ip a a ([0-9a-fA-F.:/]{6,42}) dev ([^-]+-)?([^-]+)'$/;

const hostnameLookupTypeRE = /^(host|switch|controller)$/;
class Items {
  constructor() {
    this.array = [];
    this._indexMap = Object.create(null);
    this._lastId = -1;
  }

  nextId() {
    return "script_import_" + ++this._lastId;
  }

  put(item) {
    if (item.id == null) {
      item.id = this.nextId();
    }

    if (
      item.hostname != null &&
      (hostnameLookupTypeRE.test(item.type) || item.type == null)
    ) {
      if (this._indexMap[item.hostname] != null) {
        const oldItem = this.get(item.hostname);

        // Append to the scripts
        if (oldItem.startScript && item.startScript) {
          item.startScript = `${oldItem.startScript}\n${item.startScript}`;
        }
        if (oldItem.stopScript && item.stopScript) {
          item.stopScript = `${oldItem.stopScript}\n${item.stopScript}`;
        }

        Object.assign(oldItem, item);
      } else {
        this._indexMap[item.hostname] = this.array.length;
        this.array[this.array.length] = item;
      }
    } else {
      this.array.push(item);
    }
  }

  get(hostname) {
    return this.array[this._indexMap[hostname]];
  }
}

class IPs {
  $push(nodename, portname, ips) {
    this.$get(nodename, portname).push(...(Array.isArray(ips) ? ips : [ips]));
  }

  $get(nodename, portname) {
    const node = this[nodename] || (this[nodename] = {});
    const port = node[portname] || (node[portname] = []);
    return port;
  }
}

function parse(input) {
  const chars = new antlr4.InputStream(input);
  const lexer = new Python2Lexer(chars);
  const tokens = new antlr4.CommonTokenStream(lexer);
  const parser = new Python2Parser(tokens);
  parser.buildParseTrees = true;
  return parser.file_input();
}

function fixNextHostDev(set, hostDev) {
  const [host, dev] = hostDev.split("-");
  if (dev == null) {
    let i = 0;
    do {
      const dev = `eth${i}`;
      hostDev = `${host}-${dev}`;
      ++i;
    } while (set.has(hostDev));
    set.add(hostDev);
    return hostDev;
  }
  return hostDev;
}

export default function (input) {
  const associations = [];
  const hostIPs = {};
  const ips = new IPs();
  const items = new Items();
  const jsonProps = {};
  const links = [];
  const log = [];
  const portMap = {};
  const scriptLines = { startScript: [], stopScript: [] };
  let beforeCLIRun = true;

  const printer = new CustomListener({
    functionCall: (varName, funcName, args, code) => {
      try {
        if (funcName === ".onecmd") {
          // Script
          scriptLines[beforeCLIRun ? "startScript" : "stopScript"].push(
            pyString(args[0])
          );
        } else if (funcName === ".addLink") {
          // Link
          const item = {
            type: "link",
            from: args.intfName1 ? pyString(args.intfName1) : args[0],
            to: args.intfName2 ? pyString(args.intfName2) : args[1],
          };

          if (pyNotNull(args.bw)) {
            item.bandwidth = pyNumber(args.bw);
          }
          if (pyNotNull(args.delay)) {
            item.delay = pyString(args.delay);
          }
          if (pyNotNull(args.loss)) {
            item.loss = pyNumber(args.loss);
          }
          if (pyNotNull(args.max_queue_size)) {
            item.maxQueueSize = pyNumber(args.max_queue_size);
          }
          if (pyNotNull(args.jitter)) {
            item.jitter = pyString(args.jitter);
          }

          links.push(item);
        } else if (funcName === ".start" && Array.isArray(args[0])) {
          // Association switch → controller
          const hostnameTo = varName;
          args[0].forEach((hostnameFrom) => {
            const item = {
              type: "association",
              from: hostnameFrom,
              to: hostnameTo,
            };

            associations.push(item);
          });
        } else if (funcName === ".addHost") {
          // Host
          const hostname = pyString(args[0]);
          const item = {
            type: "host",
            hostname,
          };
          if (pyNotNull(args.defaultRoute)) {
            item.defaultRoute = args.defaultRoute.replace(
              /.*via\s+([0-9a-fA-F.:]+).*/,
              "$1"
            );
          }
          if (pyNotNull(args.ip)) {
            hostIPs[item.hostname] = pyString(args.ip);
          }

          items.put(item);
        } else if (funcName === ".addSwitch") {
          // Switch
          const hostname = pyString(args[0]);
          const item = {
            type: "switch",
            hostname,
          };
          if (pyNotNull(args.batch)) {
            item.batch = pyBoolean(args.batch);
          }
          if (pyNotNull(args.datapath)) {
            item.datapath = pyString(args.datapath);
          }
          if (pyNotNull(args.dpid)) {
            item.dpid = pyString(args.dpid);
          }
          if (pyNotNull(args.dpopts)) {
            item.dpopts = pyString(args.dpopts);
          }
          if (pyNotNull(args.opts)) {
            item.opts = pyString(args.opts);
          }
          if (pyNotNull(args.failMode)) {
            item.failMode = pyString(args.failMode);
          }
          if (pyNotNull(args.inband)) {
            item.inband = pyBoolean(args.inband);
          }
          if (pyNotNull(args.protocols)) {
            item.protocol = pyString(args.protocols);
          }
          if (pyNotNull(args.reconnectms)) {
            item.reconnectms = args.reconnectms;
          }
          if (pyNotNull(args.ip)) {
            item.ip = pyString(args.ip);
          }
          if (pyNotNull(args.listenPort)) {
            item.dpctlPort = pyNumber(args.listenPort);
          }
          if (pyNotNull(args.verbose)) {
            item.verbose = pyBoolean(args.verbose);
          }
          if (pyNotNull(args.inNamespace)) {
            item.inNamespace = pyBoolean(args.inNamespace);
          }
          if (pyNotNull(args.stp)) {
            item.stp = pyBoolean(args.stp);
          }
          if (pyNotNull(args.prio)) {
            item.stpPriority = args.prio;
          }
          if (pyNotNull(args.cls)) {
            const cls = args.cls.replace(/.*\./, "");
            if (cls === "OVSKernelSwitch") {
              // Only an alias
              item.switchType = "OVSSwitch";
            } else {
              item.switchType = args.cls.replace(/.*\./, "");
            }
          }

          items.put(item);
        } else if (funcName === ".addController") {
          // Controller
          const hostname = pyString(args[0] || args.name);
          const item = {
            type: "controller",
            hostname,
          };
          if (pyNotNull(args.controller)) {
            item.controllerType = args.controller.replace(/.*\./, "");
          }
          if (pyNotNull(args.ip)) {
            item.ip = pyString(args.ip);
          }
          if (pyNotNull(args.port)) {
            item.port = pyNumber(args.port);
          }
          if (pyNotNull(args.protocol)) {
            item.protocol = pyString(args.protocol);
          }

          items.put(item);
        } else if (funcName === ".cmd" || funcName === ".cmdPrint") {
          if (beforeCLIRun && ipAARE.test(args[0])) {
            // Port IP
            const { 1: ip, 3: portname } = ipAARE.exec(args[0]);
            const nodename = varName;
            ips.$push(nodename, portname, ip);
          } else {
            // Node script
            const item = {
              hostname: varName,
              [beforeCLIRun ? "startScript" : "stopScript"]: pyString(args[0]),
            };

            items.put(item);
          }
        } else if (funcName === ".Intf" || funcName === "Intf") {
          // Physical port
          const nodename = args.node;
          const portname = pyString(args[0]);
          if (nodename) {
            ips.$get(nodename, portname).physical = true;
          } else {
            const item = {
              type: "port",
              physical: true,
              hostname: portname,
            };

            items.put(item);
          }
        } else if (funcName === "Mininet") {
          if (pyNotNull(args.autoSetMacs)) {
            jsonProps.autoSetMAC = pyBoolean(args.autoSetMacs);
          }
          if (pyNotNull(args.autoStaticArp)) {
            jsonProps.autoStaticARP = pyBoolean(args.autoStaticArp);
          }
          if (pyNotNull(args.inNamespace)) {
            jsonProps.inNamespace = pyBoolean(args.inNamespace);
          }
          if (pyNotNull(args.ipBase)) {
            jsonProps.ipBase = pyString(args.ipBase);
          }
          if (pyNotNull(args.listenPort)) {
            jsonProps.listenPortBase = pyNumber(args.listenPort);
          }
          if (pyNotNull(args.xterms)) {
            jsonProps.spawnTerminals = pyBoolean(args.xterms);
          }
        } else if (funcName === ".setCPUFrac") {
          const hostname = varName;
          const item = {
            type: "host",
            hostname,
          };

          if (pyNotNull(args.f)) {
            item.cpuLimit = pyNumber(args.f);
          }
          if (pyNotNull(args.sched)) {
            item.cpuScheduler = pyString(args.sched);
          }

          items.put(item);
        } else if (funcName === ".setCPUs") {
          const hostname = varName;
          const item = {
            type: "host",
            hostname,
          };

          if (pyNotNull(args.cores)) {
            item.cpuCores = pyString(args.cores)
              .replace(/\s+/g, "")
              .split(",")
              .map((str) => parseInt(str));
          }

          items.put(item);
        } else if (
          ((varName === "cli" && funcName === ".run") ||
            (funcName === "CLI" && args[0] === "net")) &&
          (!("script" in args) || args.script === "None")
        ) {
          beforeCLIRun = false;
        } else if (funcName === ".setLogLevel" || funcName === "setLogLevel") {
          // Log level
          jsonProps.logLevel = pyString(args[0]);
        }
      } catch (error) {
        Object.assign(error, { varName, funcName, args, code });
        console.warn(error);
        log.push({
          severity: "warning",
          msg: `Can't process function call: “${code}”.`,
        });
      }
    },
  });

  // Process the tree
  const tree = parse(input);
  const walker = new antlr4.tree.ParseTreeWalker();
  walker.walk(printer, tree);
  antlr4.tree.ParseTreeWalker.DEFAULT.walk(printer, tree);

  // Prepare ports without IPs
  const hostDevs = new Set();
  links.forEach((link) => hostDevs.add(link.from).add(link.to));
  links.forEach((edge) => {
    edge.from = fixNextHostDev(hostDevs, edge.from);
    edge.to = fixNextHostDev(hostDevs, edge.to);
  });
  links.forEach((edge) => {
    [edge.from, edge.to].forEach((hostDev) => {
      const [nodename, portname] = hostDev.split("-");

      ips.$push(nodename, portname, hostIPs[nodename] || []);
      delete hostIPs[nodename];
    });
  });

  // Set up ports
  Object.keys(ips).forEach((host) => {
    Object.keys(ips[host]).forEach((dev) => {
      try {
        // Port
        const port = {
          type: "port",
          hostname: dev,
        };

        const ipList = ips[host][dev];
        if (ipList.length) {
          port.ips = [...ipList]; // Without additional properties
        }
        if (ipList.physical) {
          port.physical = true;
        }

        items.put(port);

        // Association
        const edge = {
          type: "association",
          from: items.get(host).id,
          to: port.id,
        };
        items.put(edge);

        portMap[`${host}-${dev}`] = port.id;
      } catch (error) {
        Object.assign(error, { host, dev });
        console.warn(error);
        log.push({
          severity: "warning",
          msg: `Can't set up port ${host}/${dev}.`,
        });
      }
    });
  });

  // Set up associations (can't be done before all nodes are in items)
  associations.forEach((edge) => {
    edge.from = items.get(edge.from).id;
    edge.to = items.get(edge.to).id;
    if (edge.from && edge.to) {
      // Don't add edges to nowhere
      items.put(edge);
    }
  });

  // Set up links (can't be done before all ports are in items)
  links.forEach((edge) => {
    edge.from = portMap[edge.from];
    edge.to = portMap[edge.to];
    if (edge.from && edge.to) {
      // Don't add edges to nowhere
      items.put(edge);
    }
  });

  return {
    log: log.map((v) => ({ ...v, item: {} })),
    data: {
      ...jsonProps,
      version: 0,
      startScript: scriptLines.startScript.join("\n"),
      stopScript: scriptLines.stopScript.join("\n"),
      items: items.array,
    },
  };
}
