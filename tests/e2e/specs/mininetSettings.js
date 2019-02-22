describe('Mininet settings', () => {
  const checkboxPropsFromUnset = {
    setTrue: {
      clicks: 1,
      ariaChecked: 'true'
    },
    setFalse: {
      clicks: 2,
      ariaChecked: 'false'
    },
    unset: {
      clicks: 3,
      ariaChecked: 'mixed'
    }
  }

  it('Clean the project', () => {
    cy.visit('/')
    cy.meImportEmpty()
    cy.meClickMenu('mininet-settings')
  })

  ;[{
    name: 'Basic',
    textProps: {
      'mininet-settings-project-name': [
        'Cypress Test'
      ],
      'mininet-settings-ip-base': [
        '172.16.0.0/16'
      ],
      'mininet-settings-listen-port-base': [
        '1564'
      ],
      'mininet-settings-start-script': [...Array(40)].map((_, i) =>
        `ping 172.16.77.${60 + i}`
      ),
      'mininet-settings-stop-script': [
        'pingall'
      ]
    },
    checkboxProps: {
      'mininet-settings-auto-set-mac': checkboxPropsFromUnset.setTrue,
      'mininet-settings-auto-static-arp': checkboxPropsFromUnset.setFalse,
      'mininet-settings-in-namespace': checkboxPropsFromUnset.unset,
      'mininet-settings-spawn-terminals': checkboxPropsFromUnset.setTrue
    },
    selectProps: {
      'mininet-settings-log-level': 'Critical'
    }
  }].forEach(({
    name,
    textProps = {},
    checkboxProps = {},
    selectProps = {}
  }) => {
    describe(name, () => {
      it('Change item\'s text properties', () => {
        Object.entries(textProps).forEach(([key, values]) => {
          cy.get(`[data-cy=${key}]`)
            .type(values.join('{enter}'))
        })
      })

      it('Change item\'s checkbox properties', () => {
        Object.entries(checkboxProps).forEach(([key, { clicks }]) => {
          for (let i = 0; i < clicks; ++i) {
            cy.get(`[data-cy=${key}] input`)
              .click({ force: true }) // The input is hidden but works
          }
        })
      })

      it('Change item\'s select properties', () => {
        Object.entries(selectProps).forEach(([key, value]) => {
          cy.get(`[data-cy=${key}] input`)
            .click({ force: true }) // The input is hidden but works
          cy.contains(value)
            .click()
        })
      })

      it('Navigate away and back', () => {
        cy.meClickMenu('about')
        cy.meClickMenu('mininet-settings')
      })

      it('Test item\'s text properties', () => {
        Object.entries(textProps).forEach(([key, values]) => {
          cy.get(`[data-cy=${key}]`)
            .should('have.value', values.join('\n'))
        })
      })

      it('Test item\'s checkbox properties', () => {
        Object.entries(checkboxProps).forEach(([key, { ariaChecked }]) => {
          cy.get(`[data-cy=${key}] input`)
            .should('have.attr', 'aria-checked', ariaChecked)
        })
      })

      it('Test item\'s select properties', () => {
        Object.entries(selectProps).forEach(([key, value]) => {
          cy.get(`[data-cy=${key}]`)
            .contains(value)
        })
      })
    })
  })
})
