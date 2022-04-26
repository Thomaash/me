import testSet, { ips } from "../support/testItemsFieldValidity";

testSet({
  name: "Host default route",
  type: "host",
  field: "edit-default-route",
  values: ips,
});
