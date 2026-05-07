import { describe, it } from "vitest";
import { importer } from "@/importer/index.js";

const { stringToImport, importAccept } = importer;

describe.concurrent("importer", () => {
  describe("stringToImport", () => {
    it("parses valid JSON by extension and returns data with empty log and warnings", async ({
      expect,
    }) => {
      const json = JSON.stringify({ version: 0, items: [] });
      const result = await stringToImport("", "project.json", json);

      expect(result.data).toEqual({ version: 0, items: [] });
      expect(result.log).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    it("parses valid JSON by MIME type", async ({ expect }) => {
      const json = JSON.stringify({ name: "test" });
      const result = await stringToImport("application/json", "file.txt", json);

      expect(result.data).toEqual({ name: "test" });
    });

    it("parses Python script by extension and includes script-import-warning", async ({
      expect,
    }) => {
      const script = `
net = Mininet(topo=None, build=False)
h1 = net.addHost('h1')
net.build()
CLI(net)
net.stop()
`;
      const result = await stringToImport("", "topology.py", script);

      expect(result.data).toHaveProperty("version", 0);
      expect(Array.isArray(result.data.items)).toBe(true);
      expect(Array.isArray(result.log)).toBe(true);
      expect(result.warnings).toEqual(["script-import-warning"]);
    });

    it("parses Python script by MIME type text/x-python", async ({
      expect,
    }) => {
      const script = `
net = Mininet(topo=None, build=False)
net.build()
CLI(net)
net.stop()
`;
      const result = await stringToImport("text/x-python", "file.txt", script);

      expect(result.warnings).toEqual(["script-import-warning"]);
    });

    it("parses Python script by MIME type application/x-python-code", async ({
      expect,
    }) => {
      const script = `
net = Mininet(topo=None, build=False)
net.build()
CLI(net)
net.stop()
`;
      const result = await stringToImport(
        "application/x-python-code",
        "file.txt",
        script,
      );

      expect(result.warnings).toEqual(["script-import-warning"]);
    });

    it("falls back to file extension when MIME type is unrecognized", async ({
      expect,
    }) => {
      const json = JSON.stringify({ version: 0, items: [] });
      const result = await stringToImport(
        "application/octet-stream",
        "data.json",
        json,
      );

      expect(result.data).toEqual({ version: 0, items: [] });
      expect(result.warnings).toEqual([]);
    });

    it("throws TypeError for unknown file format", async ({ expect }) => {
      await expect(
        stringToImport("text/plain", "file.txt", "hello"),
      ).rejects.toThrow(TypeError);
      await expect(
        stringToImport("text/plain", "file.txt", "hello"),
      ).rejects.toThrow('Unknown file format: "text/plain".');
    });

    it("propagates SyntaxError for invalid JSON", async ({ expect }) => {
      await expect(
        stringToImport("application/json", "bad.json", "not-json"),
      ).rejects.toThrow(SyntaxError);
    });

    it("always returns an object with data, log, and warnings properties", async ({
      expect,
    }) => {
      const json = JSON.stringify({ key: "value" });
      const result = await stringToImport(".json", "a.json", json);

      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("log");
      expect(result).toHaveProperty("warnings");
    });
  });

  describe("importAccept", () => {
    it("contains file extensions and MIME types", ({ expect }) => {
      expect(importAccept).toContain(".json");
      expect(importAccept).toContain(".py");
      expect(importAccept).toContain("application/json");
      expect(importAccept).toContain("application/x-python-code");
      expect(importAccept).toContain("text/x-python");
    });

    it("excludes bare shorthand keys", ({ expect }) => {
      const parts = importAccept.split(",");
      for (const part of parts) {
        expect(part === "json" || part === "python").toBe(false);
      }
    });
  });
});
