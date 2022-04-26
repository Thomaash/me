const metadata = [
  { attr: "imports", name: "Imports", silent: true },
  { attr: "preInit", name: "Prepare workspace" },
  { attr: "init", name: "Initialize Mininet" },
  { attr: "nodes", name: "Add nodes" },
  { attr: "links", name: "Add links" },
  { attr: "ports", name: "Add interfaces" },
  { attr: "nodeLimits", name: "Add node limits" },
  { attr: "ips", name: "Add IP addresses" },
  { attr: "build", name: "Build the network" },
  { attr: "startControllers", name: "Start controllers" },
  { attr: "startSwitches", name: "Start switches" },
  { attr: "nodeStartCmds", name: "Run node startup commands" },
  { attr: "globalStartCmds", name: "Run global startup commands" },
  { attr: "cli", name: "Start CLI" },
  { attr: "globalStopCmds", name: "Run global shutdown commands" },
  { attr: "nodeStopCmds", name: "Run node shutdown commands" },
  { attr: "finish", name: "Finish" },
  { attr: "log", name: "Log", silent: true },
];

export default class {
  constructor() {
    this.imports = [
      "from mininet.cli import CLI",
      "from mininet.net import Mininet",
      "import mininet.link",
      "import mininet.log",
      "import mininet.node",
    ];
    this.init = [
      () => `net = Mininet(${this.mininetArgs.join(", ")})`,
      "cli = CLI(net, script='/dev/null')",
    ];
    this.build = ["net.build()"];
    this.cli = ["cli.run()"];
    this.finish = ["net.stop()"];

    // Init empty arrays
    metadata.forEach(({ attr }) => {
      if (!this[attr]) {
        this[attr] = [];
      }
    });

    // Helpers
    this.mininetArgs = [
      "build=False",
      "controller=mininet.node.RemoteController",
      "link=mininet.link.TCLink",
      "topo=None",
    ];
  }

  toString() {
    const code = [];
    metadata.forEach(({ attr, name, silent }) => {
      const arr = this[attr].map((v) => (v.apply ? v.apply() : v));

      if (arr.length) {
        code.push(
          `# ${name} {{{`,
          "",
          ...(silent ? [] : [`mininet.log.info('\\n*** ${name}\\n')`, ""]),
          ...arr,
          "",
          "# }}}"
        );
      }
    });

    return [
      "#!/usr/bin/env python2",
      "# -*- coding: utf-8 -*-",
      "",
      ...code,
      "",
      "# vim:fdm=marker",
      "",
    ].join("\n");
  }
}
