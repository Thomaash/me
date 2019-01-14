describe('Canvas', () => {
  it('Clean the canvas', () => {
    cy.visit('/')
    cy.meImportEmpty()
    cy.meClickMenu('Canvas')
  })

  it('Add a new host', () => {
    cy.get('.v-speed-dial > button')
      .click()
    cy.get('.v-speed-dial__list > button:nth-child(3)')
      .click()

    cy.get('.vis-root')
      .trigger('mousemove', { button: 0, clientX: 50, clientY: 50 })
      .trigger('mousemove', { button: 0, clientX: 150, clientY: 50 })
    cy.get('.mouse-tag')

    cy.get('canvas')
      .meVisClick({ x: 150, y: 150 })
    const header = cy.contains('h3', 'Host')
    cy.get('input')
      .should('have.value', 'h1')

    cy.focused()
      .type('{enter}')
    header
      .should('not.exist')
  })

  it('Test the new host\'s existence', () => {
    cy.get('canvas')
      .meVisClick({ x: 150, y: 150 })
      .meVisClick({ x: 150, y: 150 })
    const header = cy.contains('h3', 'Host')
    cy.get('input')
      .should('have.value', 'h1')

    cy.focused()
      .type('{enter}')
    header
      .should('not.exist')
  })
})
