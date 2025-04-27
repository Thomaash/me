describe("Basic", { testIsolation: false }, () => {
  it("Home page", () => {
    cy.meOpen();
    cy.hash().should("eq", "#/home");
    cy.contains("h3", "Description");
    cy.contains("h3", "Bindings");
    cy.contains("h3", "Placeholders");
  });

  it("Menu url change", () => {
    cy.meClickMenu();
  });

  it("Canvas page", () => {
    cy.meClickMenu("canvas");
    cy.get("canvas");
  });

  it("Empty project import", () => {
    cy.meImportEmpty();
  });
});
