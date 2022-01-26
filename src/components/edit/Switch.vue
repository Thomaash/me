<template>
  <v-form v-model="valid">
    <v-container grid-list-md>
      <v-layout wrap>
        <v-flex xs12>
          <v-text-field
            v-model="item.hostname"
            :error-messages="errors.item.hostname"
            label="Hostname"
            autofocus
            data-cy="edit-hostname"
          />
        </v-flex>
        <v-flex xs12 data-cy="edit-switch-type">
          <v-select
            v-model="item.switchType"
            :items="switchTypes"
            label="Type"
            clearable
          />
        </v-flex>
        <v-flex xs12 md3>
          <ThreeStateCheckbox
            v-model="item.stp"
            label="STP"
            data-cy="edit-stp"
          />
        </v-flex>
        <v-flex xs12 md9>
          <v-text-field
            ref="itemSTPPriority"
            v-model.number="item.stpPriority"
            :rules="[badNumberRule('itemSTPPriority')]"
            :error-messages="errors.item.stpPriority"
            label="STP Priority"
            type="number"
            step="4096"
            min="0"
            max="65535"
            clearable
            data-cy="edit-stp-priority"
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
        <v-flex xs12>
          <v-text-field
            ref="itemDPCTLPort"
            v-model.number="item.dpctlPort"
            :rules="[badNumberRule('itemDPCTLPort')]"
            :error-messages="errors.item.dpctlPort"
            label="DPCTL Port"
            type="number"
            min="1"
            max="65535"
            clearable
            data-cy="edit-dpctl-port"
          />
        </v-flex>
        <v-flex xs12 data-cy="edit-protocol">
          <v-select
            v-model="item.protocol"
            :items="protocolsOF"
            label="Protocol"
            clearable
          />
        </v-flex>
        <v-flex xs12 md6 data-cy="edit-datapath">
          <v-select
            v-model="item.datapath"
            :items="datapaths"
            label="Datapath"
            clearable
          />
        </v-flex>
        <v-flex xs12 md6>
          <v-text-field
            v-model="item.dpid"
            :error-messages="errors.item.dpid"
            label="Datapath ID"
            type="text"
            clearable
            data-cy="edit-dpid"
          />
        </v-flex>
        <v-flex xs12>
          <v-text-field
            v-model="item.dpopts"
            label="Ofdatapath arguments"
            clearable
            data-cy="edit-dpopts"
          />
        </v-flex>
        <v-flex xs12>
          <v-text-field
            ref="itemReconnectMs"
            v-model.number="item.reconnectms"
            :rules="[badNumberRule('itemReconnectMs')]"
            :error-messages="errors.item.reconnectms"
            label="Reconnect Timeout"
            type="number"
            min="0"
            suffix="ms"
            clearable
            data-cy="edit-reconnect-ms"
          />
        </v-flex>
        <v-flex xs12 data-cy="edit-fail-mode">
          <v-select
            v-model="item.failMode"
            :items="failModes"
            label="Fail Mode"
            clearable
          />
        </v-flex>
        <v-flex xs12>
          <ThreeStateCheckbox
            v-model="item.inband"
            label="Inband"
            data-cy="edit-inband"
          />
        </v-flex>
        <v-flex xs12>
          <ThreeStateCheckbox
            v-model="item.inNamespace"
            label="In Namespace"
            data-cy="edit-in-namespace"
          />
        </v-flex>
        <v-flex xs12>
          <ThreeStateCheckbox
            v-model="item.batch"
            label="Batch"
            data-cy="edit-batch"
          />
        </v-flex>
        <v-flex xs12>
          <ThreeStateCheckbox
            v-model="item.verbose"
            label="Verbose"
            data-cy="edit-verbose"
          />
        </v-flex>
        <v-flex xs12>
          <v-text-field
            v-model="item.opts"
            label="Additional Switch Options"
            clearable
            data-cy="edit-opts"
          />
        </v-flex>
        <v-flex xs12>
          <v-textarea
            v-model="item.startScript"
            label="Startup Script"
            auto-grow
            clearable
            data-cy="edit-start-script"
          />
        </v-flex>
        <v-flex xs12>
          <v-textarea
            v-model="item.stopScript"
            label="Shutdown Script"
            auto-grow
            clearable
            data-cy="edit-stop-script"
          />
        </v-flex>
      </v-layout>
    </v-container>
  </v-form>
</template>

<script>
import ThreeStateCheckbox from "@/components/ThreeStateCheckbox";
import common from "./common";
import errors from "@/validation/errors";
import {
  required,
  hostname,
  integer,
  between,
  divisible,
  minValue,
  minLength,
  maxLength,
  hexData,
  ip,
  port,
} from "@/validation/rules";
import {
  switchTypes,
  failModes,
  datapaths,
  protocolsOF,
} from "@/components/selects";

export default {
  name: "SwitchEdit",
  components: { ThreeStateCheckbox },
  mixins: [common, errors],
  data: () => ({
    valid: false,
    item: {},
    switchTypes,
    failModes,
    datapaths,
    protocolsOF,
  }),
  validations: {
    item: {
      dpctlPort: { port },
      dpid: { hexData, minLength: minLength(1), maxLength: maxLength(16) },
      hostname: { required, hostname },
      ip: { ip },
      reconnectms: { integer, minValue: minValue(0) },
      stpPriority: {
        integer,
        between: between(0, 65535),
        divisible: divisible(4096),
      },
    },
  },
};
</script>
