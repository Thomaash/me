import {
  testSet,
  ports,
} from "../playwright-support/testItemsFieldValidity.js";

testSet({
  name: "Switch DPCTL port",
  type: "switch",
  field: "edit-dpctl-port",
  values: ports,
});
