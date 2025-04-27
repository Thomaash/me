<template>
  <v-form v-model="valid">
    <v-container grid-list-md>
      <v-row wrap>
        <v-col cols="12">
          <v-text-field
            v-model="item.hostname"
            label="Label"
            autofocus
            clearable
            data-cy="edit-hostname"
          />
        </v-col>
      </v-row>
    </v-container>
  </v-form>
</template>

<script>
import common from "./common";

export default {
  name: "AssociationEdit",
  mixins: [common],
  data: () => ({
    valid: false,
    item: {},
  }),
};
</script>
