<template>
  <v-form v-model="valid">
    <v-container grid-list-md>
      <v-layout wrap>
        <v-flex xs12>
          <v-text-field
            v-model="item.hostname"
            :error-messages="errors.item.hostname"
            label="Label"
            autofocus
            clearable
            data-cy="edit-hostname"
          />
        </v-flex>
        <v-flex xs12 data-cy="edit-controller-type">
          <v-select
            v-model="item.controllerType"
            :items="controllerTypes"
            label="Type"
            clearable
          />
        </v-flex>
        <v-flex xs12>
          <v-text-field
            v-model="item.ip"
            :error-messages="errors.item.ip"
            label="IP"
            clearable
            data-cy="edit-ip"
          />
        </v-flex>
        <v-flex xs12 md6>
          <v-text-field
            ref="port"
            v-model.number="item.port"
            :rules="[badNumberRule('port')]"
            :error-messages="errors.item.port"
            label="Port"
            type="number"
            min="1"
            max="65535"
            clearable
            data-cy="edit-port"
          />
        </v-flex>
        <v-flex xs12 md6 data-cy="edit-protocol">
          <v-select
            v-model="item.protocol"
            :items="protocolsIP"
            label="Protocol"
            clearable
          />
        </v-flex>
      </v-layout>
    </v-container>
  </v-form>
</template>

<script>
import common from "./common";
import errors from "@/validation/errors";
import { controllerTypes, protocolsIP } from "@/components/selects";
import { required, hostname, ip, port } from "@/validation/rules";

export default {
  name: "ControllerEdit",
  mixins: [common, errors],
  data: () => ({
    valid: false,
    item: {},
    controllerTypes,
    protocolsIP,
  }),
  validations: {
    item: {
      hostname: { required, hostname },
      ip: { ip },
      port: { port },
    },
  },
};
</script>
