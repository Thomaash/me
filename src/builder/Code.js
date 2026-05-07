const sectionMeta = [
  {
    name: "imports",
    displayName: "Imports",
    silent: true,
    defaults: [
      "from mininet.cli import CLI",
      "from mininet.net import Mininet",
      "import mininet.link",
      "import mininet.log",
      "import mininet.node",
    ],
  },
  { name: "preInit", displayName: "Prepare workspace" },
  {
    name: "mininetArgs",
    defaults: [
      "build=False",
      "controller=mininet.node.RemoteController",
      "link=mininet.link.TCLink",
      "topo=None",
    ],
  },
  {
    name: "init",
    displayName: "Initialize Mininet",
    derived: ({ mininetArgs }) => [
      `net = Mininet(${mininetArgs.join(", ")})`,
      "cli = CLI(net, script='/dev/null')",
    ],
  },
  { name: "postInit", displayName: "Run post-init commands" },
  { name: "nodes", displayName: "Add nodes" },
  { name: "links", displayName: "Add links" },
  { name: "ports", displayName: "Add interfaces" },
  { name: "nodeLimits", displayName: "Add node limits" },
  { name: "ips", displayName: "Add IP addresses" },
  {
    name: "build",
    displayName: "Build the network",
    defaults: ["net.build()"],
  },
  { name: "startControllers", displayName: "Start controllers" },
  { name: "startSwitches", displayName: "Start switches" },
  { name: "nodeStartCmds", displayName: "Run node startup commands" },
  { name: "globalStartCmds", displayName: "Run global startup commands" },
  { name: "cli", displayName: "Start CLI", defaults: ["cli.run()"] },
  { name: "globalStopCmds", displayName: "Run global shutdown commands" },
  { name: "nodeStopCmds", displayName: "Run node shutdown commands" },
  { name: "finish", displayName: "Finish", defaults: ["net.stop()"] },
  { name: "log", displayName: "Log", silent: true },
];

const metaByName = new Map(sectionMeta.map((m) => [m.name, m]));

export class Code {
  #lines = new Map(
    sectionMeta
      .filter((m) => !m.derived)
      .map((m) => [m.name, [...(m.defaults ?? [])]]),
  );

  add(name, ...values) {
    if (name == null) {
      throw new Error("Code.add: section name is required");
    }
    const meta = metaByName.get(name);
    if (!meta || meta.derived) {
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
    this.#lines.get(name).push(...values);
  }

  toString() {
    const body = [];
    for (const meta of sectionMeta) {
      if (!meta.displayName) continue;
      const lines = meta.derived
        ? meta.derived(Object.fromEntries(this.#lines))
        : this.#lines.get(meta.name);
      if (!lines.length) continue;
      body.push(
        ...renderSection(meta.displayName, lines, meta.silent === true),
      );
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
