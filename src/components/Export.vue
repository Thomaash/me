<template>
  <v-slide-y-transition mode="out-in">
    <v-container grid-list-md>
      <v-layout wrap>
        <v-flex xs12>
          <v-card>
            <v-card-title primary-title>
              <h3>Export/Import</h3>
            </v-card-title>
            <v-card-actions>
              <v-btn flat :disabled="working" @click="importEmpty">Import Empty</v-btn>
              <v-btn flat :disabled="working" @click="importExample">Import Example</v-btn>
              <v-btn flat :disabled="working" @click="uploadJSON">Import File</v-btn>
              <v-btn flat :disabled="working" @click="downloadJSON">Export JSON</v-btn>
              <v-btn flat :disabled="working" @click="downloadScript">Export Python 2 script</v-btn>
              <input type="file" style="display:none" ref="fileInput" @input="uploadFile">
            </v-card-actions>
            <v-card-text v-if="alertEnabled || working">
              <v-progress-linear v-if="working" :indeterminate="working"/>
              <v-alert v-model="alertEnabled" dismissible :type="alertType">{{alertText}}</v-alert>
            </v-card-text>
          </v-card>
        </v-flex>
        <v-flex xs12 v-if="log.length">
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
import emptyData from '@/store.empty'
import exampleData from '@/store.example'
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
    log: [],
    working: false,
    alertEnabled: false,
    alertType: 'error',
    alertText: '…'
  }),
  methods: {
    showAlert (type, text) {
      this.alertType = type
      this.alertText = text
      this.alertEnabled = true
    },
    uploadJSON () {
      const input = this.$refs.fileInput
      input.click()
    },
    uploadFile () {
      this.working = true

      const input = this.$refs.fileInput
      const file = input.files[0]

      const fr = new FileReader()
      fr.readAsBinaryString(file)
      fr.onloadend = () => {
        try {
          const json = fr.result
          const importData = JSON.parse(json)
          const data = exporter.importData(importData)
          this.$store.commit('data/importData', data)

          this.showAlert('success', 'Succesfully imported.')
        } catch (error) {
          console.error(error)
          this.showAlert('error', 'Import failed.')
        } finally {
          this.working = false
        }
      }

      input.value = ''
    },
    importExample () {
      this.working = true

      this.$store.commit(
        'data/importData',
        JSON.parse(JSON.stringify(exampleData))
      )
      this.showAlert('success', 'Succesfully imported.')

      this.working = false
    },
    importEmpty () {
      this.working = true

      this.$store.commit(
        'data/importData',
        JSON.parse(JSON.stringify(emptyData))
      )
      this.showAlert('success', 'Succesfully imported.')

      this.working = false
    },
    selectInCanvas (id) {
      this.$router.push({
        name: 'Canvas',
        params: { id }
      })
    },
    downloadJSON () {
      this.working = true

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

      this.working = false
    },
    downloadScript () {
      this.working = true

      const builder = new Builder(JSON.parse(JSON.stringify(this.$store.state.data)))
      const script = builder.build()
      this.log = builder.log
      download('mininet_network.py', 'text/x-python;charset=utf-8', script)

      this.working = false
    }
  }
}
</script>

<style scoped>
</style>
