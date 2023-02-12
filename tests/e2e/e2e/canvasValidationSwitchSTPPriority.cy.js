import testSet from "../support/testItemsFieldValidity";

testSet({
  name: "Switch STP priority",
  type: "switch",
  field: "edit-stp-priority",
  values: [
    { valid: false, values: ["-1"] },
    { valid: false, values: ["100000"] },
    { valid: false, values: ["12.6"] },
    { valid: false, values: ["172.16.0.7"] },
    { valid: false, values: ["172.16.0.7/16"] },
    { valid: false, values: ["65536"] },
    { valid: false, values: [`${8 * 2 ** 12 + 1}`] },
    { valid: false, values: [`${8 * 2 ** 12 - 1}`] },
    { valid: true, values: [`${0 * 2 ** 12}`] },
    { valid: true, values: [`${1 * 2 ** 12}`] },
    { valid: true, values: [`${15 * 2 ** 12}`] },
    { valid: true, values: [`${8 * 2 ** 12}`] },
  ],
});
