<template>
  <v-form v-model="valid">
    <v-container grid-list-md>
      <v-layout wrap>
        <v-flex xs12>
          <v-text-field
            v-model="item.hostname"
            label="Label"
            autofocus
            data-cy="edit-hostname"
          />
        </v-flex>
        <v-flex xs12>
          <v-text-field
            ref="itemBandwidth"
            v-model.number="item.bandwidth"
            :rules="[validators.minValue(0)(item.bandwidth)]"
            label="Bandwidth"
            type="number"
            min="0"
            suffix="MBits/s"
            clearable
            data-cy="edit-bandwidth"
          />
        </v-flex>
        <v-flex xs12 md6>
          <v-text-field
            v-model="item.delay"
            :rules="[validators.timeWithUnit(item.delay)]"
            label="Delay"
            clearable
            data-cy="edit-delay"
          />
        </v-flex>
        <v-flex xs12 md6>
          <v-text-field
            v-model="item.jitter"
            :rules="[validators.timeWithUnit(item.jitter)]"
            label="Jitter"
            clearable
            data-cy="edit-jitter"
          />
        </v-flex>
        <v-flex xs12>
          <v-text-field
            ref="itemLoss"
            v-model.number="item.loss"
            :rules="[validators.between(0, 100)(item.loss)]"
            label="Loss"
            type="number"
            min="0"
            max="100"
            suffix="%"
            clearable
            data-cy="edit-loss"
          />
        </v-flex>
        <v-flex xs12>
          <v-text-field
            ref="itemMaxQueueSize"
            v-model.number="item.maxQueueSize"
            :rules="[
              validators.integer(item.maxQueueSize),
              validators.minValue(0)(item.maxQueueSize),
            ]"
            label="Max queue"
            type="number"
            min="0"
            suffix="packets"
            clearable
            data-cy="edit-max-queue-size"
          />
        </v-flex>
      </v-layout>
    </v-container>
  </v-form>
</template>

<script>
import common from "./common";
import { timeWithUnit, integer, minValue, between } from "@/validation/rules";

export default {
  name: "LinkEdit",
  mixins: [common],
  data: () => ({
    dialog: false,
    item: {},
    validators: {
      between,
      integer,
      minValue,
      timeWithUnit,
    },
  }),
};
</script>
