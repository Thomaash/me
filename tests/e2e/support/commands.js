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
  'meVisClick',
  { prevSubject: 'element' },
  (subject, { button = 0, x = 0, y = 0, repeat = 1 }) => {
    for (let i = 0; i < repeat; ++i) {
      cy.wrap(subject)
        .trigger('pointerdown', { button, clientX: x, clientY: y })
        .trigger('pointerup', { button, clientX: x, clientY: y })
    }
  }
)

;(() => {
  const buttons = {
    'edge': 1,
    'port': 2,
    'host': 3,
    'switch': 4,
    'controller': 5,
    'label': 6,
    'delete': 7
  }
  Cypress.Commands.add(
    'meVisFabClick',
    { prevSubject: false },
    (button) => {
      cy.get('.v-speed-dial > button')
        .click()
      cy.get(`.v-speed-dial__list > button:nth-child(${buttons[button]})`)
        .click()
    }
  )
})()

Cypress.Commands.add(
  'meImportEmpty',
  { prevSubject: false },
  () => {
    cy.meClickMenu('Export')

    cy.get('[data-cy=import-empty]').click()
    cy.get('.v-card__actions > .primary--text > .v-btn__content').click()
    cy.contains('.v-alert > div', 'Successfully imported')
  }
)

Cypress.Commands.add(
  'meClickMenu',
  { prevSubject: false },
  (name) => {
    const urlMap = {
      'Home': {
        selector: '.v-navigation-drawer > .v-list > :nth-child(1) > .v-list__tile > .v-list__tile__content',
        hash: '#/home'
      },
      'Canvas': {
        selector: '.v-navigation-drawer > .v-list > :nth-child(2) > .v-list__tile > .v-list__tile__content',
        hash: '#/canvas'
      },
      'MininetSettings': {
        selector: '.v-navigation-drawer > .v-list > :nth-child(3) > .v-list__tile > .v-list__tile__content',
        hash: '#/mininet_settings'
      },
      'Export': {
        selector: '.v-navigation-drawer > .v-list > :nth-child(4) > .v-list__tile > .v-list__tile__content',
        hash: '#/export'
      },
      'About': {
        selector: '.v-navigation-drawer > .v-list > :nth-child(5) > .v-list__tile > .v-list__tile__content',
        hash: '#/about'
      }
    }

    if (name) {
      const { selector, hash } = urlMap[name]
      cy.get(selector).click()
      cy.hash().should('eq', hash)
    } else {
      Object.values(urlMap).forEach(({ selector, hash }) => {
        cy.get(selector).click()
        cy.hash().should('eq', hash)
      })
    }
  }
)
