function jsonImporter(content) {
  return { data: JSON.parse(content), log: [], warnings: [] };
}

async function pythonImporter(content) {
  const { default: importScript } = await import("@/importScript");
  const { data, log } = importScript(content);
  return { data, log, warnings: ["script-import-warning"] };
}

const importersByKey = {
  ".json": jsonImporter,
  ".py": pythonImporter,
  "application/json": jsonImporter,
  "application/x-python-code": pythonImporter,
  "text/x-python": pythonImporter,
  json: jsonImporter,
  python: pythonImporter,
};

const importAccept = Object.keys(importersByKey)
  .filter((key) => /(^\.|\/)/.test(key))
  .join(",");

export default {
  importAccept,

  async stringToImport(fileType, fileName, content) {
    const importer =
      importersByKey[fileType] ||
      importersByKey[fileName.replace(/^.*(?=\.)/, "")];

    if (!importer) {
      throw new TypeError(`Unknown file format: "${fileType}".`);
    }

    return importer(content);
  },
};
