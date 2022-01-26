import createMutationsSharer from "vuex-shared-mutations";

export const syncPlugin = createMutationsSharer({
  predicate: () => true,
});
