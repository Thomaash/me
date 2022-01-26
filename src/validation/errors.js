const errors = {
  $default: ({ type }) => `Missing string for “${type}”.`,
  between: ({ min, max }) => `Has to be between ${min} and ${max} inclusive.`,
  divisible: ({ divisor }) => `Has to be divisible by ${divisor}.`,
  hexData: () => "Has to be in hexadecimal.",
  hostname: () =>
    "Has to start with a letter and contain only letters and numbers.",
  integer: () => "Has to be an integer.",
  ip: () => "Has to be valid IP 4/6 address.",
  ipWithMask: () =>
    "Has to contain a valid IP 4/6 address with a mask (CIDR notation).",
  ips: () => "Has to contain only valid IP 4/6 addresses, one per line.",
  ipsWithMasks: () =>
    "Has to contain only valid IP 4/6 addresses with masks (CIDR notation), one per line.",
  maxLength: ({ max }) => `Has to have at most ${max} character(s).`,
  maxValue: ({ max }) => `Has to be at most ${max}.`,
  minLength: ({ min }) => `Has to have at least ${min} character(s).`,
  minValue: ({ min }) => `Has to be at least ${min}.`,
  naturalNumberList: () => "Has to be a list of natural numbers.",
  port: () => "Has to be valid port (1-65535).",
  required: () => "Can'n be left empty.",
  timeWithUnit: () =>
    "Has to be expressed as time + unit (e.g. 10ms or 443us).",
};

function prepErrors(root) {
  const items = [];
  const keys = Object.keys(root).filter(
    (key) => !key.startsWith("$") || key === "$each"
  );
  keys.forEach((key) => {
    const params = root.$params[key];
    if (params) {
      if (!root[key]) {
        items.push((errors[key] || errors.$default)(params));
      }
    } else {
      items[key] = prepErrors(root[key]);
    }
  });

  return items;
}

export default {
  computed: {
    errors() {
      return prepErrors(this.$v);
    },
    badNumberRule() {
      return (ref) => {
        if (this.$refs[ref]) {
          return () =>
            this.$refs[ref].badInput ? "Has to be valid number." : true;
        } else {
          // Don't try to report errors if the ref wasn't initialized yet.
          return true;
        }
      };
    },
  },
};
