import testSet, { ports } from "../support/testItemsFieldValidity";

testSet({
  name: "Controller port",
  type: "controller",
  field: "edit-port",
  values: ports,
});
