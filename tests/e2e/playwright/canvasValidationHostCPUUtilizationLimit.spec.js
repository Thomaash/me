import {
  testSet,
  decimals,
} from "../playwright-support/testItemsFieldValidity.js";

testSet({
  name: "Host CPU utilization limit",
  type: "host",
  field: "edit-cpu-limit",
  values: decimals(0, 1),
});
