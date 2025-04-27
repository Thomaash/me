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
        <v-col cols="12" data-cy="edit-switch-type">
          <v-select
            v-model="item.switchType"
            :items="switchTypes"
            label="Type"
            clearable
          />
        </v-col>
        <v-col cols="12" md="3">
          <ThreeStateCheckbox
            v-model="item.stp"
            label="STP"
            data-cy="edit-stp"
          />
        </v-col>
        <v-col cols="12" md="9">
          <v-text-field
            ref="itemSTPPriority"
            v-model.number="item.stpPriority"
            :rules="[
              validators.integer()(item.stpPriority),
              validators.between(0, 65535)(item.stpPriority),
              validators.divisible(4096)(item.stpPriority),
            ]"
            label="STP Priority"
            type="number"
            step="4096"
            min="0"
            max="65535"
            clearable
            data-cy="edit-stp-priority"
          />
        </v-col>
        <v-col cols="12">
          <v-text-field
            v-model="item.ip"
            :rules="[validators.ip()(item.ip)]"
            label="IP"
            clearable
            data-cy="edit-ip"
          />
        </v-col>
        <v-col cols="12">
          <v-text-field
            ref="itemDPCTLPort"
            v-model.number="item.dpctlPort"
            :rules="[validators.port()(item.dpctlPort)]"
            label="DPCTL Port"
            type="number"
            min="1"
            max="65535"
            clearable
            data-cy="edit-dpctl-port"
          />
        </v-col>
        <v-col cols="12" data-cy="edit-protocol">
          <v-select
            v-model="item.protocol"
            :items="protocolsOF"
            label="Protocol"
            clearable
          />
        </v-col>
        <v-col cols="12" md="6" data-cy="edit-datapath">
          <v-select
            v-model="item.datapath"
            :items="datapaths"
            label="Datapath"
            clearable
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="item.dpid"
            :rules="[
              validators.hexData()(item.dpid),
              validators.minLength(1)(item.dpid),
              validators.maxLength(16)(item.dpid),
            ]"
            label="Datapath ID"
            type="text"
            clearable
            data-cy="edit-dpid"
          />
        </v-col>
        <v-col cols="12">
          <v-text-field
            v-model="item.dpopts"
            label="Ofdatapath arguments"
            clearable
            data-cy="edit-dpopts"
          />
        </v-col>
        <v-col cols="12">
          <v-text-field
            ref="itemReconnectMs"
            v-model.number="item.reconnectms"
            :rules="[
              validators.integer()(item.reconnectms),
              validators.minValue(0)(item.reconnectms),
            ]"
            label="Reconnect Timeout"
            type="number"
            min="0"
            suffix="ms"
            clearable
            data-cy="edit-reconnect-ms"
          />
        </v-col>
        <v-col cols="12" data-cy="edit-fail-mode">
          <v-select
            v-model="item.failMode"
            :items="failModes"
            label="Fail Mode"
            clearable
          />
        </v-col>
        <v-col cols="12">
          <ThreeStateCheckbox
            v-model="item.inband"
            label="Inband"
            data-cy="edit-inband"
          />
        </v-col>
        <v-col cols="12">
          <ThreeStateCheckbox
            v-model="item.inNamespace"
            label="In Namespace"
            data-cy="edit-in-namespace"
          />
        </v-col>
        <v-col cols="12">
          <ThreeStateCheckbox
            v-model="item.batch"
            label="Batch"
            data-cy="edit-batch"
          />
        </v-col>
        <v-col cols="12">
          <ThreeStateCheckbox
            v-model="item.verbose"
            label="Verbose"
            data-cy="edit-verbose"
          />
        </v-col>
        <v-col cols="12">
          <v-text-field
            v-model="item.opts"
            label="Additional Switch Options"
            clearable
            data-cy="edit-opts"
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
import ThreeStateCheckbox from "@/components/ThreeStateCheckbox.vue";
import common from "./common";
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
  mixins: [common],
  data: () => ({
    valid: false,
    item: {},
    switchTypes,
    failModes,
    datapaths,
    protocolsOF,
    validators: {
      between,
      divisible,
      hexData,
      hostname,
      integer,
      ip,
      maxLength,
      minLength,
      minValue,
      port,
      required,
    },
  }),
};
</script>
