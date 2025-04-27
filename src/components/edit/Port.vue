<template>
  <v-form v-model="valid">
    <v-container grid-list-md>
      <v-row wrap>
        <v-col cols="12">
          <v-text-field
            v-model="item.hostname"
            :rules="[
              validators.required()(item.hostname),
              validators.hostname()(item.hostname),
            ]"
            label="Dev Name"
            autofocus
            clearable
            data-cy="edit-hostname"
          />
        </v-col>
        <v-col cols="12">
          <v-textarea
            v-model="ips"
            :rules="[validators.ipsWithMasks()(item.ips)]"
            label="IPs"
            auto-grow
            clearable
            data-cy="edit-ips"
          />
        </v-col>
        <v-col cols="12" data-cy="edit-physical">
          <v-switch v-model="item.physical" color="primary" label="Physical" />
        </v-col>
      </v-row>
    </v-container>
  </v-form>
</template>

<script>
import common from "./common";
import { required, hostname, ipsWithMasks } from "@/validation/rules";

export default {
  name: "PortEdit",
  mixins: [common],
  data: () => ({
    valid: false,
    item: {},
    newLineHack: false, // TODO: Fix properly.
    validators: {
      hostname,
      ipsWithMasks,
      required,
    },
  }),
  computed: {
    ips: {
      get() {
        return (
          (this.item.ips || []).join("\n") + (this.newLineHack ? "\n" : "")
        );
      },
      set(val) {
        if (val) {
          this.item.ips = val.split("\n").filter((line) => line !== "");
          this.newLineHack = val.endsWith("\n");
        } else {
          delete this.item["ips"];
          this.newLineHack = false;
        }
      },
    },
  },
  watch: {
    "item.physical"(val) {
      if (val === false) {
        // Omit physical property if false
        delete this.item["physical"];
      }
    },
  },
};
</script>
