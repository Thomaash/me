const CHANNEL_NAME = "pinia-sync";

export function syncPlugin({ store, options }) {
  if (!options.persist) {
    return;
  }

  if (typeof BroadcastChannel === "undefined") {
    return;
  }

  const channel = new BroadcastChannel(CHANNEL_NAME);
  let syncing = false;

  store.$onAction(({ name, args, after }) => {
    after(() => {
      if (syncing) {
        return;
      }
      /* eslint-disable unicorn/require-post-message-target-origin -- BroadcastChannel.postMessage takes no targetOrigin */
      channel.postMessage({
        storeId: store.$id,
        action: name,
        args,
      });
      /* eslint-enable unicorn/require-post-message-target-origin */
    });
  });

  channel.addEventListener("message", (event) => {
    const { storeId, action, args } = event.data;
    if (storeId !== store.$id) {
      return;
    }
    if (typeof store[action] !== "function") {
      return;
    }

    syncing = true;
    try {
      store[action](...args);
    } finally {
      syncing = false;
    }
  });
}
