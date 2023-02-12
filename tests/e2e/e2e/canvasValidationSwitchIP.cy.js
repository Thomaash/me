import testSet, { ips } from "../support/testItemsFieldValidity";

testSet({
  name: "Switch IP",
  type: "switch",
  field: "edit-ip",
  values: ips,
});
