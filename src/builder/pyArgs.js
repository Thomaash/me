import pyTypes from "./pyTypes";

function pyArg(test, value, type, pre) {
  if (!test) {
    return null;
  }

  const pyValue = pyTypes.get(type)(value);
  return `${pre}${pyValue}`;
}

function pyArgPre(...args) {
  if (args.length === 4) {
    // test, value, type, name
    const name = args.pop();
    return pyArg(...args, `${name}=`);
  } else if (args.length === 3) {
    if (typeof args[2] === "string") {
      // value, type, name
      const name = args.pop();
      return pyArg(true, ...args, `${name}=`);
    } else {
      // test, value, type
      return pyArg(...args, "");
    }
  } else if (args.length === 2) {
    // value, type
    return pyArg(true, ...args, "");
  } else if (args.length === 1) {
    // value
    return pyArg(true, ...args, null, "");
  } else {
    throw new TypeError(`Invalid number of arguments: ${args.length}.`);
  }
}

function pyArgs(values) {
  return values.map((value) => pyArgPre(...value)).filter((str) => str != null);
}

export default pyArgs;
