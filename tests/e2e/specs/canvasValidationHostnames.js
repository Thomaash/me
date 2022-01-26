import testSet from "../support/testItemsFieldValidity";

const values = [
  { valid: false, values: ["-1"] },
  { valid: false, values: ["0"] },
  { valid: false, values: ["100000"] },
  { valid: false, values: ["12.6"] },
  { valid: false, values: ["172.16.0.7"] },
  { valid: false, values: ["172.16.0.7/16"] },
  { valid: false, values: ["2001:db8::ff00:42:8329/48"] },
  { valid: false, values: ["4h"] },
  { valid: false, values: ["65536"] },
  { valid: false, values: ["h-7"] },
  { valid: false, values: ["test7b9_90"] },
  { valid: true, values: ["c0"] },
  { valid: true, values: ["eth3"] },
  { valid: true, values: ["h1"] },
  { valid: true, values: ["s2"] },
  { valid: true, values: ["test"] },
  { valid: true, values: ["test7b90"] },
];

[
  {
    name: "Controller hostname",
    type: "controller",
    field: "edit-hostname",
    values,
  },
  {
    name: "Switch hostname",
    type: "switch",
    field: "edit-hostname",
    values,
  },
  {
    name: "Host hostname",
    type: "host",
    field: "edit-hostname",
    values,
  },
  {
    name: "Port hostname",
    type: "port",
    field: "edit-hostname",
    values,
  },
].forEach((set) => testSet(set));
