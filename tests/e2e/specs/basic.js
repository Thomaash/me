describe('Basic', () => {
  it('Home page', () => {
    cy.visit('/')
    cy.contains('h3', 'Description')
    cy.contains('h3', 'Bindings')
  })

  it('Menu url change', () => {
    cy.meClickMenu()
  })

  it('Canvas page', () => {
    cy.meClickMenu('Canvas')
    cy.get('canvas')
  })

  it('Empty project import', () => {
    cy.meImportEmpty()
  })
})
