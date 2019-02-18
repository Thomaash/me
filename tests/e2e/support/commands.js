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
    'dummy': 6,
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
    const hashMap = {
      'Home': '#/home',
      'Canvas': '#/canvas',
      'MininetSettings': '#/mininet_settings',
      'Export': '#/export',
      'About': '#/about'
    }

    if (name) {
      cy.get(`[data-cy=drawer-${name}]`).click()
      cy.hash().should('eq', hashMap[name])
    } else {
      Object.entries(hashMap).forEach(([name, hash]) => {
        cy.get(`[data-cy=drawer-${name}]`).click()
        cy.hash().should('eq', hash)
      })
    }
  }
)
