import {
  testSet,
  ports,
} from "../playwright-support/testItemsFieldValidity.js";

testSet({
  name: "Controller port",
  type: "controller",
  field: "edit-port",
  values: ports,
});
