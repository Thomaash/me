import { Code } from "./Code";
import { Items } from "./Items";
import { pyArgs } from "./pyArgs";

export class Builder {
  #devnames = Object.create(null);
  #hostnames = new Set();
  #linked = new Set();
  #data;
  #items;
  #code;

  constructor(data) {
    this.log = [];

    this.#data = data;
    this.#items = new Items(data.items);
    this.#code = new Code();
  }

  build() {
    [
      // Nodes (stop on hostname conflict)
      {
        items: this.#items.arr.controller,
        method: this.#addController.bind(this),
      },
      { items: this.#items.arr.host, method: this.#addHost.bind(this) },
      { items: this.#items.arr.switch, method: this.#addSwitch.bind(this) },

      // Interfaces (stop on devname conflict)
      { items: this.#items.arr.port, method: this.#addPort.bind(this) },

      // Links
      { items: this.#items.arr.link, method: this.#addLink.bind(this) },
    ].forEach(({ items, method }) => {
      items.forEach((item) => {
        try {
          method(item);
        } catch (error) {
          if (
            error instanceof SyntaxError &&
            error.message === "Hostname collision."
          ) {
            const hostname = item.hostname;
            [
              ...this.#items.arr.controller,
              ...this.#items.arr.host,
              ...this.#items.arr.switch,
            ]
              .filter((node) => node.hostname === hostname)
              .forEach((node) =>
                this.#log(
                  `Failed to add ${node.type}/${node.hostname}: conflicting hostname.`,
                  "error",
                  node,
                ),
              );
          } else if (
            error instanceof SyntaxError &&
            error.message === "Devname collision."
          ) {
            const { devname, ports } = error.payload;
            ports.forEach((port) =>
              this.#log(
                `Failed to add ${port.type}/${port.hostname}: conflicting interface name ${devname}.`,
                "error",
                port,
              ),
            );
          } else if (
            error instanceof SyntaxError &&
            error.message === "Multiple links per port."
          ) {
            const { port } = error.payload;
            this.#log(
              `Failed to add ${port.type}/${port.hostname}: single port has multiple links.`,
              "error",
              port,
            );
          } else if (
            error instanceof SyntaxError &&
            error.message === "Physical port connected to a link."
          ) {
            const { port } = error.payload;
            this.#log(
              `Failed to add ${port.type}/${port.hostname}: port can't be both physical and connected to a link.`,
              "error",
              port,
            );
          } else {
            console.error(error);
            this.#log(
              item != null && item.type !== null && item.id !== null
                ? `Failed to add ${item.type}/${item.hostname}.`
                : `Malformed item (${this.#items.arr.$all.find(
                    (v) => v === item,
                  )}).`,
              "error",
              item,
            );
          }

          throw new Error("Script building failure.", { cause: error });
        }
      });
    });

