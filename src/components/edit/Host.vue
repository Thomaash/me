<template>
  <v-form v-model="valid">
    <v-container grid-list-md>
      <v-row>
        <v-col cols="12">
          <v-text-field
            v-model="item.hostname"
            :rules="[
              validators.required()(item.hostname),
              validators.hostname()(item.hostname),
            ]"
            label="Hostname"
            autofocus
            data-cy="edit-hostname"
          />
        </v-col>
        <v-col cols="12">
          <v-text-field
            v-model="item.defaultRoute"
            :rules="[validators.ip()(item.defaultRoute)]"
            label="Default Route"
            clearable
            data-cy="edit-default-route"
          />
        </v-col>
        <v-col cols="12" md="6" data-cy="edit-cpu-scheduler">
          <v-select
            v-model="item.cpuScheduler"
            :items="schedulers"
            label="Scheduler"
            clearable
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            ref="itemCPULimit"
            v-model.number="item.cpuLimit"
            :rules="[
              validators.decimal()(item.cpuLimit),
              validators.between(0, 1)(item.cpuLimit),
            ]"
            label="CPU Utilization Limit"
            type="number"
            min="0"
            max="1"
            step=".01"
            clearable
            data-cy="edit-cpu-limit"
          />
        </v-col>
        <v-col cols="12">
          <v-text-field
            v-model="cpuCoresStr"
            :rules="[validators.naturalNumberList()(item.cpuCores)]"
            label="CPU cores"
            clearable
            data-cy="edit-cpu-cores-str"
          />
        </v-col>
        <v-col cols="12">
          <v-textarea
            v-model="item.startScript"
            label="Startup Script"
            auto-grow
            clearable
            data-cy="edit-start-script"
          />
        </v-col>
        <v-col cols="12">
          <v-textarea
            v-model="item.stopScript"
            label="Shutdown Script"
            auto-grow
            clearable
            data-cy="edit-stop-script"
          />
        </v-col>
      </v-row>
    </v-container>
  </v-form>
</template>

<script>
import common from "./common";
import {
  required,
  hostname,
  ip,
  between,
  decimal,
  naturalNumberList,
} from "@/validation/rules";
import { schedulers } from "@/components/selects";

export default {
  name: "HostEdit",
  mixins: [common],
  data: () => ({
    valid: false,
    item: {},
    tralingCommaHack: false, // TODO: Fix properly.
    schedulers,
    validators: {
      between,
      decimal,
      hostname,
      ip,
      naturalNumberList,
      required,
    },
  }),
  computed: {
    cpuCoresStr: {
      get() {
        return (
          (this.item.cpuCores ?? []).join(", ") +
          (this.trailingCommaHack ? ", " : "")
        );
      },
      set(val) {
        if (val == null) {
          delete this.item.cpuCores;
          this.trailingCommaHack = false;
        } else {
          this.item.cpuCores = [
            ...new Set(
              val
                .split(/\s*,\s*/)
                .filter((str) => str !== "")
                .map((str) => (/^\d+$/.test(str) ? Number(str) : NaN)),
            ),
          ];
          this.trailingCommaHack = /\s*,\s*$/.test(val);
        }
      },
    },
  },
};
</script>
