import { expect } from "chai";

import Builder from "../../../src/builder";
import { removeNonCode } from "./exportImportCommon.js";

import data from "../../../src/examples/medium_2_controllers";

describe("Builder", () => {
  let script;

  beforeEach(() => {
    const builder = new Builder(JSON.parse(JSON.stringify(data)));
    script = builder.build();
  });

  it("script", () => {
    cy.fixture("me-script.py").then((correctScript) => {
      expect(script, "builder didn't return a string").to.be.a("string");
      expect(
        removeNonCode(script),
        "builder didn't build expected script",
      ).to.equal(removeNonCode(correctScript));
    });
  });
});
