import { testSet, ips } from "../playwright-support/testItemsFieldValidity.js";

testSet({
  name: "Host default route",
  type: "host",
  field: "edit-default-route",
  values: ips,
});
