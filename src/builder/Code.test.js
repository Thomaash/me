import { describe, it } from "vitest";
import { Code } from "@/builder/Code.js";

describe.concurrent("Code", () => {
  describe("default render", () => {
    it("includes shebang, encoding line, and vim modeline", ({ expect }) => {
      const output = new Code().toString();
      const lines = output.split("\n");
      expect(lines[0]).toBe("#!/usr/bin/env python2");
      expect(lines[1]).toBe("# -*- coding: utf-8 -*-");
      const nonEmpty = lines.filter((l) => l.length > 0);
      expect(nonEmpty[nonEmpty.length - 1]).toBe("# vim:fdm=marker");
    });

    it("includes the five default imports", ({ expect }) => {
      const output = new Code().toString();
      expect(output).toContain("from mininet.cli import CLI");
      expect(output).toContain("from mininet.net import Mininet");
      expect(output).toContain("import mininet.link");
      expect(output).toContain("import mininet.log");
      expect(output).toContain("import mininet.node");
    });

    it("renders derived init line with the four default mininet args", ({
      expect,
    }) => {
      const output = new Code().toString();
      expect(output).toContain(
        "net = Mininet(build=False, controller=mininet.node.RemoteController, link=mininet.link.TCLink, topo=None)",
      );
      expect(output).toContain("cli = CLI(net, script='/dev/null')");
    });

    it("renders default build, cli, and finish content", ({ expect }) => {
      const output = new Code().toString();
      expect(output).toContain("net.build()");
      expect(output).toContain("cli.run()");
      expect(output).toContain("net.stop()");
    });

    it("does not render fold markers for empty optional sections", ({
      expect,
    }) => {
      const output = new Code().toString();
      expect(output).not.toContain("# Prepare workspace {{{");
      expect(output).not.toContain("# Add nodes {{{");
      expect(output).not.toContain("# Add links {{{");
      expect(output).not.toContain("# Log {{{");
    });
  });

  describe("add() validation", () => {
    it("throws when called with no arguments", ({ expect }) => {
      const code = new Code();
      expect(() => code.add()).toThrow();
    });

    it("throws when given an unknown section name", ({ expect }) => {
      const code = new Code();
      expect(() => code.add("unknownSection", "x")).toThrow();
    });

    it("throws when given a non-string value", ({ expect }) => {
      const code = new Code();
      expect(() => code.add("nodes", 123)).toThrow();
    });

    it("is a no-op when called with only a section name", ({ expect }) => {
      const code = new Code();
      const before = code.toString();
      expect(() => code.add("nodes")).not.toThrow();
      expect(code.toString()).toBe(before);
    });
  });

  describe("add() to writable sections", () => {
    it("renders nodes content under '# Add nodes {{{' with announce line", ({
      expect,
    }) => {
      const code = new Code();
      code.add("nodes", "net.addHost('h1')");
      const output = code.toString();
      expect(output).toContain("# Add nodes {{{");
      expect(output).toContain("mininet.log.info('\\n*** Add nodes\\n')");
      expect(output).toContain("net.addHost('h1')");
    });

    it("appends mininetArgs to the derived Mininet() call after defaults", ({
      expect,
    }) => {
      const code = new Code();
      code.add("mininetArgs", "autoSetMacs=True");
      const output = code.toString();
      expect(output).toContain(
        "net = Mininet(build=False, controller=mininet.node.RemoteController, link=mininet.link.TCLink, topo=None, autoSetMacs=True)",
      );
    });

    it("does not produce a section when add(name) is called without values", ({
      expect,
    }) => {
      const code = new Code();
      code.add("nodes");
      const output = code.toString();
      expect(output).not.toContain("# Add nodes {{{");
      expect(output).not.toContain("mininet.log.info('\\n*** Add nodes\\n')");
    });
  });

  describe("silent sections", () => {
    it("renders imports content without announce line", ({ expect }) => {
      const code = new Code();
      code.add("imports", "import x");
      const output = code.toString();
      expect(output).toContain("import x");
      expect(output).not.toContain("mininet.log.info('\\n*** Imports\\n')");
    });

    it("renders log content without announce line", ({ expect }) => {
      const code = new Code();
      code.add("log", "# msg");
      const output = code.toString();
      expect(output).toContain("# msg");
      expect(output).not.toContain("mininet.log.info('\\n*** Log\\n')");
    });
  });

  describe("preInit and postInit placement", () => {
    it("renders preInit before the derived init line", ({ expect }) => {
      const code = new Code();
      code.add("preInit", "os.mkdir('/tmp/mn')");
      const output = code.toString();
      const preIdx = output.indexOf("os.mkdir('/tmp/mn')");
      const initIdx = output.indexOf("net = Mininet(");
      expect(preIdx).toBeGreaterThan(-1);
      expect(initIdx).toBeGreaterThan(-1);
      expect(preIdx).toBeLessThan(initIdx);
    });

    it("renders postInit after cli line and before nodes section", ({
      expect,
    }) => {
      const code = new Code();
      code.add("postInit", "net.waitConnected()");
      code.add("nodes", "net.addHost('h1')");
      const output = code.toString();
      const cliIdx = output.indexOf("cli = CLI(net, script='/dev/null')");
      const postIdx = output.indexOf("net.waitConnected()");
      const nodesIdx = output.indexOf("# Add nodes {{{");
      expect(cliIdx).toBeGreaterThan(-1);
      expect(postIdx).toBeGreaterThan(-1);
      expect(nodesIdx).toBeGreaterThan(-1);
      expect(postIdx).toBeGreaterThan(cliIdx);
      expect(postIdx).toBeLessThan(nodesIdx);
    });
  });

  describe("canonical section order", () => {
    it("renders imports -> preInit -> init -> postInit -> nodes -> links -> finish", ({
      expect,
    }) => {
      const code = new Code();
      code.add("imports", "import extra");
      code.add("preInit", "preinit_marker_xyz()");
      code.add("postInit", "postinit_marker_xyz()");
      code.add("nodes", "nodes_marker_xyz()");
      code.add("links", "links_marker_xyz()");
      const output = code.toString();

      const positions = [
        output.indexOf("import extra"),
        output.indexOf("preinit_marker_xyz()"),
        output.indexOf("net = Mininet("),
        output.indexOf("postinit_marker_xyz()"),
        output.indexOf("nodes_marker_xyz()"),
        output.indexOf("links_marker_xyz()"),
        output.indexOf("net.stop()"),
      ];

      positions.forEach((p, i) => {
        expect(p, `position ${i} should be present`).toBeGreaterThan(-1);
      });

      for (let i = 1; i < positions.length; i++) {
        expect(
          positions[i],
          `index ${i} should follow index ${i - 1}`,
        ).toBeGreaterThan(positions[i - 1]);
      }
    });
  });
});
