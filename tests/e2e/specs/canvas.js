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
      })

      it('Place the item', () => {
        cy.get('canvas')
          .meVisClick({ x: 150, y: 150 })
      })

      it('Save the item', () => {
        cy.get(`[data-cy=edit-${type}]`)
          .get('[data-cy=edit-save]')
          .click()
        cy.get(`[data-cy=edit-${type}]`)
          .should('not.exist')
        cy.wait(500) // Animation causing problems, maybe?
      })

      it('Open edit dialog', () => {
        cy.get('canvas')
          .meVisClick({ x: 150, y: 150, repeat: 2 })
        cy.get(`[data-cy=edit-${type}]`)
      })

      it('Test item\'s hostname', () => {
        cy.get('[data-cy=edit-hostname]')
          .should('have.value', hostname)
      })

      it('Close edit dialog', () => {
        cy.get(`[data-cy=edit-${type}]`)
          .get('[data-cy=edit-cancel]')
          .click()
        cy.get(`[data-cy=edit-${type}]`)
          .should('not.exist')
        cy.wait(500) // Animation causing problems, maybe?
      })

      it('Delete the item', () => {
        cy.get('canvas')
          .meVisClick({ x: 150, y: 150 })

        cy.meVisFabClick('delete')

        cy.get('.v-snack__content')
          .contains(`${itemsToDelete} item${itemsToDelete === 1 ? '' : 's'} deleted`)
      })
    })
  })
})
