import { beforeEach, describe, it, expect, vi } from "vitest";

// Mock window.matchMedia before importing AddressingPlan (which imports @/theme)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock jspdf and jspdf-autotable to capture PDF generation details
const mockSave = vi.fn();
const mockText = vi.fn();
const mockSetProperties = vi.fn();
const mockViewerPreferences = vi.fn();
const mockSetFontSize = vi.fn();

vi.mock("jspdf", () => {
  function MockJSPDF() {
    this.save = mockSave;
    this.text = mockText;
    this.setProperties = mockSetProperties;
    this.viewerPreferences = mockViewerPreferences;
    this.setFontSize = mockSetFontSize;
  }
  return { default: MockJSPDF };
});

let lastAutoTableArgs = null;
vi.mock("jspdf-autotable", () => ({
  autoTable: vi.fn((_doc, opts) => {
    lastAutoTableArgs = opts;
  }),
}));

const { default: AddressingPlan } = await import("@/builder/AddressingPlan.js");

// --- Fixture Helpers ---

let _uid = 0;
function uid() {
  return `uid-${++_uid}`;
}

function makeHost(overrides = {}) {
  const id = overrides.id || uid();
  return { id, type: "host", hostname: "h1", ...overrides, id };
}

function makeSwitch(overrides = {}) {
  const id = overrides.id || uid();
  return { id, type: "switch", hostname: "s1", ...overrides, id };
}

function makePort(overrides = {}) {
  const id = overrides.id || uid();
  return { id, type: "port", hostname: "eth0", ...overrides, id };
}

function makeAssociation(fromId, toId) {
  return { id: uid(), type: "association", from: fromId, to: toId };
}

function buildTopology(items) {
  return { items };
}

// --- Tests ---

