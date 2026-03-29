import { testSet, ips } from "../playwright-support/testItemsFieldValidity.js";

testSet({
  name: "Controller IP",
  type: "controller",
  field: "edit-ip",
  values: ips,
});
