describe("Mininet settings", () => {
  const checkboxPropsFromUnset = {
    setTrue: {
      clicks: 1,
      ariaChecked: "true",
    },
    setFalse: {
      clicks: 2,
      ariaChecked: "false",
    },
    unset: {
      clicks: 3,
      ariaChecked: "mixed",
    },
  };

  it("Clean the project", () => {
    cy.meOpen();
    cy.meImportEmpty();
    cy.meClickMenu("mininet-settings");
  });
  [
    {
      name: "Basic",
      textProps: {
        "mininet-settings-project-name": ["Cypress Test"],
        "mininet-settings-ip-base": ["172.16.0.0/16"],
        "mininet-settings-listen-port-base": ["1564"],
        "mininet-settings-start-script": [...Array(8)].map(
          (_, i) => `ping 172.16.77.${60 + i}`
        ),
        "mininet-settings-stop-script": ["pingall"],
      },
      checkboxProps: {
        "mininet-settings-auto-set-mac": checkboxPropsFromUnset.setTrue,
        "mininet-settings-auto-static-arp": checkboxPropsFromUnset.setFalse,
        "mininet-settings-in-namespace": checkboxPropsFromUnset.unset,
        "mininet-settings-spawn-terminals": checkboxPropsFromUnset.setTrue,
      },
      selectProps: {
        "mininet-settings-log-level": "Critical",
      },
    },
  ].forEach(
    ({ name, textProps = {}, checkboxProps = {}, selectProps = {} }) => {
      describe(name, () => {
        it("Change the properties", () => {
          cy.meSetVuetifyInputs({ textProps, checkboxProps, selectProps });
        });

        it("Navigate away and back", () => {
          cy.meClickMenu("about");
          cy.meClickMenu("mininet-settings");
        });

        it("Test the properties", () => {
          cy.meTestVuetifyInputs({ textProps, checkboxProps, selectProps });
        });
      });
    }
  );
});
