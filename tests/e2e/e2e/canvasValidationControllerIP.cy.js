import testSet, { ips } from "../support/testItemsFieldValidity";

testSet({
  name: "Controller IP",
  type: "controller",
  field: "edit-ip",
  values: ips,
});