    // Log level
    if (this.#data.logLevel) {
      this.#code.add(
        "preInit",
        `mininet.log.setLogLevel('${this.#data.logLevel}')`,
      );
    }

    // Scripts
    if (this.#data.startScript) {
      this.#code.add(
        "globalStartCmds",
        ...this.#scriptToCmds(this.#data.startScript),
      );
    }
    if (this.#data.stopScript) {
      this.#code.add(
        "globalStopCmds",
        ...this.#scriptToCmds(this.#data.stopScript),
      );
    }

    // Mininet arguments
    this.#code.add(
      "mininetArgs",
      ...pyArgs([
        [
          this.#data.autoSetMAC != null,
          this.#data.autoSetMAC,
          Boolean,
          "autoSetMacs",
        ],
        [
          this.#data.autoStaticARP != null,
          this.#data.autoStaticARP,
          Boolean,
          "autoStaticArp",
        ],
        [
          this.#data.inNamespace != null,
          this.#data.inNamespace,
          Boolean,
          "inNamespace",
        ],
        [this.#data.ipBase != null, this.#data.ipBase, String, "ipBase"],
        [
          this.#data.listenPortBase != null,
          this.#data.listenPortBase,
          Number,
          "listenPort",
        ],
        [
          this.#data.spawnTerminals != null,
          this.#data.spawnTerminals,
          Boolean,
          "xterms",
        ],
      ]),
    );

    return this.#code.toString();
  }

  #addController(controller) {
    this.#addHostname(controller);

    const args = pyArgs([
      [controller.hostname, String],
      [
        controller.controllerType != null,
        `mininet.node.${controller.controllerType}`,
        null,
        "controller",
      ],
      [controller.ip != null, controller.ip, String, "ip"],
      [controller.port != null, controller.port, Number, "port"],
      [controller.protocol != null, controller.protocol, String, "protocol"],
    ]);
    this.#code.add(
      "nodes",
      `${controller.hostname} = net.addController(${args.join(", ")})`,
    );
    this.#code.add("startControllers", `${controller.hostname}.start()`);
  }

  #addHost(host) {
    this.#addHostname(host);

    const args = pyArgs([
      [host.hostname, String],
      ["None", null, "ip"],
      [
        host.defaultRoute != null,
        `via ${host.defaultRoute}`,
        String,
        "defaultRoute",
      ],
      [
        [host.cpuScheduler, host.cpuCores, host.cpuLimit].some(
          (v) => v != null,
        ),
        "mininet.node.CPULimitedHost",
        null,
        "cls",
      ],
    ]);
    this.#code.add(
      "nodes",
      `${host.hostname} = net.addHost(${args.join(", ")})`,
    );

    if (host.cpuScheduler != null || host.cpuLimit != null) {
      const args = pyArgs([
        [host.cpuScheduler != null, host.cpuScheduler, String, "sched"],
        [host.cpuLimit != null, host.cpuLimit, Number, "f"],
      ]);
      this.#code.add(
        "nodeLimits",
        `${host.hostname}.setCPUFrac(${args.join(", ")})`,
      );
    }
    if (host.cpuCores != null) {
      const args = pyArgs([
        [host.cpuCores != null, host.cpuCores.join(","), String, "cores"],
      ]);
      this.#code.add(
        "nodeLimits",
        `${host.hostname}.setCPUs(${args.join(", ")})`,
      );
    }

    this.#addNodeScripts(host.hostname, host.startScript, host.stopScript);
  }

  #addLink(link) {
    const fromPort = this.#items.map.port[link.from];
    const toPort = this.#items.map.port[link.to];

    this.#addLinkedPort(fromPort);
    this.#addLinkedPort(toPort);

    const fromNode = this.#portToNode(fromPort);
    const toNode = this.#portToNode(toPort);

    if (!fromNode || !toNode) {
      this.#log(
        `Failed to add ${link.type}/${link.hostname}: link can't be connected to disconnected port(s).`,
        "warning",
        link,
      );
      [...(fromNode ? [] : [fromPort]), ...(toNode ? [] : [toPort])].forEach(
        (port) => {
          this.#log(
            `Failed to add ${port.type}/${port.hostname}: port can't be connected to a link but not to a node.`,
            "warning",
            port,
          );
        },
      );

      return;
    }

    const fromDev = `${fromNode.hostname}-${fromPort.hostname}`;
    const toDev = `${toNode.hostname}-${toPort.hostname}`;

    const args = pyArgs([
      [fromNode.hostname],
      [toNode.hostname],
      [fromDev, String, "intfName1"],
      [toDev, String, "intfName2"],
      [link.bandwidth != null, link.bandwidth, Number, "bw"],
      [link.delay != null, link.delay, String, "delay"],
      [link.loss != null, link.loss, Number, "loss"],
      [link.maxQueueSize != null, link.maxQueueSize, Number, "max_queue_size"],
      [link.jitter != null, link.jitter, String, "jitter"],
    ]);

    this.#code.add("links", `net.addLink(${args.join(", ")})`);
  }

  #addPort(port) {
    const node = this.#portToNode(port);
    if (!node) {
      this.#log(
        `Skipping ${port.type}/${port.hostname}: not connected to any node.`,
        "info",
        port,
      );
      return;
    }
    const link = port.$links[0];
    if (!link && !port.physical) {
      this.#log(
        `Skipping ${port.type}/${port.hostname}: port has to be either physical or connected to a link.`,
        "info",
        port,
      );
      return;
    }
    if (link && port.physical) {
      const error = new SyntaxError("Physical port connected to a link.");
      error.payload = { port };
      throw error;
    }

    const dev = port.physical
      ? port.hostname
      : `${node.hostname}-${port.hostname}`;

    this.#addDevname(port, dev);

    if (!link) {
      const args = pyArgs([
        [dev, String],
        [node.hostname, null, "node"],
      ]);
      this.#code.add("ports", `mininet.link.Intf(${args.join(", ")})`);
    }

    (port.ips || []).forEach((ip, i) => {
      this.#code.add(
        "ips",
        ...(i === 0
          ? [
              `${node.hostname}.intf('${dev}').ip = '${ip.split("/")[0]}'`,
              `${node.hostname}.intf('${dev}').prefixLen = ${ip.split("/")[1]}`,
            ]
          : []),
        `${node.hostname}.cmd('ip a a ${ip} dev ${dev}')`,
      );
    });
  }

  #addSwitch(swtch) {
    this.#addHostname(swtch);

    const args = pyArgs([
      [swtch.hostname, String],
      [swtch.batch != null, swtch.batch, Boolean, "batch"],
      [swtch.datapath != null, swtch.datapath, String, "datapath"],
      [swtch.dpctlPort != null, swtch.dpctlPort, Number, "listenPort"],
      [swtch.dpid != null, swtch.dpid, String, "dpid"],
      [swtch.dpopts != null, swtch.dpopts, String, "dpopts"],
      [swtch.failMode != null, swtch.failMode, String, "failMode"],
      [swtch.inNamespace != null, swtch.inNamespace, Boolean, "inNamespace"],
      [swtch.inband != null, swtch.inband, Boolean, "inband"],
      [swtch.ip != null, swtch.ip, String, "ip"],
      [swtch.opts != null, swtch.opts, String, "opts"],
      [swtch.protocol != null, swtch.protocol, String, "protocols"],
      [swtch.reconnectms != null, swtch.reconnectms, Number, "reconnectms"],
      [swtch.stp != null, swtch.stp, Boolean, "stp"],
      [swtch.stpPriority != null, swtch.stpPriority, Number, "prio"],
      [
        swtch.switchType != null,
        `mininet.node.${swtch.switchType}`,
        null,
        "cls",
      ],
      [swtch.verbose != null, swtch.verbose, Boolean, "verbose"],
    ]);
    const controllerHostnames = this.#getNeighbors(swtch, ["controller"]).map(
      (controller) => controller.hostname,
    );
    this.#code.add(
      "nodes",
      `${swtch.hostname} = net.addSwitch(${args.join(", ")})`,
    );
    this.#code.add(
      "startSwitches",
      `${swtch.hostname}.start([${controllerHostnames.join(", ")}])`,
    );

    this.#addNodeScripts(swtch.hostname, swtch.startScript, swtch.stopScript);
  }

  #portToNode(port) {
    return this.#getNeighbors(port, ["host", "switch"])[0];
  }

  #getNeighbors(node, types) {
    const nodes = new Set();
    node.$associations.forEach((assoc) => {
      assoc.$nodes.forEach((node) => nodes.add(node));
    });

    return [...nodes].filter((n) => n !== node && types.indexOf(n.type) >= 0);
  }

  #addHostname(item) {
    const hostname = item.hostname;
    if (this.#hostnames.has(hostname)) {
      throw new SyntaxError("Hostname collision.");
    } else {
      this.#hostnames.add(hostname);
    }
  }

  #addDevname(port, devname) {
    if (this.#devnames[devname]) {
      const error = new SyntaxError("Devname collision.");
      error.payload = {
        devname,
        ports: [this.#devnames[devname], port],
      };
      throw error;
    } else {
      this.#devnames[devname] = port;
    }
  }

  #addLinkedPort(port) {
    if (this.#linked.has(port)) {
      const error = new SyntaxError("Multiple links per port.");
      error.payload = { port };
      throw error;
    } else {
      this.#linked.add(port);
    }
  }

  #scriptToCmds(script, nodeVar) {
    return script
      .split("\n")
      .filter((line) => !/^(#|$)/.test(line))
      .map((line) => [
        `mininet.log.debug('${nodeVar || "[mininet]"}> ${line}\\n')`,
        nodeVar ? `${nodeVar}.cmdPrint('${line}')` : `cli.onecmd('${line}')`,
      ])
      .reduce((acc, val) => acc.concat(val), []);
  }

  #addNodeScripts(hostname, startScript, stopScript) {
    if (startScript) {
      this.#code.add(
        "nodeStartCmds",
        ...this.#scriptToCmds(startScript, hostname),
      );
    }
    if (stopScript) {
      this.#code.add(
        "nodeStopCmds",
        ...this.#scriptToCmds(stopScript, hostname),
      );
    }
  }

  #log(msg, severity, item) {
    this.#code.add("log", msg.replace(/^(.*)$/gm, "# $1"));
    this.log.push({ item, severity, msg });
  }
}
