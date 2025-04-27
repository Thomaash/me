<template>
  <v-form v-model="valid">
    <v-container grid-list-md>
      <v-row wrap>
        <v-col cols="12">
          <v-textarea
            v-model="item.hostname"
            auto-grow
            autofocus
            class="monospace-input"
            clearable
            data-cy="edit-hostname"
            label="Label"
          />
        </v-col>
      </v-row>
    </v-container>
  </v-form>
</template>

<script>
import common from "./common";

export default {
  name: "DummyEdit",
  mixins: [common],
  data: () => ({
    valid: false,
    item: {},
  }),
};
</script>
