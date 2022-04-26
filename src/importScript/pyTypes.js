function pyBoolean(str) {
  if (str === "True") {
    return true;
  } else if (str === "False") {
    return false;
  } else {
    throw new TypeError(`Expected boolean, got: “${str}”`);
  }
}

function pyNotNull(str) {
  return str && str !== "None";
}

function pyNumber(str) {
  if (isNaN(str)) {
    throw new TypeError(`Expected number, got: “${str}”`);
  } else {
    return str * 1;
  }
}

function pyString(str) {
  if (!/^'.*'$/.test(str)) {
    throw new TypeError(`Expected string, got: “${str}”`);
  } else {
    return str.substr(1, str.length - 2);
  }
}

export { pyBoolean, pyNotNull, pyNumber, pyString };
