export default function ({ name, type, field, values }) {
  describe(name, () => {
    describe("Init", () => {
      it("Open new empty canvas", () => {
        cy.meOpen();
        cy.meImportEmpty();
        cy.meClickMenu("canvas");
      });

      it("Place the item", () => {
        cy.get("[data-cy=vis] canvas").trigger("keydown", {
          ctrlKey: true,
          key: "a",
        });

        cy.meVisFabClick("delete");

        cy.meVisAddItem(type);
      });
    });

    describe("Test the values", () => {
      values.forEach(({ valid, values, expectedValue }) => {
        describe(values.join(", "), () => {
          it("Change properties", () => {
            cy.meSetVuetifyInputs({
              textProps: {
                [field]: values,
              },
            });
          });

          if (expectedValue != null) {
            it(`Expected: ${expectedValue}`, () => {
              cy.get(`[data-cy=${field}]`).should("have.value", expectedValue);
            });
          }

          it(`Is ${valid ? "" : "in"}valid?`, () => {
            cy.get("[data-cy=edit-save]").should(
              valid ? "not.be.disabled" : "be.disabled"
            );
          });
        });
      });
    });

    describe("Close", () => {
      it("Cancel", () => {
        cy.get(`[data-cy=edit-${type}]`).get("[data-cy=edit-cancel]").click();
      });
    });
  });
}

const ips = [
  { valid: false, values: ["172.16.0.7/24"] },
  { valid: false, values: ["172.16.0.7/44"] },
  { valid: false, values: ["172.16.0.7/o"] },
  { valid: false, values: ["172.16.7"] },
  { valid: false, values: ["172.16.f.7"] },
  { valid: false, values: ["172.256.0.7"] },
  { valid: false, values: ["2001:0db8:0000:0000:0000:ff00:0042:8329/13"] },
  { valid: false, values: ["2001:0db8:0000:0000:0000:ffa00:0042:8329"] },
  { valid: false, values: ["2001:0db8:0000:0000:0000:ffx0:0042:8329"] },
  { valid: false, values: ["2001:db8:0:0:0:0:ff00:42:8329"] },
  { valid: false, values: ["2001:db8:0:0:0:ff00:42:8329/"] },
  { valid: false, values: ["2001:db8::ff00:42:8329/-7"] },
  { valid: false, values: ["2001:db8::ff00::42:8329"] },
  { valid: false, values: ["t:e::s:t"] },
  { valid: false, values: ["test"] },
  { valid: true, values: ["172.16.0.7"] },
  { valid: true, values: ["2001:0db8:0000:0000:0000:ff00:0042:8329"] },
  { valid: true, values: ["2001:db8:0:0:0:ff00:42:8329"] },
  { valid: true, values: ["2001:db8::ff00:42:8329"] },
];
export { ips };

const ports = [
  { valid: false, values: ["-1"] },
  { valid: false, values: ["0"] },
  { valid: false, values: ["100000"] },
  { valid: false, values: ["12.6"] },
  { valid: false, values: ["172.16.0.7"] },
  { valid: false, values: ["172.16.0.7/16"] },
  { valid: false, values: ["65536"] },
  { valid: true, values: ["1"] },
  { valid: true, values: ["65535"] },
  { valid: true, values: ["6633"] },
  { valid: true, values: ["6653"] },
];
export { ports };

const integers = (min, max, minLimited = true, maxLimited = true) => [
  { valid: !maxLimited, values: [`${max + 1}`] },
  { valid: !minLimited, values: [`${min - 1}`] },
  { valid: false, values: [`${max + 0.1}`] },
  { valid: false, values: [`${max - 0.1}`] },
  { valid: false, values: [`${min + 0.1}`] },
  { valid: false, values: [`${min - 0.1}`] },
  { valid: true, values: [`${Math.floor(min + 0.1 * (max - min))}`] },
  { valid: true, values: [`${Math.floor(min + 0.5 * (max - min))}`] },
  { valid: true, values: [`${Math.floor(min + 0.9 * (max - min))}`] },
  { valid: true, values: [`${max}`] },
  { valid: true, values: [`${min}`] },
];
export { integers };

const decimals = (min, max, minLimited = true, maxLimited = true) => [
  { valid: !maxLimited, values: [`${max + 0.1}`] },
  { valid: !maxLimited, values: [`${max + 1}`] },
  { valid: !minLimited, values: [`${min - 0.1}`] },
  { valid: !minLimited, values: [`${min - 1}`] },
  { valid: true, values: [`${max - 0.1}`] },
  { valid: true, values: [`${max}`] },
  { valid: true, values: [`${min + 0.1 * (max - min)}`] },
  { valid: true, values: [`${min + 0.1}`] },
  { valid: true, values: [`${min + 0.5 * (max - min)}`] },
  { valid: true, values: [`${min + 0.9 * (max - min)}`] },
  { valid: true, values: [`${min}`] },
];
export { decimals };
