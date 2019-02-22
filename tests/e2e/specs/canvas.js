describe('Canvas', () => {
  const itemPosition = { x: 150, y: 150 }

  function openEditDialog (expectedType) {
    it('Open edit dialog', () => {
      cy.get('[data-cy=vis] canvas')
        .meVisClick({ ...itemPosition, dbl: true })
      cy.get(`[data-cy=edit-${expectedType}]`)
    })
  }

  it('Clean the canvas', () => {
    cy.visit('/')
    cy.meImportEmpty()
    cy.meClickMenu('Canvas')
  })

  ;[{
    type: 'port',
    hostname: 'eth0',
    itemsToDelete: 1,
    textProps: {
      'edit-ips': [
        '172.16.0.7/16',
        '172.16.0.7/32',
        '2001:0db8:0000:0000:0000:ff00:0042:8329/64',
        '2001:db8:0:0:0:ff00:42:8329/17',
        '2001:db8::ff00:42:8329/1'
      ]
    },
    otherProps: {
      'edit-physical': [
      ]
    }
  }, {
    type: 'host',
    hostname: 'h1',
    itemsToDelete: 5,
    textProps: {
      'edit-default-route': [
        '172.16.0.1'
      ],
      'edit-cpu-limit': [
        '0.23'
      ],
      'edit-cpu-cores-str': [
        '2'
      ],
      'edit-start-script': [
        'ping 172.16.0.1'
      ],
      'edit-stop-script': [
        'pingall'
      ]
    },
    otherProps: {
      'edit-cpu-scheduler': [
      ]
    }
  }, {
    type: 'switch',
    hostname: 's1',
    itemsToDelete: 13,
    textProps: {
      'edit-stp-priority': [
        '12288'
      ],
      'edit-ip': [
        '172.16.15.74'
      ],
      'edit-dpctl-port': [
        '1576'
      ],
      'edit-dpid': [
        'acdc'
      ],
      'edit-dpopts': [
        '--some-arg some-value'
      ],
      'edit-reconnect-ms': [
        '500'
      ],
      'edit-opts': [
        '--some-arg some-value'
      ],
      'edit-start-script': [
        'ping 172.16.0.1'
      ],
      'edit-stop-script': [
        'pingall'
      ]
    },
    otherProps: {
      'edit-switch-type': [
      ],
      'edit-stp': [
      ],
      'edit-protocol': [
      ],
      'edit-datapath': [
      ],
      'edit-fail-mode': [
      ],
      'edit-inband': [
      ],
      'edit-in-namespace': [
      ],
      'edit-batch': [
      ],
      'edit-verbose': [
      ]
    }
  }, {
    type: 'controller',
    hostname: 'c1',
    itemsToDelete: 1,
    textProps: {
      'edit-ip': [
        '172.16.15.4'
      ],
      'edit-port': [
        '65535'
      ]
    },
    otherProps: {
      'edit-controller-type': [
      ],
      'edit-protocol': [
      ]
    }
  }, {
    type: 'dummy',
    hostname: '',
    itemsToDelete: 1
  }].forEach(({ type, hostname, itemsToDelete = 1, textProps = {} }) => {
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

      openEditDialog(type)

      it('Test item\'s hostname', () => {
        cy.get('[data-cy=edit-hostname]')
          .should('have.value', hostname)
      })

      it('Change item\'s text properties', () => {
        cy.get('[data-cy=edit-hostname]')
          .clear()
          .type('changed')

        Object.entries(textProps).forEach(([key, values]) => {
          cy.get(`[data-cy=${key}]`)
            .type(values.join('{enter}'))
        })
      })

      it('Save edit dialog', () => {
        cy.get(`[data-cy=edit-${type}]`)
          .get('[data-cy=edit-save]')
          .click()
        cy.get(`[data-cy=edit-${type}]`)
          .should('not.exist')
        cy.wait(500) // Animation causing problems, maybe?
      })

      openEditDialog(type)

      it('Test item\'s text properties', () => {
        cy.get('[data-cy=edit-hostname]')
          .should('have.value', 'changed')

        Object.entries(textProps).forEach(([key, values]) => {
          cy.get(`[data-cy=${key}]`)
            .should('have.value', values.join('\n'))
        })
      })

      it('Cancel edit dialog', () => {
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
