import { testSet, ips } from "../playwright-support/testItemsFieldValidity.js";

testSet({
  name: "Switch IP",
  type: "switch",
  field: "edit-ip",
  values: ips,
});
