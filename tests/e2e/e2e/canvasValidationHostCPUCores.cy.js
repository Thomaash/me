import testSet from "../support/testItemsFieldValidity";

testSet({
  name: "Host CPU cores",
  type: "host",
  field: "edit-cpu-cores-str",
  values: [
    { valid: false, values: ["-1"] },
    { valid: false, values: ["0,d,7"] },
    { valid: false, values: ["12.6"] },
    { valid: false, values: ["172.16.0.7"] },
    { valid: false, values: ["172.16.0.7/16"] },
    { valid: false, values: ["ac,dc"] },
    { valid: false, values: ["ac-dc"] },
    { valid: true, values: ["1"] },
    { valid: true, values: ["32"] },
    { valid: true, values: ["6, 4, 5, 3"] },
    { valid: true, values: ["6,4,5,3"] },
    { valid: true, values: ["65536"] },
    { valid: true, values: ["66,33"] },
  ],
});
