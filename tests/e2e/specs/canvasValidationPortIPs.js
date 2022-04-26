import testSet from "../support/testItemsFieldValidity";

testSet({
  name: "Port IPs",
  type: "port",
  field: "edit-ips",
  values: [
    { valid: true, values: ["172.16.0.7/16"] },
    { valid: true, values: ["172.16.0.7/32"] },
    { valid: true, values: ["2001:0db8:0000:0000:0000:ff00:0042:8329/64"] },
    { valid: true, values: ["2001:db8:0:0:0:ff00:42:8329/17"] },
    { valid: true, values: ["2001:db8::ff00:42:8329/1"] },

    { valid: false, values: ["172.16.0.7"] },
    { valid: false, values: ["172.16.0.7/"] },
    { valid: false, values: ["172.16.0.7/-4"] },
    { valid: false, values: ["172.16.0.7/33"] },
    { valid: false, values: ["172.16.0.7/a"] },
    { valid: false, values: ["172.16.7"] },
    { valid: false, values: ["172.16.f.7"] },
    { valid: false, values: ["172.256.0.7"] },
    { valid: false, values: ["2001:0db8:0000:0000:0000:ff00:0042:8329"] },
    { valid: false, values: ["2001:0db8:0000:0000:0000:ff00:0042:8329/"] },
    { valid: false, values: ["2001:0db8:0000:0000:0000:ff00:0042:8329/-1"] },
    { valid: false, values: ["2001:0db8:0000:0000:0000:ff00:0042:8329/129"] },
    { valid: false, values: ["2001:0db8:0000:0000:0000:ff00:0042:8329/z"] },
    { valid: false, values: ["2001:0db8:0000:0000:0000:ffa00:0042:8329/64"] },
    { valid: false, values: ["2001:0db8:0000:0000:0000:ffx0:0042:8329/64"] },
    { valid: false, values: ["2001:db8:0:0:0:0:ff00:42:8329/17"] },
    { valid: false, values: ["2001:db8::ff00::42:8329/1"] },
    { valid: false, values: ["t:e::s:t/12"] },
    { valid: false, values: ["test"] },
    { valid: false, values: ["test/12"] },

    {
      valid: false,
      values: [
        "172.16.0.7/16",
        "172.16.0.7/32",
        "2001:0db8:0000:0000:0000:ff00:0042:8329/64",
        "2001:0db8:0000:0000:0000:ff00:0042:8329/129",
        "2001:db8:0:0:0:ff00:42:8329/17",
        "2001:db8::ff00:42:8329/1",
      ],
    },
    {
      valid: true,
      values: [
        "172.16.0.7/16",
        "172.16.0.7/32",
        "2001:0db8:0000:0000:0000:ff00:0042:8329/64",
        "2001:db8:0:0:0:ff00:42:8329/17",
        "2001:db8::ff00:42:8329/1",
      ],
    },
  ],
});
