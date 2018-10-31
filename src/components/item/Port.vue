<template>
  <v-card-text>
    <v-container grid-list-md>
      <v-layout wrap>
        <v-flex xs12 sm6 md4>
          <v-text-field label="Dev Name" required v-model="item.hostname"/>
        </v-flex>
        <v-flex xs12>
          <v-textarea label="IPs" v-model="ips"/>
        </v-flex>
      </v-layout>
    </v-container>
  </v-card-text>
</template>

<script>
export default {
  name: 'PortEdit',
  props: ['value'],
  data: () => ({
    dialog: false,
    item: {}
  }),
  computed: {
    ips: {
      get () {
        return (this.item.ips || []).join('\n')
      },
      set (val) {
        this.item.ips = val.split('\n').filter(line => line !== '')
      }
    }
  },
  watch: {
    item (val) {
      this.$emit('input', val)
    },
    value (val) {
      this.item = val
    }
  },
  mounted () {
    this.item = this.value
  }
}
</script>

<style scoped>
</style>
