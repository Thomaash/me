// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

Cypress.Commands.add(
  "meVisClick",
  { prevSubject: "element" },
  (subject, { button = 0, x = 0, y = 0, dbl = false }) => {
    if (dbl) {
      // Force reduces the time between events and therefore the risk of them being interpreted as two independent clicks
      cy.wrap(subject).trigger("pointerdown", {
        button,
        clientX: x,
        clientY: y,
      });
      cy.wrap(subject).trigger("pointerup", {
        button,
        clientX: x,
        clientY: y,
        force: true,
      });
      cy.wrap(subject).trigger("pointerdown", {
        button,
        clientX: x,
        clientY: y,
        force: true,
      });
      cy.wrap(subject).trigger("pointerup", {
        button,
        clientX: x,
        clientY: y,
        force: true,
      });
    } else {
      cy.wrap(subject).trigger("pointerdown", {
        button,
        clientX: x,
        clientY: y,
      });
      cy.wrap(subject).trigger("pointerup", {
        button,
        clientX: x,
        clientY: y,
        force: true,
      });
    }
  },
);

Cypress.Commands.add(
  "meVisAddItem",
  { prevSubject: false },
  (type, position = { x: 150, y: 150 }) => {
    cy.meVisFabClick(type);
    cy.get("[data-cy=vis] canvas").meVisClick(position);
  },
);

Cypress.Commands.add("meVisFabClick", { prevSubject: false }, (button) => {
  cy.get("[data-cy=fab-activator] button").click();
  cy.get(`[data-cy=fab-${button}]`).click();
});

Cypress.Commands.add("meImportEmpty", { prevSubject: false }, () => {
  cy.meClickMenu("export");

  cy.get("[data-cy=import-empty]").click();
  cy.get("[data-cy=import-warning-confirm]").click();
  cy.contains(".v-alert > div", "Successfully imported");
});

Cypress.Commands.add(
  "meSetVuetifyInputs",
  { prevSubject: false },
  ({ textProps = {}, checkboxProps = {}, selectProps = {} }) => {
    Object.entries(textProps).forEach(([key, values]) => {
      cy.get(
        `[data-cy=${key}] input, [data-cy=${key}] textarea:not([aria-hidden])`,
      ).as("vuetify-input");
      cy.get("@vuetify-input").clear();
      cy.get("@vuetify-input").type(values.join("{enter}"));
    });

    Object.entries(checkboxProps).forEach(([key, { clicks }]) => {
      for (let i = 0; i < clicks; ++i) {
        cy.get(`[data-cy=${key}] input`).click();
      }
    });

    Object.entries(selectProps).forEach(([key, value]) => {
      cy.get(`[data-cy=${key}] input[type=text]`).click({ force: true }); // The input is hidden but works
      cy.contains(
        ".v-overlay__content.v-select__content .v-list-item-title",
        value,
      ).click();
    });
  },
);

Cypress.Commands.add(
  "meTestVuetifyInputs",
  { prevSubject: false },
  ({ textProps = {}, checkboxProps = {}, selectProps = {} }) => {
    Object.entries(textProps).forEach(([key, values]) => {
      cy.get(
        `[data-cy=${key}] input, [data-cy=${key}] textarea:not([aria-hidden])`,
      ).should("have.value", values.join("\n"));
    });

    Object.entries(checkboxProps).forEach(([key, { ariaChecked }]) => {
      if (ariaChecked === "mixed") {
        cy.get(`[data-cy=${key}] input`)
          .should("have.length", 1)
          .its("0.attributes")
          .should((attributes) => {
            expect(attributes).to.have.property("aria-checked");
            expect(attributes["aria-checked"].value).to.equal("mixed");
            expect(attributes).to.not.have.property("checked");
          });
      } else if (ariaChecked === "true") {
        cy.get(`[data-cy=${key}] input`)
          .should("have.length", 1)
          .its("0.attributes")
          .should((attributes) => {
            expect(attributes).to.not.have.property("aria-checked");
            expect(attributes).to.have.property("checked");
          });
      } else {
        cy.get(`[data-cy=${key}] input`)
          .should("have.length", 1)
          .its("0.attributes")
          .should((attributes) => {
            expect(attributes).to.not.have.property("aria-checked");
            expect(attributes).to.not.have.property("checked");
          });
      }
    });

    Object.entries(selectProps).forEach(([key, value]) => {
      cy.get(`[data-cy=${key}]`).contains(value);
    });
  },
);

Cypress.Commands.add("meClickMenu", { prevSubject: false }, (name) => {
  const hashMap = {
    home: "#/home",
    canvas: "#/canvas",
    "mininet-settings": "#/mininet_settings",
    export: "#/export",
    about: "#/about",
  };

  if (name) {
    cy.get(
      `[data-cy=drawer-${name}][href=${JSON.stringify(hashMap[name])}]`,
    ).click();
    cy.hash().should("eq", hashMap[name]);
  } else {
    Object.entries(hashMap).forEach(([name, hash]) => {
      cy.get(
        `[data-cy=drawer-${name}][href=${JSON.stringify(hashMap[name])}]`,
      ).click();
      cy.hash().should("eq", hash);
    });
  }
});

Cypress.Commands.add("meOpen", { prevSubject: false }, () => {
  cy.location("hostname").then((hostname) => {
    if (!hostname) {
      cy.visit("/");
      cy.hash().should("eq", "#/home");
    }
    return undefined;
  });
});
