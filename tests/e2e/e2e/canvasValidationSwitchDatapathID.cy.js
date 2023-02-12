import testSet from "../support/testItemsFieldValidity";

testSet({
  name: "Switch datapath ID",
  type: "switch",
  field: "edit-dpid",
  values: [
    { valid: false, values: ["-1"] },
    { valid: false, values: ["12.6"] },
    { valid: false, values: ["172.16.0.7"] },
    { valid: false, values: ["172.16.0.7/16"] },
    { valid: false, values: ["AC-DC"] },
    { valid: false, values: ["a".repeat(17)] },
    { valid: true, values: ["0123456789ABCDEF"] },
    { valid: true, values: ["0123456789abcdef"] },
    { valid: true, values: ["65536"] },
    { valid: true, values: ["a".repeat(16)] },
    { valid: true, values: ["acdc"] },
  ],
});
