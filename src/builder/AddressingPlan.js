import JsPDF from "jspdf";
import "jspdf-autotable";

import Items from "./Items";
import { compare } from "@/components/vis/locale";
import { vuetify as theme } from "@/theme";

function compareEntries([a], [b]) {
  return compare(a, b);
}

export default class {
  constructor(data) {
    this.data = data;
  }

  build() {
    const items = new Items(this.data.items);

    this.plan = Object.create(null);

    items.arr.port
      .filter((port) => port.ips && port.ips.length)
      .forEach((port) => {
        const node = this._portToNode(port);
        const nodeHostname = node ? node.hostname : "";

        const planNode = (this.plan[nodeHostname] = this.plan[nodeHostname] || {
          length: 0,
          ports: Object.create(null),
        });

        const planPort = (planNode.ports[port.hostname] =
          planNode.ports[port.hostname] || []);
        planPort.push(...port.ips);

        planNode.length += port.ips.length;
      });
  }

  savePDF(headline, filename) {
    const body = [];
    Object.entries(this.plan)
      .sort(compareEntries)
      .forEach(([nodeHostname, node]) => {
        let firstInNode = true;
        Object.entries(node.ports)
          .sort(compareEntries)
          .forEach(([portHostname, ips]) => {
            let firstInPort = true;
            ips.forEach((ip) => {
              const row = [];

              if (firstInNode) {
                row.push({
                  rowSpan: node.length,
                  content: nodeHostname,
                  styles: { valign: "middle" },
                });
              }
              if (firstInPort) {
                row.push({
                  rowSpan: ips.length,
                  content: portHostname,
                  styles: { valign: "middle" },
                });
              }
              body.push([...row, ip]);

              firstInNode = false;
              firstInPort = false;
            });
          });
      });

    const doc = new JsPDF();

    doc.setProperties({ title: headline });
    doc.viewerPreferences({ DisplayDocTitle: true });

    doc.setFontSize(18);
    doc.text(headline, 14, 20);
    doc.setFontSize(11);

    doc.autoTable({
      startY: 30,
      theme: "grid",
      headStyles: { fillColor: theme.primary },
      head: [["Hostname", "Port", "Address"]],
      body,
    });

    doc.save(filename);
  }

  _portToNode(port) {
    return this._getNeighbors(port, ["host", "switch"])[0];
  }

  _getNeighbors(node, types) {
    const nodes = new Set();
    node.$associations.forEach((assoc) => {
      assoc.$nodes.forEach((node) => nodes.add(node));
    });

    return [...nodes].filter((n) => n !== node && types.indexOf(n.type) >= 0);
  }
}
