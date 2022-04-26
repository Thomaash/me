describe("Canvas", () => {
  const itemPosition = { x: 150, y: 150 };
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

  function openEditDialog(expectedType) {
    it("Open edit dialog", () => {
      cy.get("[data-cy=vis] canvas").meVisClick({ ...itemPosition, dbl: true });
      cy.get(`[data-cy=edit-${expectedType}]`);
    });
  }

  it("Clean the canvas", () => {
    cy.meOpen();
    cy.meImportEmpty();
    cy.meClickMenu("canvas");
  });
  [
    {
      type: "port",
      hostname: "eth0",
      itemsToDelete: 1,
      textProps: {
        "edit-hostname": ["test"],
        "edit-ips": [
          "172.16.0.7/16",
          "172.16.0.7/32",
          "2001:0db8:0000:0000:0000:ff00:0042:8329/64",
          "2001:db8:0:0:0:ff00:42:8329/17",
          "2001:db8::ff00:42:8329/1",
        ],
      },
      checkboxProps: {
        "edit-physical": checkboxPropsFromUnset.setTrue, // Can't be unset (it's a switch)
      },
    },
    {
      type: "host",
      hostname: "h1",
      itemsToDelete: 5,
      textProps: {
        "edit-hostname": ["test"],
        "edit-default-route": ["172.16.0.1"],
        "edit-cpu-limit": ["0.23"],
        "edit-cpu-cores-str": ["2"],
        "edit-start-script": ["ping 172.16.0.1", "ping 172.16.0.2"],
        "edit-stop-script": ["pingall"],
      },
      selectProps: {
        "edit-cpu-scheduler": "CFS",
      },
    },
    {
      type: "switch",
      hostname: "s1",
      itemsToDelete: 13,
      textProps: {
        "edit-hostname": ["test"],
        "edit-stp-priority": ["12288"],
        "edit-ip": ["172.16.15.74"],
        "edit-dpctl-port": ["1576"],
        "edit-dpid": ["acdc"],
        "edit-dpopts": ["--some-arg some-value"],
        "edit-reconnect-ms": ["500"],
        "edit-opts": ["--some-arg some-value"],
        "edit-start-script": ["ping 172.16.0.1"],
        "edit-stop-script": ["pingall", "# good bye"],
      },
      checkboxProps: {
        "edit-stp": checkboxPropsFromUnset.setTrue,
        "edit-inband": checkboxPropsFromUnset.unset,
        "edit-in-namespace": checkboxPropsFromUnset.setFalse,
        "edit-batch": checkboxPropsFromUnset.setTrue,
        "edit-verbose": checkboxPropsFromUnset.unset,
      },
      selectProps: {
        "edit-switch-type": "OVS Switch",
        "edit-protocol": "OpenFlow 1.3",
        "edit-datapath": "User",
        "edit-fail-mode": "Secure",
      },
    },
    {
      type: "controller",
      hostname: "c1",
      itemsToDelete: 1,
      textProps: {
        "edit-hostname": ["test"],
        "edit-ip": ["172.16.15.4"],
        "edit-port": ["65535"],
      },
      selectProps: {
        "edit-controller-type": "Remote Controller",
        "edit-protocol": "SSL",
      },
    },
    {
      type: "dummy",
      hostname: "",
      itemsToDelete: 1,
      textProps: {
        "edit-hostname": [
          "Moving along…",
          "",
          "That's a popular name today. Little “e”, big “B”?",
          "Bender, this is Fry's decision… and he made it wrong.",
          "So it's time for us to interfere in his life.",
          "You're going back for the Countess, aren't you?",
          "",
          "We're rescuing ya.",
          "Yeah, and if you were the pope they'd be all, “Straighten your pope hat. ” And “Put on your good vestments. ”",
          "Who am I making this out to?",
          "Belligerent and numerous.",
          "I don't want to be rescued.",
        ],
      },
    },
  ].forEach(
    ({
      type,
      hostname,
      itemsToDelete = 1,
      textProps = {},
      checkboxProps = {},
      selectProps = {},
    }) => {
      describe(type, () => {
        it("Enter add mode", () => {
          cy.meVisFabClick(type);

          cy.get(".vis-root")
            .trigger("mousemove", { button: 0, clientX: 50, clientY: 50 })
            .trigger("mousemove", { button: 0, clientX: 250, clientY: 100 });
        });

        it("Place the item", () => {
          cy.get("[data-cy=vis] canvas").meVisClick(itemPosition);
        });

        it("Save the item", () => {
          cy.get(`[data-cy=edit-${type}]`).get("[data-cy=edit-save]").click();
          cy.get(`[data-cy=edit-${type}]`).should("not.exist");
        });

        openEditDialog(type);

        it("Test item's hostname", () => {
          cy.get("[data-cy=edit-hostname]").should("have.value", hostname);
        });

        it("Change items' properties", () => {
          cy.meSetVuetifyInputs({ textProps, checkboxProps, selectProps });
        });

        it("Save edit dialog", () => {
          cy.get(`[data-cy=edit-${type}]`).get("[data-cy=edit-save]").click();
          cy.get(`[data-cy=edit-${type}]`).should("not.exist");
        });

        openEditDialog(type);

        it("Test items' properties", () => {
          cy.meTestVuetifyInputs({ textProps, checkboxProps, selectProps });
        });

        it("Cancel edit dialog", () => {
          cy.get(`[data-cy=edit-${type}]`).get("[data-cy=edit-cancel]").click();
          cy.get(`[data-cy=edit-${type}]`).should("not.exist");
        });

        it("Delete the items", () => {
          cy.get("[data-cy=vis] canvas").trigger("keydown", {
            ctrlKey: true,
            key: "a",
          });

          cy.meVisFabClick("delete");

          cy.get("[data-cy=vis-snackbar]")
            .should("have.attr", "data-cy-type", "items-deleted")
            .should("have.attr", "data-cy-values", `[${itemsToDelete}]`);
        });
      });
    }
  );
});
