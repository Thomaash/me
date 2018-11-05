<template>
  <v-card-text>
    <v-form v-model="valid">
      <v-container grid-list-md>
        <v-layout wrap>
          <v-flex xs12>
            <v-text-field label="Label" v-model="item.hostname" :error-messages="hostnameErrors"/>
          </v-flex>
          <v-flex xs12>
            <v-text-field label="Bandwidth" v-model.number="item.bandwidth" :error-messages="bandwidthErrors" type="number" min="0" suffix="MBits/s" clearable/>
          </v-flex>
          <v-flex xs12 md6>
            <v-text-field label="Delay" v-model="item.delay" :error-messages="delayErrors" clearable/>
          </v-flex>
          <v-flex xs12 md6>
            <v-text-field label="Jitter" v-model="item.jitter" :error-messages="jitterErrors" clearable/>
          </v-flex>
          <v-flex xs12>
            <v-text-field label="Loss" v-model.number="item.loss" :error-messages="lossErrors" type="number" min="0" max="100" suffix="%" clearable/>
          </v-flex>
          <v-flex xs12>
            <v-text-field label="Max queue" v-model.number="item.maxQueueSize" :error-messages="maxQueueSizeErrors" type="number" min="0" suffix="packets" clearable/>
          </v-flex>
        </v-layout>
      </v-container>
    </v-form>
  </v-card-text>
</template>

<script>
import common from './common'
import { hostname, timeWithUnit, integer, minValue, between } from './rules'

export default {
  name: 'LinkEdit',
  mixins: [common],
  data: () => ({
    dialog: false,
    item: {}
  }),
  computed: {
    hostnameErrors () {
      return [
        ...(this.$v.item.hostname.hostname ? [] : ['Invalid hostname.'])
      ]
    },
    bandwidthErrors () {
      return [
        ...(this.$v.item.bandwidth.minValue ? [] : ['Bandwidth has to be non-negative.'])
      ]
    },
    delayErrors () {
      return [
        ...(this.$v.item.delay.timeWithUnit ? [] : ['Delay has to be expressed as time + unit (e.g. 10ms or 443us).'])
      ]
    },
    lossErrors () {
      return [
        ...(this.$v.item.loss.between ? [] : ['Loss has to be a percentage between 0 and 100.'])
      ]
    },
    maxQueueSizeErrors () {
      return [
        ...(this.$v.item.maxQueueSize.integer ? [] : ['The number of packets has to be an integer.']),
        ...(this.$v.item.maxQueueSize.minValue ? [] : ['The number of packets has to be non-negative.'])
      ]
    },
    jitterErrors () {
      return [
        ...(this.$v.item.jitter.timeWithUnit ? [] : ['Jitter has to be expressed as time + unit (e.g. 10ms or 443us).'])
      ]
    }
  },
  validations: {
    item: {
      hostname: { hostname },
      bandwidth: { minValue: minValue(0) },
      delay: { timeWithUnit },
      loss: { between: between(0, 100) },
      maxQueueSize: { integer, minValue: minValue(0) },
      jitter: { timeWithUnit }
    }
  }
}
</script>

<style scoped>
</style>
