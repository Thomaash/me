<template>
  <v-form v-model="valid">
    <v-container grid-list-md>
      <v-layout wrap>
        <v-flex xs12>
          <v-text-field
            v-model="item.hostname"
            :error-messages="errors.item.hostname"
            label="Dev Name"
            autofocus
            clearable
            data-cy="edit-hostname"
          />
        </v-flex>
        <v-flex xs12>
          <v-textarea
            v-model="ips"
            :error-messages="errors.item.ips"
            label="IPs"
            auto-grow
            clearable
            data-cy="edit-ips"
          />
        </v-flex>
        <v-flex xs12 data-cy="edit-physical">
          <v-switch v-model="item.physical" color="primary" label="Physical" />
        </v-flex>
      </v-layout>
    </v-container>
  </v-form>
</template>

<script>
import common from "./common";
import errors from "@/validation/errors";
import { required, hostname, ipsWithMasks } from "@/validation/rules";

export default {
  name: "PortEdit",
  mixins: [common, errors],
  data: () => ({
    valid: false,
    item: {},
  }),
  computed: {
    ips: {
      get() {
        return (this.item.ips || []).join("\n");
      },
      set(val) {
        if (val) {
          this.$set(
            this.item,
            "ips",
            val.split("\n").filter((line) => line !== "")
          );
        } else {
          this.$delete(this.item, "ips");
        }
      },
    },
  },
  watch: {
    "item.physical"(val) {
      if (val === false) {
        // Omit physical property if false
        delete this.$delete(this.item, "physical");
      }
    },
  },
  validations: {
    item: {
      hostname: { required, hostname },
      ips: { ipsWithMasks },
    },
  },
};
</script>
