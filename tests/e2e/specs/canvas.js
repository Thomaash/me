describe('Canvas', () => {
  it('Clean the canvas', () => {
    cy.visit('/')
    cy.meImportEmpty()
    cy.meClickMenu('Canvas')
  })

  ;[
    { type: 'port', hostname: 'eth0', heading: 'Port', itemsToDelete: 1 },
    { type: 'host', hostname: 'h1', heading: 'Host', itemsToDelete: 3 },
    { type: 'switch', hostname: 's1', heading: 'Switch', itemsToDelete: 7 },
    { type: 'controller', hostname: 'c1', heading: 'Controller', itemsToDelete: 1 }
  ].forEach(({ type, hostname, heading, itemsToDelete }) => {
    describe(type, () => {
      it('Enter add mode', () => {
        cy.meVisFabClick(type)

        cy.get('.vis-root')
          .trigger('mousemove', { button: 0, clientX: 50, clientY: 50 })
          .trigger('mousemove', { button: 0, clientX: 150, clientY: 50 })
        cy.get('.mouse-tag')
      })

      it('Place the item', () => {
        cy.get('canvas')
          .meVisClick({ x: 150, y: 150 })
        const header = cy.contains('h3', heading)
        cy.get('input')
          .should('have.value', hostname)

        cy.focused()
          .type('{enter}')
        header
          .should('not.exist')
      })

      it('Test the items\'s existence', () => {
        // Cypress seems to be too fast sometimes
        cy.wait(1500)

        cy.get('canvas')
          .meVisClick({ x: 150, y: 150, repeat: 2 })
        const header = cy.contains('h3', heading)
        cy.get('input')
          .should('have.value', hostname)

        cy.focused()
          .type('{enter}')
        header
          .should('not.exist')
      })

      it(`Delete the ${type}`, () => {
        cy.get('canvas')
          .meVisClick({ x: 150, y: 150 })

        cy.meVisFabClick('delete')

        cy.get('.v-snack__content')
          .contains(`${itemsToDelete} item${itemsToDelete === 1 ? '' : 's'} deleted`)
      })
    })
  })
})
