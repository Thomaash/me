import {
  testSet,
  integers,
} from "../playwright-support/testItemsFieldValidity.js";

testSet({
  name: "Switch reconnect timeout",
  type: "switch",
  field: "edit-reconnect-ms",
  values: integers(0, 50000, true, false),
});
