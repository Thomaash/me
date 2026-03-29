<template>
  <v-form v-model="valid">
    <v-container grid-list-md>
      <v-row>
        <v-col cols="12">
          <v-text-field
            v-model="item.hostname"
            :rules="[validators.required(), validators.hostname()]"
            label="Label"
            autofocus
            clearable
            data-cy="edit-hostname"
          />
        </v-col>
        <v-col cols="12" data-cy="edit-controller-type">
          <v-select
            v-model="item.controllerType"
            :items="controllerTypes"
            label="Type"
            clearable
          />
        </v-col>
        <v-col cols="12">
          <v-text-field
            v-model="item.ip"
            :rules="[validators.ip()]"
            label="IP"
            clearable
            data-cy="edit-ip"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-number-input
            v-model="item.port"
            :rules="[validators.port()]"
            label="Port"
            :min="1"
            :max="65535"
            control-variant="hidden"
            clearable
            data-cy="edit-port"
          />
        </v-col>
        <v-col cols="12" md="6" data-cy="edit-protocol">
          <v-select
            v-model="item.protocol"
            :items="protocolsIP"
            label="Protocol"
            clearable
          />
        </v-col>
      </v-row>
    </v-container>
  </v-form>
</template>

<script setup>
import { ref, watch } from "vue";
import { controllerTypes, protocolsIP } from "@/components/selects";
import { required, hostname, ip, port } from "@/validation/rules";

const item = defineModel({ type: Object, required: true });
const valid = ref(false);
const emit = defineEmits(["valid"]);

watch(valid, (val) => emit("valid", val));

const validators = { required, hostname, ip, port };
</script>
