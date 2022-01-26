export default {
  importData(external) {
    external = JSON.parse(JSON.stringify(external));

    if (external.version === 0) {
      const items = external.items.reduce((acc, val) => {
        acc[val.id] = val;
        return acc;
      }, {});

      delete external.version;
      delete external.items;

      return {
        ...external,
        items,
      };
    } else {
      throw new TypeError("Unsuported export version.");
    }
  },
  exportData(internal) {
    internal = JSON.parse(JSON.stringify(internal));

    const items = Object.values(internal.items);

    delete internal.items;

    return {
      ...internal,
      version: 0,
      items,
    };
  },
};
