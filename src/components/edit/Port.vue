<template>
  <v-form v-model="valid">
    <v-container grid-list-md>
      <v-row wrap>
        <v-col cols="12">
          <v-text-field
            v-model="item.hostname"
            :rules="[validators.required(), validators.hostname()]"
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

<script setup>
import { computed, ref, watch } from "vue";
import { required, hostname, ipsWithMasks } from "@/validation/rules";

const item = defineModel({ type: Object, required: true });
const valid = ref(false);
const emit = defineEmits(["valid"]);

watch(valid, (val) => emit("valid", val));

const validators = { hostname, ipsWithMasks, required };

const newLineHack = ref(false);

const ips = computed({
  get() {
    return (item.value.ips || []).join("\n") + (newLineHack.value ? "\n" : "");
  },
  set(val) {
    if (val) {
      item.value.ips = val.split("\n").filter((line) => line !== "");
      newLineHack.value = val.endsWith("\n");
    } else {
      delete item.value["ips"];
      newLineHack.value = false;
    }
  },
});

watch(
  () => item.value.physical,
  (val) => {
    if (val === false) {
      delete item.value["physical"];
    }
  },
);
</script>
