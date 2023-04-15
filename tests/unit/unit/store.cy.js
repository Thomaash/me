import { expect } from "chai";

import { config } from "@/store/config";

const { mutations } = config;

const initState = JSON.stringify(config.state);
function getMockState(state = {}) {
  return Object.assign(JSON.parse(initState), state);
}

describe("Store", () => {
  it("Set working", () => {
    const state = getMockState();

    mutations.setWorking(state, {
      working: true,
    });

    expect(state.working).to.equal(true);
  });

  it("Set not working", () => {
    const state = getMockState({
      working: true,
    });

    mutations.setWorking(state, {
      working: false,
    });

    expect(state.working).to.equal(false);
  });

  it("Set working 4/7", () => {
    const state = getMockState();

    mutations.setWorking(state, {
      curr: 4,
      max: 7,
    });

    expect(state.working).to.be.an("object").to.own.include({
      curr: 4,
      max: 7,
    });
  });

  it("Set working 3/3", () => {
    const state = getMockState();

    mutations.setWorking(state, {
      curr: 3,
      max: 3,
    });

    expect(state.working).to.be.an("object").to.own.include({
      curr: 3,
      max: 3,
    });
  });

  it("Set working 3/3, then not working", () => {
    const state = getMockState();

    mutations.setWorking(state, {
      curr: 3,
      max: 3,
    });

    expect(state.working).to.be.an("object").to.own.include({
      curr: 3,
      max: 3,
    });

    mutations.setWorking(state, {
      working: false,
    });

    expect(state.working).to.equal(false);
  });

  it("Set alert", () => {
    const state = getMockState();

    mutations.setAlert(state, {
      type: "info",
      text: "Test",
    });

    expect(state.alert).to.be.an("object").to.own.include({
      show: true,
      type: "info",
      text: "Test",
    });
  });

  it("Set and clear alert", () => {
    const state = getMockState();

    mutations.setAlert(state, {
      type: "info",
      text: "Test",
    });

    expect(state.alert).to.be.an("object").to.own.include({
      show: true,
      type: "info",
      text: "Test",
    });

    mutations.clearAlert(state);

    expect(state.alert).to.be.an("object").to.own.include({
      show: false,
    });
  });
});
