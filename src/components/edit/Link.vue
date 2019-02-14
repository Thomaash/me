<template>
  <v-form v-model="valid">
    <v-container grid-list-md>
      <v-layout wrap>
        <v-flex xs12>
          <v-text-field label="Label" v-model="item.hostname" autofocus/>
        </v-flex>
        <v-flex xs12>
          <v-text-field label="Bandwidth" v-model.number="item.bandwidth" :error-messages="errors.item.bandwidth" type="number" min="0" suffix="MBits/s" clearable/>
        </v-flex>
        <v-flex xs12 md6>
          <v-text-field label="Delay" v-model="item.delay" :error-messages="errors.item.delay" clearable/>
        </v-flex>
        <v-flex xs12 md6>
          <v-text-field label="Jitter" v-model="item.jitter" :error-messages="errors.item.jitter" clearable/>
        </v-flex>
        <v-flex xs12>
          <v-text-field label="Loss" v-model.number="item.loss" :error-messages="errors.item.loss" type="number" min="0" max="100" suffix="%" clearable/>
        </v-flex>
        <v-flex xs12>
          <v-text-field label="Max queue" v-model.number="item.maxQueueSize" :error-messages="errors.item.maxQueueSize" type="number" min="0" suffix="packets" clearable/>
        </v-flex>
      </v-layout>
    </v-container>
  </v-form>
</template>

<script>
import common from './common'
import errors from '@/validation/errors'
import { timeWithUnit, integer, minValue, between } from '@/validation/rules'

export default {
  name: 'LinkEdit',
  mixins: [common, errors],
  data: () => ({
    dialog: false,
    item: {}
  }),
  validations: {
    item: {
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
