const sectionMeta = [
  { name: "imports", displayName: "Imports", silent: true },
  { name: "preInit", displayName: "Prepare workspace" },
  { name: "postInit", displayName: "Run post-init commands" },
  { name: "nodes", displayName: "Add nodes" },
  { name: "links", displayName: "Add links" },
  { name: "ports", displayName: "Add interfaces" },
  { name: "nodeLimits", displayName: "Add node limits" },
  { name: "ips", displayName: "Add IP addresses" },
  { name: "build", displayName: "Build the network" },
  { name: "startControllers", displayName: "Start controllers" },
  { name: "startSwitches", displayName: "Start switches" },
  { name: "nodeStartCmds", displayName: "Run node startup commands" },
  { name: "globalStartCmds", displayName: "Run global startup commands" },
  { name: "cli", displayName: "Start CLI" },
  { name: "globalStopCmds", displayName: "Run global shutdown commands" },
  { name: "nodeStopCmds", displayName: "Run node shutdown commands" },
  { name: "finish", displayName: "Finish" },
  { name: "log", displayName: "Log", silent: true },
];

const writableNames = new Set([
  ...sectionMeta.map((m) => m.name),
  "mininetArgs",
]);

const defaultImports = [
  "from mininet.cli import CLI",
  "from mininet.net import Mininet",
  "import mininet.link",
  "import mininet.log",
  "import mininet.node",
];

const defaultMininetArgs = [
  "build=False",
  "controller=mininet.node.RemoteController",
  "link=mininet.link.TCLink",
  "topo=None",
];

const INIT_DISPLAY_NAME = "Initialize Mininet";

export default class Code {
  #sections = new Map(sectionMeta.map(({ name }) => [name, []]));
  #mininetArgs = [...defaultMininetArgs];

  constructor() {
    this.#sections.get("imports").push(...defaultImports);
    this.#sections.get("build").push("net.build()");
    this.#sections.get("cli").push("cli.run()");
    this.#sections.get("finish").push("net.stop()");
  }

  add(name, ...values) {
    if (name == null) {
      throw new Error("Code.add: section name is required");
    }
    if (!writableNames.has(name)) {
      throw new Error(`Code.add: unknown section name "${name}"`);
    }
    for (const v of values) {
      if (typeof v !== "string") {
        throw new Error(
          `Code.add: unsupported value type "${typeof v}" for section "${name}"`,
        );
      }
    }
    if (values.length === 0) return;
    if (name === "mininetArgs") {
      this.#mininetArgs.push(...values);
    } else {
      this.#sections.get(name).push(...values);
    }
  }

  toString() {
    const body = [];
    for (const { name, displayName, silent } of sectionMeta) {
      if (name === "postInit") {
        body.push(
          ...renderSection(INIT_DISPLAY_NAME, this.#initLines(), false),
        );
      }
      const lines = this.#sections.get(name);
      if (lines.length) {
        body.push(...renderSection(displayName, lines, silent === true));
      }
    }

    return [
      "#!/usr/bin/env python2",
      "# -*- coding: utf-8 -*-",
      "",
      ...body,
      "",
      "# vim:fdm=marker",
      "",
    ].join("\n");
  }

  #initLines() {
    return [
      `net = Mininet(${this.#mininetArgs.join(", ")})`,
      "cli = CLI(net, script='/dev/null')",
    ];
  }
}

function renderSection(displayName, lines, silent) {
  return [
    `# ${displayName} {{{`,
    "",
    ...(silent ? [] : [`mininet.log.info('\\n*** ${displayName}\\n')`, ""]),
    ...lines,
    "",
    "# }}}",
  ];
}
