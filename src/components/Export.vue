<template>
  <v-slide-y-transition mode="out-in">
    <v-container grid-list-md>
      <v-layout wrap>
        <v-flex xs12>
          <v-card>
            <v-card-title primary-title>
              <h3>Export</h3>
            </v-card-title>
            <v-card-actions>
              <v-btn flat @click="downloadJSON">JSON</v-btn>
              <v-btn flat @click="downloadScript">Python 2 script</v-btn>
            </v-card-actions>
          </v-card>
        </v-flex>
        <v-flex xs12>
          <v-textarea solo label="Python 2 script" v-model="script" rows="40"/>
        </v-flex>
        <v-flex xs12>
          <v-textarea solo label="Raw" v-model="json" rows="40"/>
        </v-flex>
        <v-flex xs12>
          <v-card>
            <v-card-title primary-title>
              <h3>Log</h3>
            </v-card-title>
            <v-card-text>
              <v-list>
                <v-list-tile v-for="(l, i) in log" :key="'export_log_' + i" @click="selectInCanvas(l.item.id)">
                  <v-list-tile-action>
                    <v-icon v-text="'$vuetify.icons.' + l.severity"/>
                  </v-list-tile-action>
                  <v-list-tile-content>
                    <v-list-tile-title v-text="l.msg"/>
                  </v-list-tile-content>
                </v-list-tile>
              </v-list>
            </v-card-text>
          </v-card>
        </v-flex>
      </v-layout>
    </v-container>
  </v-slide-y-transition>
</template>

<script>
import Builder from '@/builder'
import exporter from '@/exporter'

function download (filename, mime, data) {
  const element = document.createElement('a')
  element.setAttribute('href', `data:${mime},${encodeURIComponent(data)}`)
  element.setAttribute('download', filename)
  element.style.display = 'none'

  document.body.appendChild(element)
  element.click()
  document.body.removeChild(element)
}

export default {
  name: 'Export',
  data: () => ({
    log: []
  }),
  computed: {
    json () {
      return JSON.stringify(
        exporter.exportData(
          this.$store.state.data
        ),
        undefined,
        4
      )
    },
    script () {
      const builder = new Builder(JSON.parse(JSON.stringify(this.$store.state.data)))
      this.log = builder.log
      return builder.build()
    }
  },
  methods: {
    selectInCanvas (id) {
      this.$router.push({
        name: 'Canvas',
        params: { id }
      })
    },
    downloadJSON () {
      download(
        'mininet_network.json',
        'application/json;charset=utf-8',
        JSON.stringify(
          exporter.exportData(
            this.$store.state.data
          ),
          undefined,
          4
        )
      )
    },
    downloadScript () {
      const builder = new Builder(JSON.parse(this.json))
      const script = builder.build()
      this.log = builder.log
      download('mininet_network.py', 'text/x-python;charset=utf-8', script)
    }
  }
}
</script>

<style scoped>
</style>
