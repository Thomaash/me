// https://docs.cypress.io/api/introduction/api.html

describe('Basic', () => {
  it('Home page', () => {
    cy.visit('/')
    cy.contains('h3', 'Description')
    cy.contains('h3', 'Bindings')
  })

  it('Canvas page', () => {
    cy.visit('/#/canvas')
    cy.get('canvas')
  })

  it('Menu url change', () => {
    cy.visit('/')

    ;[
      ['.v-navigation-drawer > .v-list > :nth-child(1) > .v-list__tile > .v-list__tile__content', '#/home'],
      ['.v-navigation-drawer > .v-list > :nth-child(2) > .v-list__tile > .v-list__tile__content', '#/canvas'],
      ['.v-navigation-drawer > .v-list > :nth-child(3) > .v-list__tile > .v-list__tile__content', '#/mininet_settings'],
      ['.v-navigation-drawer > .v-list > :nth-child(4) > .v-list__tile > .v-list__tile__content', '#/export'],
      ['.v-navigation-drawer > .v-list > :nth-child(5) > .v-list__tile > .v-list__tile__content', '#/about']
    ].forEach(([selector, hash]) => {
      cy.get(selector).click()
      cy.hash().should('eq', hash)
    })
  })

  it('Empty project import', () => {
    cy.visit('/#/export')

    cy.get(':nth-child(2) > section > p > :nth-child(1) > .v-btn__content').click()
    cy.get('.v-card__actions > .primary--text > .v-btn__content').click()
    cy.contains('.v-alert > div', 'Successfully imported')
  })
})
