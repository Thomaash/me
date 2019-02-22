describe('Canvas', () => {
  const itemPosition = { x: 150, y: 150 }

  it('Clean the canvas', () => {
    cy.visit('/')
    cy.meImportEmpty()
    cy.meClickMenu('Canvas')
  })

  ;[
    { type: 'port', hostname: 'eth0', itemsToDelete: 1 },
    { type: 'host', hostname: 'h1', itemsToDelete: 5 },
    { type: 'switch', hostname: 's1', itemsToDelete: 13 },
    { type: 'controller', hostname: 'c1', itemsToDelete: 1 },
    { type: 'dummy', hostname: '', itemsToDelete: 1 }
  ].forEach(({ type, hostname, itemsToDelete }) => {
    describe(type, () => {
      it('Enter add mode', () => {
        cy.meVisFabClick(type)

        cy.get('.vis-root')
          .trigger('mousemove', { button: 0, clientX: 50, clientY: 50 })
          .trigger('mousemove', { button: 0, clientX: 250, clientY: 100 })
      })

      it('Place the item', () => {
        cy.get('[data-cy=vis] canvas')
          .meVisClick(itemPosition)
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
        cy.get('[data-cy=vis] canvas')
          .meVisClick({ ...itemPosition, dbl: true })
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

      it('Delete the items', () => {
        cy.get('[data-cy=vis] canvas')
          .trigger('keydown', { ctrlKey: true, key: 'a' })

        cy.meVisFabClick('delete')

        cy.get('[data-cy=vis-snackbar]')
          .should('have.attr', 'data-cy-type', 'items-deleted')
          .should('have.attr', 'data-cy-values', `[${itemsToDelete}]`)
      })
    })
  })
})
