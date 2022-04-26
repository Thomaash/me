function pyBoolean(jsBoolean) {
  return jsBoolean ? "True" : "False";
}
function pyNumber(jsNumber) {
  return `${jsNumber}`;
}
function pyString(jsString) {
  return `'${jsString.replace("'", "\\'")}'`;
}
function pyRaw(jsString) {
  return `${jsString}`;
}

const pyTypes = new Map();
pyTypes.set(Boolean, pyBoolean);
pyTypes.set(Number, pyNumber);
pyTypes.set(String, pyString);
pyTypes.set(null, pyRaw);

export default pyTypes;
