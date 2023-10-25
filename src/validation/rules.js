const testMask4 = (v) => /^\d+$/.test(v) && v >= 0 && v <= 32;
const testMask6 = (v) => /^\d+$/.test(v) && v >= 0 && v <= 128;

const testIP4 = (v) =>
  /^\d+\.\d+\.\d+\.\d+$/.test(v) &&
  v.split(".").every((p) => p >= 0 && p <= 255);
const testIP6 = (v) => {
  if (!/^[a-fA-F0-9:]+$/.test(v)) {
    return false;
  }

  const parts = v.split(":");
  if (!parts.every((p) => p.length <= 4)) {
    return false;
  }

  const every = parts.length;
  const empty = parts.filter((p) => p.length === 0).length;
  return (empty === 0 && every === 8) || (empty === 1 && every <= 8);
};

const testIP4WithMask = (v) => {
  const [ip, mask, tail] = v.split("/");
  return (
    tail === undefined &&
    ip != null &&
    testIP4(ip) &&
    mask != null &&
    testMask4(mask)
  );
};
const testIP6WithMask = (v) => {
  const [ip, mask, tail] = v.split("/");
  return (
    tail === undefined &&
    ip != null &&
    testIP6(ip) &&
    mask != null &&
    testMask6(mask)
  );
};

const testIP = (v) => testIP4(v) || testIP6(v);
const testIPWithMask = (v) => testIP4WithMask(v) || testIP6WithMask(v);

const between = (min, max) => (v) =>
  v == null ||
  v === "" ||
  (typeof v === "number" && min <= v && v <= max) ||
  `Has to be between ${min} and ${max} inclusive.`;
const decimal = () => (v) =>
  v == null ||
  v === "" ||
  (typeof v === "number" && Number.isFinite(v)) ||
  `Has to be a decimal number.`;
const divisible = (divisor) => (v) =>
  v == null ||
  v === "" ||
  (typeof v === "number" && v % divisor === 0) ||
  `Has to be divisible by ${divisor}.`;
const hexData = () => (v) =>
  v == null ||
  v === "" ||
  (typeof v === "string" && /^[0-9a-fA-F]+$/.test(v)) ||
  "Has to be in hexadecimal.";
const hostname = () => (v) =>
  v == null ||
  v === "" ||
  (typeof v === "string" && /^[a-zA-Z][a-zA-Z0-9]+$/.test(v)) ||
  "Has to start with a letter and contain only letters and numbers.";
const integer = () => (v) =>
  v == null ||
  v === "" ||
  (typeof v === "number" && v % 1 === 0) ||
  "Has to be an integer.";
const ipWithMask = () => (v) =>
  v == null ||
  v === "" ||
  (typeof v === "string" && testIPWithMask(v)) ||
  "Has to contain a valid IP 4/6 address with a mask (CIDR notation).";
const ip = () => (v) =>
  v == null ||
  v === "" ||
  (typeof v === "string" && testIP(v)) ||
  "Has to be valid IP 4/6 address.";
const ipsWithMasks = () => (v) =>
  v == null ||
  v === "" ||
  (Array.isArray(v) && v.every((v) => testIPWithMask(v))) ||
  "Has to contain only valid IP 4/6 addresses with masks (CIDR notation), one per line.";
const maxLength = (max) => (v) =>
  v == null ||
  v === "" ||
  (typeof v === "string" && v.length <= max) ||
  `Has to have at most ${max} character(s).`;
const maxValue = (max) => (v) =>
  v == null ||
  v === "" ||
  (typeof v === "number" && v <= max) ||
  `Has to be at most ${max}.`;
const minLength = (min) => (v) =>
  v == null ||
  v === "" ||
  (typeof v === "string" && v.length >= min) ||
  `Has to have at least ${min} character(s).`;
const minValue = (min) => (v) =>
  v == null ||
  v === "" ||
  (typeof v === "number" && v >= min) ||
  `Has to be at least ${min}.`;
const naturalNumberList = () => (v) =>
  v == null ||
  v === "" ||
  (Array.isArray(v) && v.every((nm) => /^[0-9]+$/.test(nm))) ||
  "Has to be a list of natural numbers.";
const port = () => (v) =>
  v == null ||
  v === "" ||
  (typeof v === "number" && v % 1 === 0 && 1 <= v && v <= 65535) ||
  "Has to be valid port (1-65535).";
const required = () => (v) => (v != null && v !== "") || "Can'n be left empty.";
const timeWithUnit = () => (v) =>
  v == null ||
  v === "" ||
  (typeof v === "string" && /^\d+(|m|u)s$/.test(v)) ||
  "Has to be expressed as time + unit (e.g. 10ms or 443us).";

export {
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
};
