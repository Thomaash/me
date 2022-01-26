import testSet, { ports } from "../support/testItemsFieldValidity";

testSet({
  name: "Switch DPCTL port",
  type: "switch",
  field: "edit-dpctl-port",
  values: ports,
});
