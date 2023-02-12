import testSet, { decimals } from "../support/testItemsFieldValidity";

testSet({
  name: "Host CPU utilization limit",
  type: "host",
  field: "edit-cpu-limit",
  values: decimals(0, 1),
});
