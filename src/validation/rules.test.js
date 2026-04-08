import { describe, it, expect } from "vitest";
import {
  between,
  decimal,
  divisible,
  hexData,
  hostname,
  integer,
  ip,
  ipWithMask,
  ipsWithMasks,
  maxLength,
  maxValue,
  minLength,
  minValue,
  naturalNumberList,
  port,
  required,
  timeWithUnit,
} from "@/validation/rules.js";

// All validators except `required` return true for null and empty string (optional field pattern).
// Valid inputs return true. Invalid inputs return a descriptive error string.

function expectOptionalFieldPattern(validate) {
  it.each([
    ["null", null],
    ["empty string", ""],
  ])("returns true for %s (optional field)", (_label, value) => {
    expect(validate(value)).toBe(true);
  });
}

describe.concurrent("between", () => {
  const validate = between(1, 10);

  expectOptionalFieldPattern(validate);

  it.each([
    ["min boundary", 1],
    ["max boundary", 10],
    ["mid range", 5],
  ])("returns true for valid value: %s", (_label, value) => {
    expect(validate(value)).toBe(true);
  });

  it.each([
    ["below min", 0],
    ["above max", 11],
    ["negative", -5],
  ])("returns error string for invalid value: %s", (_label, value) => {
    expect(validate(value)).toBe("Has to be between 1 and 10 inclusive.");
  });

  it("returns error string for string that coerces to number in range", ({
    expect,
  }) => {
    expect(validate("5")).toBe("Has to be between 1 and 10 inclusive.");
  });
});

describe("decimal", () => {
  const validate = decimal();

  expectOptionalFieldPattern(validate);

  it.each([
    ["integer number", 42],
    ["fractional number", 3.14],
    ["zero", 0],
    ["negative decimal", -2.5],
  ])("returns true for valid value: %s", (_label, value) => {
    expect(validate(value)).toBe(true);
  });

  it.each([
    ["string value", "abc"],
    ["Infinity", Infinity],
    ["NaN", NaN],
    ["negative Infinity", -Infinity],
  ])("returns error string for invalid value: %s", (_label, value) => {
    expect(validate(value)).toBe("Has to be a decimal number.");
  });
});

describe("divisible", () => {
  const validate = divisible(3);

  expectOptionalFieldPattern(validate);

  it.each([
    ["exact multiple", 9],
    ["zero", 0],
    ["negative multiple", -6],
  ])("returns true for valid value: %s", (_label, value) => {
    expect(validate(value)).toBe(true);
  });

  it.each([
    ["not a multiple", 7],
    ["fractional result", 1],
    ["string that coerces to valid multiple", "9"],
  ])("returns error string for invalid value: %s", (_label, value) => {
    expect(validate(value)).toBe("Has to be divisible by 3.");
  });
});

describe("hexData", () => {
  const validate = hexData();

  expectOptionalFieldPattern(validate);

  it.each([
    ["lowercase hex", "0a1b2c"],
    ["uppercase hex", "DEADBEEF"],
    ["mixed case hex", "aBcDeF09"],
    ["digits only", "1234567890"],
  ])("returns true for valid value: %s", (_label, value) => {
    expect(validate(value)).toBe(true);
  });

  it.each([
    ["contains g", "GHIJ"],
    ["contains space", "AB CD"],
    ["non-string number", 255],
  ])("returns error string for invalid value: %s", (_label, value) => {
    expect(validate(value)).toBe("Has to be in hexadecimal.");
  });
});

describe("hostname", () => {
  const validate = hostname();

  expectOptionalFieldPattern(validate);

  it.each([
    ["lowercase letters", "myhost"],
    ["with digits", "server01"],
    ["uppercase", "HOST01"],
  ])("returns true for valid value: %s", (_label, value) => {
    expect(validate(value)).toBe(true);
  });

  it.each([
    ["starts with digit", "1server"],
    ["contains hyphen", "my-host"],
    ["contains dot", "my.host"],
    ["single letter", "a"],
    ["non-string number", 123],
  ])("returns error string for invalid value: %s", (_label, value) => {
    expect(validate(value)).toBe(
      "Has to start with a letter and contain only letters and numbers.",
    );
  });

  it("returns error string for boolean that coerces to valid hostname string", ({
    expect,
  }) => {
    expect(validate(true)).toBe(
      "Has to start with a letter and contain only letters and numbers.",
    );
  });
});

describe("integer", () => {
  const validate = integer();

  expectOptionalFieldPattern(validate);

  it.each([
    ["positive integer", 42],
    ["zero", 0],
    ["negative integer", -7],
  ])("returns true for valid value: %s", (_label, value) => {
    expect(validate(value)).toBe(true);
  });

  it.each([
    ["fractional number", 3.14],
    ["string number", "42"],
    ["NaN", NaN],
  ])("returns error string for invalid value: %s", (_label, value) => {
    expect(validate(value)).toBe("Has to be an integer.");
  });
});

