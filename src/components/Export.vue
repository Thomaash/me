<template>
  <v-slide-y-transition mode="out-in">
    <v-container grid-list-md>
      <v-layout wrap>
        <v-flex xs12 md6>
          <v-card>
            <v-card-title primary-title>
              <h3>Export</h3>
            </v-card-title>
            <v-card-actions>
              <v-btn flat :disabled="working" @click="downloadJSON">JSON</v-btn>
              <v-btn flat :disabled="working" @click="downloadScript">Python 2 script</v-btn>
            </v-card-actions>
          </v-card>
        </v-flex>
        <v-flex xs12 md6>
          <v-card>
            <v-card-title primary-title>
              <h3>Import</h3>
            </v-card-title>
            <v-card-actions>
              <v-btn flat :disabled="working" @click="importEmpty">Empty</v-btn>
              <v-menu bottom offset-y>
                <v-btn flat slot="activator">Examples</v-btn>
                <v-list>
                  <v-list-tile v-for="(example, i) in examples" :key="'example' + i" @click="">
                    <v-list-tile-title v-text="example.title" @click="importData(example.data)"/>
                  </v-list-tile>
                </v-list>
              </v-menu>
              <v-btn flat :disabled="working" @click="uploadJSON">File</v-btn>
            </v-card-actions>
          </v-card>
        </v-flex>
        <v-flex xs12 v-if="alertEnabled || working">
          <v-progress-linear v-if="working" :indeterminate="working"/>
          <v-alert v-model="alertEnabled" dismissible :type="alertType">{{alertText}}</v-alert>
        </v-flex>
        <v-flex xs12 v-if="log.length">
          <v-card>
            <v-card-title primary-title>
              <h3>Log</h3>
            </v-card-title>
            <v-card-text>
              <v-list>
                <v-list-tile avatar v-for="(l, i) in log" :key="'export_log_' + i" @click="">
                  <v-list-tile-action>
                    <v-checkbox v-model="logCbs[i]"/>
                  </v-list-tile-action>
                  <v-list-tile-content @click="$set(logCbs, i, !logCbs[i])">
                    <v-list-tile-title v-text="l.msg"/>
                  </v-list-tile-content>
                  <v-list-tile-avatar @click="selectInCanvas(l.item.id)">
                    <v-icon v-text="'$vuetify.icons.' + l.severity"/>
                  </v-list-tile-avatar>
                </v-list-tile>
              </v-list>
              <v-btn flat @click="selectInCanvas()">Select in the Canvas</v-btn>
            </v-card-text>
          </v-card>
        </v-flex>
        <input type="file" style="display:none" ref="fileInput" @input="uploadFile"/>
      </v-layout>
    </v-container>
  </v-slide-y-transition>
</template>

<script>
import Builder from '@/builder'
import exampleEmpty from '@/examples/empty'
import exampleMedium1C from '@/examples/medium_1_controller'
import exampleMedium2C from '@/examples/medium_2_controllers'
import exampleTiny from '@/examples/tiny'
import exampleTinyController from '@/examples/tiny_controller'
import exampleTinyTC from '@/examples/tiny_tc'
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

const logPriority = ['error', 'warning', 'info']

export default {
  name: 'Export',
  data: () => ({
    log: [],
    logCbs: [],
    working: false,
    alertEnabled: false,
    alertType: 'error',
    alertText: '…',
    examples: [{
      title: 'Tiny without controller',
      data: exampleTiny
    }, {
      title: 'Tiny with remote controller',
      data: exampleTinyController
    }, {
      title: 'Tiny with traffic control',
      data: exampleTinyTC
    }, {
      title: 'Medium with 1 controller',
      data: exampleMedium1C
    }, {
      title: 'Medium with 2 controllers',
      data: exampleMedium2C
    } ]
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
      fr.onloadend = async () => {
        try {
          const json = fr.result
          const importData = JSON.parse(json)
          await this.confirmImport(importData)
        } catch (error) {
          console.error(error)
          this.showAlert('error', 'Import failed.')
        } finally {
          this.working = false
        }
      }

      input.value = ''
    },
    async importData (data) {
      this.working = true
      await this.confirmImport(data)
      this.working = false
    },
    importEmpty () {
      this.importData(exampleEmpty)
    },
    async confirmImport (importData) {
      const confirmed = await this.$confirm(
        'This will erase all your work (except what you have exported).<br/>Are you sure you want to continue?',
        {
          buttonFalseText: 'Keep existing project',
          buttonTrueText: 'Import',
          icon: this.$vuetify.icons.warning,
          title: 'Warning',
          width: 600
        }
      )
      if (confirmed) {
        this.$store.commit('data/importData', importData)
        this.showAlert('success', 'Successfully imported.')
      } else {
        this.showAlert('info', 'Import canceled.')
      }
    },
    selectInCanvas (id) {
      let ids
      if (id) {
        ids = [id]
      } else if (this.logCbs.some(cb => cb)) {
        ids = this.logCbs
          .map((cb, i) => cb ? i : null)
          .filter(i => i !== null)
          .map(i => this.log[i].item.id)
      } else {
        ids = this.log.map(l => l.item.id)
      }

      this.$router.push({
        name: 'Canvas',
        params: { ids: ids.join(',') }
      })
    },
    downloadJSON () {
      try {
        this.working = true

        this.showAlert('success', 'Successfully exported.')
        download(
          'mininet_network.json',
          'application/json;charset=utf-8',
          JSON.stringify(
            exporter.exportData(this.$store.state.data),
            undefined,
            4
          )
        )
      } catch (error) {
        console.error(error)
        this.showAlert('error', 'Export failed.')
      } finally {
        this.working = false
      }
    },
    downloadScript () {
      try {
        this.working = true
        this.log = []

        const builder = new Builder(exporter.exportData(this.$store.state.data))
        this.log = builder.log
        const script = builder.build()
        this.showAlert('success', 'Script built.')
        download('mininet_network.py', 'text/x-python;charset=utf-8', script)
      } catch (error) {
        console.error(error)
        this.log.sort(
          ({ severity: a }, { severity: b }) =>
            logPriority.indexOf(a) - logPriority.indexOf(b)
        )
        this.showAlert('error', 'Script was not built.')
      } finally {
        this.working = false
      }
    }
  }
}
</script>

<style scoped>
</style>
