import { describe, it } from "vitest";
import Code from "@/builder/Code.js";

describe.concurrent("Code", () => {
  describe("constructor initialization", () => {
    it("initializes imports with mininet CLI, net, link, log, and node imports", ({
      expect,
    }) => {
      const code = new Code();
      expect(code.imports).toEqual([
        "from mininet.cli import CLI",
        "from mininet.net import Mininet",
        "import mininet.link",
        "import mininet.log",
        "import mininet.node",
      ]);
    });

    it("initializes init with Mininet instantiation function and CLI creation string", ({
      expect,
    }) => {
      const code = new Code();
      expect(code.init).toHaveLength(2);
      expect(typeof code.init[0]).toBe("function");
      expect(code.init[1]).toBe("cli = CLI(net, script='/dev/null')");
    });

    it("initializes build, cli, and finish arrays with correct commands", ({
      expect,
    }) => {
      const code = new Code();
      expect(code.build).toEqual(["net.build()"]);
      expect(code.cli).toEqual(["cli.run()"]);
      expect(code.finish).toEqual(["net.stop()"]);
    });

    it("initializes empty arrays for all metadata sections not pre-initialized", ({
      expect,
    }) => {
      const code = new Code();
      const expectedEmpty = [
        "preInit",
        "nodes",
        "links",
        "ports",
        "nodeLimits",
        "ips",
        "startControllers",
        "startSwitches",
        "nodeStartCmds",
        "globalStartCmds",
        "globalStopCmds",
        "nodeStopCmds",
        "log",
      ];
      expectedEmpty.forEach((attr) => {
        expect(code[attr], `${attr} should be an empty array`).toEqual([]);
      });
    });

    it("initializes mininetArgs with build, controller, link, and topo defaults", ({
      expect,
    }) => {
      const code = new Code();
      expect(code.mininetArgs).toEqual([
        "build=False",
        "controller=mininet.node.RemoteController",
        "link=mininet.link.TCLink",
        "topo=None",
      ]);
    });
  });

  describe("toString() output structure", () => {
    it("starts with shebang line and encoding declaration", ({ expect }) => {
      const code = new Code();
      const output = code.toString();
      const lines = output.split("\n");
      expect(lines[0]).toBe("#!/usr/bin/env python2");
      expect(lines[1]).toBe("# -*- coding: utf-8 -*-");
    });

    it("ends with vim modeline comment", ({ expect }) => {
      const code = new Code();
      const output = code.toString();
      const lines = output.split("\n");
      const nonEmptyLines = lines.filter((l) => l.length > 0);
      expect(nonEmptyLines[nonEmptyLines.length - 1]).toBe("# vim:fdm=marker");
    });

    it("wraps each non-empty section in fold markers", ({ expect }) => {
      const code = new Code();
      const output = code.toString();

      expect(output).toContain("# Imports {{{");
      expect(output).toContain("# Initialize Mininet {{{");
      expect(output).toContain("# Build the network {{{");
      expect(output).toContain("# Start CLI {{{");
      expect(output).toContain("# Finish {{{");

      const closingMarkers = output.match(/# }}}/g);
      expect(closingMarkers.length).toBeGreaterThanOrEqual(5);
    });

    it("adds mininet.log.info for non-silent sections and omits for silent sections", ({
      expect,
    }) => {
      const code = new Code();
      const output = code.toString();

      // Non-silent sections should have log.info
      expect(output).toContain(
        "mininet.log.info('\\n*** Initialize Mininet\\n')",
      );
      expect(output).toContain(
        "mininet.log.info('\\n*** Build the network\\n')",
      );
      expect(output).toContain("mininet.log.info('\\n*** Start CLI\\n')");
      expect(output).toContain("mininet.log.info('\\n*** Finish\\n')");

      // Silent sections (imports, log) should NOT have log.info
      expect(output).not.toContain("mininet.log.info('\\n*** Imports\\n')");
      expect(output).not.toContain("mininet.log.info('\\n*** Log\\n')");
    });

    it("resolves function entries by calling .apply()", ({ expect }) => {
      const code = new Code();
      const output = code.toString();

      // The init[0] function resolves mininetArgs into the Mininet() call
      expect(output).toContain(
        "net = Mininet(build=False, controller=mininet.node.RemoteController, link=mininet.link.TCLink, topo=None)",
      );
    });

    it("does not include fold markers for empty sections", ({ expect }) => {
      const code = new Code();
      const output = code.toString();

      // preInit, nodes, links etc. are empty and should not appear
      expect(output).not.toContain("# Prepare workspace {{{");
      expect(output).not.toContain("# Add nodes {{{");
      expect(output).not.toContain("# Add links {{{");
    });

    it("includes content from sections populated after construction", ({
      expect,
    }) => {
      const code = new Code();
      code.nodes.push("net.addHost('h1')");
      code.log.push("print('done')");
      const output = code.toString();

      // nodes is non-silent, should have fold marker and log.info
      expect(output).toContain("# Add nodes {{{");
      expect(output).toContain("mininet.log.info('\\n*** Add nodes\\n')");
      expect(output).toContain("net.addHost('h1')");

      // log is silent, should have fold marker but no log.info
      expect(output).toContain("# Log {{{");
      expect(output).not.toContain("mininet.log.info('\\n*** Log\\n')");
      expect(output).toContain("print('done')");
    });

    it.for([
      ["preInit", "Prepare workspace"],
      ["links", "Add links"],
      ["ports", "Add interfaces"],
      ["nodeLimits", "Add node limits"],
      ["ips", "Add IP addresses"],
      ["startControllers", "Start controllers"],
      ["startSwitches", "Start switches"],
      ["nodeStartCmds", "Run node startup commands"],
      ["globalStartCmds", "Run global startup commands"],
      ["globalStopCmds", "Run global shutdown commands"],
      ["nodeStopCmds", "Run node shutdown commands"],
    ])(
      "uses exact step name '%s' -> '%s' in fold marker and log.info when section is populated",
      ([attr, name], { expect }) => {
        const code = new Code();
        code[attr].push("dummy_command()");
        const output = code.toString();

        expect(output).toContain(`# ${name} {{{`);
        expect(output).toContain(`mininet.log.info('\\n*** ${name}\\n')`);
      },
    );

    it("produces no content between shebang header and first section when all optional sections are empty", ({
      expect,
    }) => {
      const code = new Code();
      const output = code.toString();
      const lines = output.split("\n");

      // Line 0: shebang, Line 1: encoding, Line 2: blank, Line 3: first section marker
      expect(lines[2]).toBe("");
      expect(lines[3]).toBe("# Imports {{{");
    });

    it("separates section content with blank lines in the correct pattern", ({
      expect,
    }) => {
      const code = new Code();
      code.preInit.push("os.mkdir('/tmp/mn')");
      const output = code.toString();

      // Each non-empty section follows: "# Name {{{", "", "log.info(...)", "", ...content, "", "# }}}"
      // For non-silent sections, verify blank line after fold marker and after log.info
      const sectionMatch = output.match(
        /# Prepare workspace \{\{\{\n\n.*?mininet\.log\.info.*?\n\n.*?os\.mkdir.*?\n\n# \}\}\}/s,
      );
      expect(sectionMatch).not.toBeNull();
    });

    it("for silent sections, omits log.info line but keeps blank line separators", ({
      expect,
    }) => {
      const code = new Code();
      const output = code.toString();

      // Imports is silent: "# Imports {{{", "", ...imports..., "", "# }}}"
      // There should be no mininet.log.info between the fold marker and the import lines
      const importsSection = output.match(/# Imports \{\{\{\n\n(.*?)# \}\}\}/s);
      expect(importsSection).not.toBeNull();
      expect(importsSection[1]).not.toContain("mininet.log.info");
    });
  });
});
