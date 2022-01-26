import { helpers, integer, between } from "vuelidate/lib/validators";
export * from "vuelidate/lib/validators";

const { req, withParams } = helpers;

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

export const hostname = withParams(
  { type: "hostname" },
  (v) => !req(v) || /^[a-zA-Z][a-zA-Z0-9]*$/.test(v)
);

export const ip = withParams({ type: "ip" }, (v) => !req(v) || testIP(v));

export const ipWithMask = withParams(
  { type: "ipWithMask" },
  (v) => !req(v) || testIPWithMask(v)
);

export const ipsWithMasks = withParams(
  { type: "ipsWithMasks" },
  (v) => !req(v) || v.every(testIPWithMask)
);

export const port = withParams(
  { type: "port" },
  (v) => !req(v) || (integer(v) && between(1, 65535)(v))
);

export const timeWithUnit = withParams(
  { type: "timeWithUnit" },
  (v) => !req(v) || /^\d+(|m|u)s$/.test(v)
);

export const divisible = (divisor) =>
  withParams(
    { type: "divisible", divisor },
    (v) => !req(v) || v % divisor === 0
  );

export const hexData = withParams(
  { type: "hexData" },
  (v) => !req(v) || /^[0-9a-fA-F]*$/.test(v)
);

export const naturalNumberList = withParams(
  { type: "naturalNumberList" },
  (v) => !req(v) || v.every((nm) => /^[0-9]+$/.test(nm))
);