describe("AddressingPlan", () => {
  beforeEach(() => {
    _uid = 0;
  });

  describe("build() groups ports by parent node hostname", () => {
    it("creates plan entries keyed by node hostname with ports and length", ({ expect }) => {
      const h1 = makeHost({ hostname: "host-1" });
      const p1 = makePort({ hostname: "eth0", ips: ["10.0.0.1/24"] });
      const assoc = makeAssociation(h1.id, p1.id);

      const ap = new AddressingPlan(buildTopology([h1, p1, assoc]));
      ap.build();

      expect(ap.plan["host-1"]).toBeDefined();
      expect(ap.plan["host-1"].ports["eth0"]).toEqual(["10.0.0.1/24"]);
      expect(ap.plan["host-1"].length).toBe(1);
    });

    it("groups multiple ports under the same parent node and sums IP count", ({ expect }) => {
      const h1 = makeHost({ hostname: "host-1" });
      const p1 = makePort({ hostname: "eth0", ips: ["10.0.0.1/24"] });
      const p2 = makePort({
        hostname: "eth1",
        ips: ["10.0.0.2/24", "10.0.0.3/24"],
      });
      const a1 = makeAssociation(h1.id, p1.id);
      const a2 = makeAssociation(h1.id, p2.id);

      const ap = new AddressingPlan(buildTopology([h1, p1, p2, a1, a2]));
      ap.build();

      expect(ap.plan["host-1"].ports["eth0"]).toEqual(["10.0.0.1/24"]);
      expect(ap.plan["host-1"].ports["eth1"]).toEqual([
        "10.0.0.2/24",
        "10.0.0.3/24",
      ]);
      expect(ap.plan["host-1"].length).toBe(3);
    });

    it("creates separate plan entries for ports under different nodes", ({ expect }) => {
      const h1 = makeHost({ hostname: "alpha" });
      const h2 = makeHost({ hostname: "beta" });
      const p1 = makePort({ hostname: "eth0", ips: ["10.0.0.1/24"] });
      const p2 = makePort({ hostname: "eth0", ips: ["10.0.0.2/24"] });
      const a1 = makeAssociation(h1.id, p1.id);
      const a2 = makeAssociation(h2.id, p2.id);

      const ap = new AddressingPlan(
        buildTopology([h1, h2, p1, p2, a1, a2]),
      );
      ap.build();

      expect(Object.keys(ap.plan)).toHaveLength(2);
      expect(ap.plan["alpha"].ports["eth0"]).toEqual(["10.0.0.1/24"]);
      expect(ap.plan["alpha"].length).toBe(1);
      expect(ap.plan["beta"].ports["eth0"]).toEqual(["10.0.0.2/24"]);
      expect(ap.plan["beta"].length).toBe(1);
    });
  });

  describe("port filtering", () => {
    it.each([
      ["no ips property", {}],
      ["empty ips array", { ips: [] }],
    ])("excludes ports with %s from the plan", (_label, ipOverrides) => {
      const h1 = makeHost({ hostname: "host-1" });
      const p1 = makePort({ hostname: "eth0", ...ipOverrides });
      const assoc = makeAssociation(h1.id, p1.id);

      const ap = new AddressingPlan(buildTopology([h1, p1, assoc]));
      ap.build();

      expect(Object.keys(ap.plan)).toHaveLength(0);
    });
  });

  describe("_portToNode resolves parent via associations", () => {
    it("finds a switch as parent node for a port", ({ expect }) => {
      const s1 = makeSwitch({ hostname: "switch-1" });
      const p1 = makePort({ hostname: "eth0", ips: ["172.16.0.1/16"] });
      const assoc = makeAssociation(s1.id, p1.id);

      const ap = new AddressingPlan(buildTopology([s1, p1, assoc]));
      ap.build();

      expect(ap.plan["switch-1"]).toBeDefined();
      expect(ap.plan["switch-1"].ports["eth0"]).toEqual(["172.16.0.1/16"]);
    });

    it("uses empty string hostname when port has no parent node", ({ expect }) => {
      const p1 = makePort({ hostname: "eth0", ips: ["10.0.0.1/24"] });

      const ap = new AddressingPlan(buildTopology([p1]));
      ap.build();

      expect(ap.plan[""]).toBeDefined();
      expect(ap.plan[""].ports["eth0"]).toEqual(["10.0.0.1/24"]);
      expect(ap.plan[""].length).toBe(1);
    });
  });

  describe("_getNeighbors filters by type", () => {
    it("ignores non-host/switch neighbors such as controllers", ({ expect }) => {
      const ctrl = { id: uid(), type: "controller", hostname: "c1" };
      const p1 = makePort({ hostname: "eth0", ips: ["10.0.0.1/24"] });
      const assoc = makeAssociation(ctrl.id, p1.id);

      const ap = new AddressingPlan(buildTopology([ctrl, p1, assoc]));
      ap.build();

      // Controller is not host or switch, so _portToNode returns undefined
      expect(ap.plan[""]).toBeDefined();
      expect(ap.plan[""].ports["eth0"]).toEqual(["10.0.0.1/24"]);
    });
  });

  describe("build() initializes plan node structure correctly", () => {
    it("initializes length to 0 before adding IPs and ports as empty object", ({ expect }) => {
      const h1 = makeHost({ hostname: "node-a" });
      const p1 = makePort({ hostname: "eth0", ips: ["10.0.0.1/24"] });
      const a1 = makeAssociation(h1.id, p1.id);

      const ap = new AddressingPlan(buildTopology([h1, p1, a1]));
      ap.build();

      // Verify structure: length matches IP count, ports is an object with port entries
      const planNode = ap.plan["node-a"];
      expect(planNode.length).toBe(1);
      expect(typeof planNode.ports).toBe("object");
      expect(Object.keys(planNode.ports)).toEqual(["eth0"]);
    });

    it("accumulates IPs from same port hostname into existing array", ({ expect }) => {
      // When a port hostname appears twice (same port processed), IPs are pushed
      const h1 = makeHost({ hostname: "node-b" });
      const p1 = makePort({
        hostname: "eth0",
        ips: ["10.0.0.1/24", "10.0.0.2/24"],
      });
      const a1 = makeAssociation(h1.id, p1.id);

      const ap = new AddressingPlan(buildTopology([h1, p1, a1]));
      ap.build();

      expect(ap.plan["node-b"].ports["eth0"]).toEqual([
        "10.0.0.1/24",
        "10.0.0.2/24",
      ]);
      expect(ap.plan["node-b"].length).toBe(2);
    });
  });

  describe("savePDF() generates PDF with correct structure", () => {
    beforeEach(() => {
      mockSave.mockClear();
      mockText.mockClear();
      mockSetProperties.mockClear();
      mockViewerPreferences.mockClear();
      mockSetFontSize.mockClear();
      lastAutoTableArgs = null;
    });

    function buildAndSavePDF(items, headline = "Test Plan", filename = "test.pdf") {
      const ap = new AddressingPlan(buildTopology(items));
      ap.build();
      ap.savePDF(headline, filename);
      return ap;
    }

    function singlePortTopology() {
      const h1 = makeHost({ hostname: "host-1" });
      const p1 = makePort({ hostname: "eth0", ips: ["10.0.0.1/24"] });
      const a1 = makeAssociation(h1.id, p1.id);
      return [h1, p1, a1];
    }

    it("sets document properties with the headline as title", ({ expect }) => {
      buildAndSavePDF(singlePortTopology(), "My Network Plan");

      expect(mockSetProperties).toHaveBeenCalledWith({ title: "My Network Plan" });
    });

    it("sets viewer preferences with DisplayDocTitle enabled", ({ expect }) => {
      buildAndSavePDF(singlePortTopology());

      expect(mockViewerPreferences).toHaveBeenCalledWith({ DisplayDocTitle: true });
    });

    it("renders headline text at position (14, 20) with font size 18 then resets to 11", ({ expect }) => {
      buildAndSavePDF(singlePortTopology(), "Network Addressing");

      expect(mockSetFontSize).toHaveBeenCalledWith(18);
      expect(mockText).toHaveBeenCalledWith("Network Addressing", 14, 20);
      expect(mockSetFontSize).toHaveBeenCalledWith(11);
    });

    it("saves the PDF file with the provided filename", ({ expect }) => {
      buildAndSavePDF(singlePortTopology(), "Plan", "my-plan.pdf");

      expect(mockSave).toHaveBeenCalledWith("my-plan.pdf");
    });

    it("configures autoTable with grid theme, correct headers, and startY", ({ expect }) => {
      buildAndSavePDF(singlePortTopology());

      expect(lastAutoTableArgs.theme).toBe("grid");
      expect(lastAutoTableArgs.startY).toBe(30);
      expect(lastAutoTableArgs.head).toEqual([["Hostname", "Port", "Address"]]);
      expect(lastAutoTableArgs.headStyles).toHaveProperty("fillColor");
    });

    it("builds body rows with node hostname rowSpan, port rowSpan, and IP address", ({ expect }) => {
      buildAndSavePDF(singlePortTopology());

      const body = lastAutoTableArgs.body;
      expect(body).toHaveLength(1);
      // First row in node: has hostname cell with rowSpan, port cell with rowSpan, and IP
      expect(body[0]).toHaveLength(3);
      expect(body[0][0]).toEqual({
        rowSpan: 1,
        content: "host-1",
        styles: { valign: "middle" },
      });
      expect(body[0][1]).toEqual({
        rowSpan: 1,
        content: "eth0",
        styles: { valign: "middle" },
      });
      expect(body[0][2]).toBe("10.0.0.1/24");
    });

    it("uses rowSpan for node hostname spanning multiple IPs across ports", ({ expect }) => {
      const h1 = makeHost({ hostname: "host-1" });
      const p1 = makePort({ hostname: "eth0", ips: ["10.0.0.1/24"] });
      const p2 = makePort({ hostname: "eth1", ips: ["10.0.0.2/24", "10.0.0.3/24"] });
      const a1 = makeAssociation(h1.id, p1.id);
      const a2 = makeAssociation(h1.id, p2.id);

      buildAndSavePDF([h1, p1, p2, a1, a2]);

      const body = lastAutoTableArgs.body;
      // Total IPs: 3 (1 from eth0 + 2 from eth1), so 3 rows
      expect(body).toHaveLength(3);

      // First row: hostname cell with rowSpan=3 (total IPs), first port cell with rowSpan=1
      expect(body[0][0].rowSpan).toBe(3);
      expect(body[0][0].content).toBe("host-1");
      expect(body[0][0].styles.valign).toBe("middle");

      // Second row: only port cell (rowSpan for eth1) + IP, no hostname cell
      // Find the row for eth1 first IP
      const eth1FirstRow = body.find(
        (row) => row.length === 2 && typeof row[0] === "object" && row[0].content === "eth1",
      );
      expect(eth1FirstRow).toBeDefined();
      expect(eth1FirstRow[0].rowSpan).toBe(2);
      expect(eth1FirstRow[0].styles.valign).toBe("middle");

      // Third row for eth1 second IP: just the IP, no hostname or port cell
      const ipOnlyRows = body.filter((row) => row.length === 1);
      expect(ipOnlyRows).toHaveLength(1);
      expect(ipOnlyRows[0][0]).toBe("10.0.0.3/24");
    });

    it("omits hostname and port cells for subsequent IPs in the same port", ({ expect }) => {
      const h1 = makeHost({ hostname: "host-1" });
      const p1 = makePort({
        hostname: "eth0",
        ips: ["10.0.0.1/24", "10.0.0.2/24", "10.0.0.3/24"],
      });
      const a1 = makeAssociation(h1.id, p1.id);

      buildAndSavePDF([h1, p1, a1]);

      const body = lastAutoTableArgs.body;
      expect(body).toHaveLength(3);

      // First row: hostname + port + ip (3 cells)
      expect(body[0]).toHaveLength(3);
      expect(body[0][0].rowSpan).toBe(3);
      expect(body[0][1].rowSpan).toBe(3);

      // Subsequent rows: only IP (1 cell each)
      expect(body[1]).toHaveLength(1);
      expect(body[1][0]).toBe("10.0.0.2/24");
      expect(body[2]).toHaveLength(1);
      expect(body[2][0]).toBe("10.0.0.3/24");
    });

    it("sorts nodes alphabetically in the PDF body", ({ expect }) => {
      const h1 = makeHost({ hostname: "zebra" });
      const h2 = makeHost({ hostname: "alpha" });
      const p1 = makePort({ hostname: "eth0", ips: ["10.0.0.1/24"] });
      const p2 = makePort({ hostname: "eth0", ips: ["10.0.0.2/24"] });
      const a1 = makeAssociation(h1.id, p1.id);
      const a2 = makeAssociation(h2.id, p2.id);

      buildAndSavePDF([h1, h2, p1, p2, a1, a2]);

      const body = lastAutoTableArgs.body;
      // "alpha" should come before "zebra"
      expect(body[0][0].content).toBe("alpha");
      expect(body[1][0].content).toBe("zebra");
    });

    it("sorts ports within a node alphabetically in the PDF body", ({ expect }) => {
      const h1 = makeHost({ hostname: "host-1" });
      const p1 = makePort({ hostname: "eth9", ips: ["10.0.0.1/24"] });
      const p2 = makePort({ hostname: "eth0", ips: ["10.0.0.2/24"] });
      const a1 = makeAssociation(h1.id, p1.id);
      const a2 = makeAssociation(h1.id, p2.id);

      buildAndSavePDF([h1, p1, p2, a1, a2]);

      const body = lastAutoTableArgs.body;
      // First row has hostname + port; eth0 should come before eth9
      expect(body[0][1].content).toBe("eth0");
      // Second row has only port cell (no hostname cell) + IP
      const secondPortRow = body.find(
        (row) => row.length === 2 && typeof row[0] === "object" && row[0].content === "eth9",
      );
      expect(secondPortRow).toBeDefined();
    });

    it("produces multiple node sections with correct rowSpans for complex topology", ({ expect }) => {
      const h1 = makeHost({ hostname: "node-a" });
      const h2 = makeHost({ hostname: "node-b" });
      const p1 = makePort({ hostname: "eth0", ips: ["10.0.0.1/24", "10.0.0.2/24"] });
      const p2 = makePort({ hostname: "eth0", ips: ["10.0.0.3/24"] });
      const a1 = makeAssociation(h1.id, p1.id);
      const a2 = makeAssociation(h2.id, p2.id);

      buildAndSavePDF([h1, h2, p1, p2, a1, a2]);

      const body = lastAutoTableArgs.body;
      // node-a: 2 IPs, node-b: 1 IP = 3 rows total
      expect(body).toHaveLength(3);

      // First node (node-a) has rowSpan=2
      expect(body[0][0].rowSpan).toBe(2);
      expect(body[0][0].content).toBe("node-a");

      // Third row is node-b with rowSpan=1
      const nodeBRow = body.find(
        (row) => row.length === 3 && row[0].content === "node-b",
      );
      expect(nodeBRow).toBeDefined();
      expect(nodeBRow[0].rowSpan).toBe(1);
    });
  });
});
