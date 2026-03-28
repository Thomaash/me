<template>
  <v-form v-model="valid">
    <v-container grid-list-md>
      <v-row>
        <v-col cols="12">
          <v-text-field
            v-model="item.hostname"
            label="Label"
            autofocus
            data-cy="edit-hostname"
          />
        </v-col>
        <v-col cols="12">
          <v-text-field
            ref="itemBandwidth"
            v-model.number="item.bandwidth"
            :rules="[validators.minValue(0)]"
            label="Bandwidth"
            type="number"
            min="0"
            suffix="MBits/s"
            clearable
            data-cy="edit-bandwidth"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="item.delay"
            :rules="[validators.timeWithUnit()]"
            label="Delay"
            clearable
            data-cy="edit-delay"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="item.jitter"
            :rules="[validators.timeWithUnit()]"
            label="Jitter"
            clearable
            data-cy="edit-jitter"
          />
        </v-col>
        <v-col cols="12">
          <v-text-field
            ref="itemLoss"
            v-model.number="item.loss"
            :rules="[validators.between(0, 100)]"
            label="Loss"
            type="number"
            min="0"
            max="100"
            suffix="%"
            clearable
            data-cy="edit-loss"
          />
        </v-col>
        <v-col cols="12">
          <v-text-field
            ref="itemMaxQueueSize"
            v-model.number="item.maxQueueSize"
            :rules="[
              validators.integer(),
              validators.minValue(0),
            ]"
            label="Max queue"
            type="number"
            min="0"
            suffix="packets"
            clearable
            data-cy="edit-max-queue-size"
          />
        </v-col>
      </v-row>
    </v-container>
  </v-form>
</template>

<script setup>
import { ref, watch } from "vue";
import { timeWithUnit, integer, minValue, between } from "@/validation/rules";

const item = defineModel({ type: Object, required: true });
const valid = ref(false);
const emit = defineEmits(["valid"]);

watch(valid, (val) => emit("valid", val));

const validators = { between, integer, minValue, timeWithUnit };
</script>