describe("ip", () => {
  const validate = ip();

  expectOptionalFieldPattern(validate);

  it.each([
    ["IPv4 standard", "192.168.1.1"],
    ["IPv4 all zeros", "0.0.0.0"],
    ["IPv4 max", "255.255.255.255"],
    ["IPv6 full", "2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
    ["IPv6 shortened", "2001:db8:85a3::8a2e:370:7334"],
  ])("returns true for valid value: %s", (_label, value) => {
    expect(validate(value)).toBe(true);
  });

  it.each([
    ["IPv4 octet > 255", "256.0.0.1"],
    ["IPv4 too few octets", "192.168.1"],
    ["random string", "not-an-ip"],
    ["non-string number", 12345],
    [
      "IPv6 invalid chars in 8 valid-length groups",
      "zzzz:zzzz:zzzz:zzzz:zzzz:zzzz:zzzz:zzzz",
    ],
    [
      "IPv6 leading invalid char with valid structure",
      "!aaa:0000:0000:0000:0000:0000:0000:0000",
    ],
  ])("returns error string for invalid value: %s", (_label, value) => {
    expect(validate(value)).toBe("Has to be valid IP 4/6 address.");
  });

  it("returns error string for String object with valid IP content", ({
    expect,
  }) => {
    // eslint-disable-next-line no-new-wrappers
    expect(validate(new String("192.168.1.1"))).toBe(
      "Has to be valid IP 4/6 address.",
    );
  });
});

describe("ipWithMask", () => {
  const validate = ipWithMask();

  expectOptionalFieldPattern(validate);

  it.each([
    ["IPv4 CIDR /24", "192.168.1.0/24"],
    ["IPv4 CIDR /0", "0.0.0.0/0"],
    ["IPv4 CIDR /32", "255.255.255.255/32"],
    ["IPv6 CIDR /64", "2001:0db8:85a3:0000:0000:8a2e:0370:7334/64"],
    ["IPv6 CIDR /128", "2001:0db8:85a3:0000:0000:8a2e:0370:7334/128"],
    ["IPv6 CIDR /0", "2001:0db8:85a3:0000:0000:8a2e:0370:7334/0"],
  ])("returns true for valid value: %s", (_label, value) => {
    expect(validate(value)).toBe(true);
  });

  it.each([
    ["IPv4 mask > 32", "192.168.1.0/33"],
    ["IPv4 mask well above 32", "10.0.0.0/99"],
    ["IPv6 mask > 128", "2001:0db8:85a3:0000:0000:8a2e:0370:7334/129"],
    ["IPv6 mask non-numeric", "2001:0db8:85a3:0000:0000:8a2e:0370:7334/abc"],
    ["no mask", "192.168.1.0"],
    ["double slash", "192.168.1.0/24/8"],
    ["non-string number", 12345],
  ])("returns error string for invalid value: %s", (_label, value) => {
    expect(validate(value)).toBe(
      "Has to contain a valid IP 4/6 address with a mask (CIDR notation).",
    );
  });

  it("returns error string for String object with valid CIDR content", ({
    expect,
  }) => {
    // eslint-disable-next-line no-new-wrappers
    expect(validate(new String("192.168.1.0/24"))).toBe(
      "Has to contain a valid IP 4/6 address with a mask (CIDR notation).",
    );
  });
});

describe("ipsWithMasks", () => {
  const validate = ipsWithMasks();

  expectOptionalFieldPattern(validate);

  it("returns true for array of valid CIDR addresses", ({ expect }) => {
    expect(validate(["192.168.1.0/24", "10.0.0.0/8"])).toBe(true);
  });

  it("returns true for single-element array", ({ expect }) => {
    expect(validate(["2001:0db8:85a3:0000:0000:8a2e:0370:7334/64"])).toBe(true);
  });

  it.each([
    ["array with invalid entry", ["192.168.1.0/24", "not-valid"]],
    ["non-array string", "192.168.1.0/24"],
    ["non-array number", 12345],
    ["non-array boolean", true],
  ])("returns error string for invalid value: %s", (_label, value) => {
    expect(validate(value)).toBe(
      "Has to contain only valid IP 4/6 addresses with masks (CIDR notation), one per line.",
    );
  });
});

describe("maxLength", () => {
  const validate = maxLength(5);

  expectOptionalFieldPattern(validate);

  it.each([
    ["at max", "abcde"],
    ["below max", "abc"],
    ["single char", "a"],
  ])("returns true for valid value: %s", (_label, value) => {
    expect(validate(value)).toBe(true);
  });

  it.each([
    ["one over max", "abcdef"],
    ["well over max", "abcdefghij"],
  ])("returns error string for invalid value: %s", (_label, value) => {
    expect(validate(value)).toBe("Has to have at most 5 character(s).");
  });

  it("returns error string for non-string input", ({ expect }) => {
    expect(validate(12345)).toBe("Has to have at most 5 character(s).");
  });

  it("returns error string for array with length within max", ({ expect }) => {
    expect(validate([1, 2, 3])).toBe("Has to have at most 5 character(s).");
  });
});

describe("maxValue", () => {
  const validate = maxValue(100);

  expectOptionalFieldPattern(validate);

  it.each([
    ["at max", 100],
    ["below max", 50],
    ["zero", 0],
    ["negative", -10],
  ])("returns true for valid value: %s", (_label, value) => {
    expect(validate(value)).toBe(true);
  });

  it.each([
    ["one over max", 101],
    ["well over max", 999],
  ])("returns error string for invalid value: %s", (_label, value) => {
    expect(validate(value)).toBe("Has to be at most 100.");
  });

  it("returns error string for string that coerces to number within max", ({
    expect,
  }) => {
    expect(validate("50")).toBe("Has to be at most 100.");
  });
});

describe("minLength", () => {
  const validate = minLength(3);

  expectOptionalFieldPattern(validate);

  it.each([
    ["at min", "abc"],
    ["above min", "abcde"],
  ])("returns true for valid value: %s", (_label, value) => {
    expect(validate(value)).toBe(true);
  });

  it.each([
    ["one below min", "ab"],
    ["single char", "a"],
  ])("returns error string for invalid value: %s", (_label, value) => {
    expect(validate(value)).toBe("Has to have at least 3 character(s).");
  });

  it("returns error string for non-string input", ({ expect }) => {
    expect(validate(123)).toBe("Has to have at least 3 character(s).");
  });

  it("returns error string for array with length meeting min", ({ expect }) => {
    expect(validate([1, 2, 3])).toBe("Has to have at least 3 character(s).");
  });
});

describe("minValue", () => {
  const validate = minValue(10);

  expectOptionalFieldPattern(validate);

  it.each([
    ["at min", 10],
    ["above min", 50],
  ])("returns true for valid value: %s", (_label, value) => {
    expect(validate(value)).toBe(true);
  });

  it.each([
    ["one below min", 9],
    ["zero", 0],
    ["negative", -5],
  ])("returns error string for invalid value: %s", (_label, value) => {
    expect(validate(value)).toBe("Has to be at least 10.");
  });

  it("returns error string for string that coerces to number above min", ({
    expect,
  }) => {
    expect(validate("50")).toBe("Has to be at least 10.");
  });
});

describe("naturalNumberList", () => {
  const validate = naturalNumberList();

  expectOptionalFieldPattern(validate);

  it.each([
    ["single number", ["42"]],
    ["multiple numbers", ["1", "2", "3"]],
    ["zero included", ["0", "100"]],
  ])("returns true for valid value: %s", (_label, value) => {
    expect(validate(value)).toBe(true);
  });

  it.each([
    ["contains negative", ["1", "-2"]],
    ["contains letters", ["abc"]],
    ["contains decimal", ["1.5"]],
    ["non-array string", "123"],
    ["non-array number", 42],
  ])("returns error string for invalid value: %s", (_label, value) => {
    expect(validate(value)).toBe("Has to be a list of natural numbers.");
  });
});

describe("port", () => {
  const validate = port();

  expectOptionalFieldPattern(validate);

  it.each([
    ["min port", 1],
    ["max port", 65535],
    ["common port 80", 80],
    ["common port 443", 443],
  ])("returns true for valid value: %s", (_label, value) => {
    expect(validate(value)).toBe(true);
  });

  it.each([
    ["zero", 0],
    ["above max", 65536],
    ["negative", -1],
    ["fractional", 80.5],
    ["string", "80"],
  ])("returns error string for invalid value: %s", (_label, value) => {
    expect(validate(value)).toBe("Has to be valid port (1-65535).");
  });
});

describe("required", () => {
  const validate = required();

  it.each([
    ["non-empty string", "hello"],
    ["number", 42],
    ["zero (truthy check)", 0],
    ["false (truthy check)", false],
  ])("returns true for valid value: %s", (_label, value) => {
    expect(validate(value)).toBe(true);
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["empty string", ""],
  ])("returns error string for invalid value: %s", (_label, value) => {
    expect(validate(value)).toBe("Can'n be left empty.");
  });
});

describe("timeWithUnit", () => {
  const validate = timeWithUnit();

  expectOptionalFieldPattern(validate);

  it.each([
    ["milliseconds", "10ms"],
    ["microseconds", "443us"],
    ["seconds", "5s"],
    ["zero seconds", "0s"],
  ])("returns true for valid value: %s", (_label, value) => {
    expect(validate(value)).toBe(true);
  });

  it.each([
    ["no unit", "100"],
    ["invalid unit", "10xs"],
    ["space before unit", "10 ms"],
    ["letters only", "abc"],
    ["non-string number", 100],
    ["prefix before valid time", "abc10ms"],
    ["suffix after valid time", "10msabc"],
  ])("returns error string for invalid value: %s", (_label, value) => {
    expect(validate(value)).toBe(
      "Has to be expressed as time + unit (e.g. 10ms or 443us).",
    );
  });

  it("returns error string for array that coerces to valid time string", ({
    expect,
  }) => {
    expect(validate(["5s"])).toBe(
      "Has to be expressed as time + unit (e.g. 10ms or 443us).",
    );
  });
});
