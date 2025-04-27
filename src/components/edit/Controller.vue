<template>
  <v-form v-model="valid">
    <v-container grid-list-md>
      <v-row>
        <v-col cols="12">
          <v-text-field
            v-model="item.hostname"
            :rules="[
              validators.required(item.hostname),
              validators.hostname(item.hostname),
            ]"
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
            :rules="[validators.ip(item.ip)]"
            label="IP"
            clearable
            data-cy="edit-ip"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            ref="port"
            v-model.number="item.port"
            :rules="[validators.port(item.port)]"
            label="Port"
            type="number"
            min="1"
            max="65535"
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

<script>
import common from "./common";
import { controllerTypes, protocolsIP } from "@/components/selects";
import { required, hostname, ip, port } from "@/validation/rules";

export default {
  name: "ControllerEdit",
  mixins: [common],
  data: () => ({
    valid: false,
    item: {},
    controllerTypes,
    protocolsIP,
    validators: {
      required,
      hostname,
      ip,
      port,
    },
  }),
};
</script>
