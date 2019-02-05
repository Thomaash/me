<template>
  <v-container grid-list-md>
    <v-layout wrap>
      <v-flex xs12 md7>
        <section>
          <h3 class="headline">Export</h3>

          <p>
            <v-btn :disabled="working" flat color="primary" @click="downloadJSON">JSON</v-btn>
            <v-btn :disabled="working" flat color="primary" @click="downloadScript">Python 2 script</v-btn>
            <v-menu :disabled="working" bottom offset-y>
              <v-btn slot="activator" :disabled="working" flat color="primary">Image</v-btn>
              <v-list>
                <v-list-tile v-for="(imageSize, i) in imageSizes" :key="'imageSize' + i" @click.prevent>
                  <v-list-tile-title @click="downloadImageStart(imageSize.data)" v-text="imageSize.title" />
                </v-list-tile>
              </v-list>
            </v-menu>
            <v-btn :disabled="working" flat color="primary" @click="downloadAddressingPlan">Addressing plan</v-btn>
          </p>
        </section>
      </v-flex>

      <v-flex xs12 md5>
        <section>
          <h3 class="headline">Import</h3>

          <p>
            <v-btn :disabled="working" flat color="primary" @click="importEmpty">Empty</v-btn>
            <v-menu :disabled="working" bottom offset-y>
              <v-btn slot="activator" :disabled="working" flat color="primary">Examples</v-btn>
              <v-list>
                <v-list-tile v-for="(example, i) in examples" :key="'example' + i" @click.prevent>
                  <v-list-tile-title @click="importData(example.data)" v-text="example.title" />
                </v-list-tile>
              </v-list>
            </v-menu>
            <v-btn :disabled="working" flat color="primary" @click="uploadJSON">File</v-btn>
          </p>
        </section>
      </v-flex>

      <v-slide-y-transition mode="out-in">
        <v-flex v-if="sortedLog.length" xs12>
          <section>
            <h3 class="headline">Log</h3>

            <v-list>
              <v-list-tile v-for="(l, i) in sortedLog" :key="'export_log_' + i" avatar @click.prevent>
                <v-list-tile-action>
                  <v-checkbox v-model="logCbs[i]" color="primary" hide-details />
                </v-list-tile-action>
                <v-list-tile-content @click="$set(logCbs, i, !logCbs[i])">
                  <v-list-tile-title v-text="l.msg" />
                </v-list-tile-content>
                <v-list-tile-avatar @click="selectInCanvas(l.item.id)">
                  <v-icon :color="l.severity" v-text="'$vuetify.icons.' + l.severity" />
                </v-list-tile-avatar>
              </v-list-tile>
            </v-list>

            <v-btn flat color="primary" @click="selectInCanvas()">Select in the Canvas</v-btn>
          </section>
        </v-flex>
      </v-slide-y-transition>

      <div style="height: 0px; width: 0px; overflow: hidden;">
        <input ref="fileInput" type="file" @input="uploadFile">
        <VisCanvas v-if="visCanvasOn" ref="visCanvas" @ready="downloadImageFinish" />
      </div>
    </v-layout>
  </v-container>
</template>

<script>
import AddressingPlan from '@/builder/AddressingPlan'
import Builder from '@/builder'
import VisCanvas from '@/components/vis/VisCanvas'
import exporter from '@/exporter'
import importScript from '@/importScript'
import { mapGetters } from 'vuex'

import exampleEmpty from '@/examples/empty'
import exampleMedium1C from '@/examples/medium_1_controller'
import exampleMedium2C from '@/examples/medium_2_controllers'
import exampleTiny from '@/examples/tiny'
import exampleTinyController from '@/examples/tiny_controller'
import exampleTinyMininetConf from '@/examples/tiny_mininet_conf'
import exampleTinyPhysicalInterface from '@/examples/tiny_physical_interface'
import exampleTinyTC from '@/examples/tiny_tc'

function download (filename, mimeOrHref, data) {
  const href = mimeOrHref && data
    ? `data:${mimeOrHref},${encodeURIComponent(data)}`
    : mimeOrHref

  const element = document.createElement('a')
  element.setAttribute('href', href)
  element.setAttribute('download', filename)
  element.style.display = 'none'

  document.body.appendChild(element)
  element.click()
  document.body.removeChild(element)
}

const logPriority = [
  'error', 'warning', 'info'
].reduce((acc, v, i) => {
  acc[v] = i
  return acc
}, {})

export default {
  name: 'Export',
  components: { VisCanvas },
  data: () => ({
    log: [],
    logCbs: [],
    visCanvasOn: false,
    imageScale: 2,
    imageSizes: [{
      title: 'Small',
      data: 1
    }, {
      title: 'Medium',
      data: 2
    }, {
      title: 'Large',
      data: 4
    }],
    examples: [{
      title: 'Tiny without controller',
      data: exampleTiny
    }, {
      title: 'Tiny with remote controller',
      data: exampleTinyController
    }, {
      title: 'Tiny with physical interface',
      data: exampleTinyPhysicalInterface
    }, {
      title: 'Tiny with traffic control',
      data: exampleTinyTC
    }, {
      title: 'Tiny with Mininet settings',
      data: exampleTinyMininetConf
    }, {
      title: 'Medium with 1 controller',
      data: exampleMedium1C
    }, {
      title: 'Medium with 2 controllers',
      data: exampleMedium2C
    }]
  }),
  computed: {
    ...mapGetters('topology', [
      'data'
    ]),
    working: {
      get () {
        return !!this.$store.state.working
      },
      set (value) {
        if (value) {
          this.$store.commit('clearAlert')
        }
        this.$store.commit('setWorking', { working: !!value })
      }
    },
    sortedLog () {
      return [...this.log].sort(
        ({ severity: a }, { severity: b }) =>
          logPriority[a] - logPriority[b]
      )
    },
    importers () {
      function json (json) {
        return { data: JSON.parse(json), log: [] }
      }
      function python (script) {
        return importScript(script)
      }
      return {
        '.json': json,
        '.py': python,
        'application/json': json,
        'application/x-python-code': python,
        'text/x-python': python,
        json,
        python
      }
    }
  },
  methods: {
    showAlert (type, text) {
      this.$store.commit('setAlert', { type, text })
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
          const stringToImport = this.importers[file.type] ||
            this.importers[file.name.replace(/^.*(?=\.)/, '')]
          if (stringToImport) {
            const str = fr.result
            const { data, log } = stringToImport(str)
            this.log = log
            if (stringToImport === this.importers.python) {
              await this.confirmImport(data, '<p>Importing scripts is highly unreliable. Imported project can be <strong>incomplete</strong> or <strong>dysfunctional</strong>.</p>')
            } else {
              await this.confirmImport(data)
            }
          } else {
            this.showAlert('error', `Unknown file format: “${file.type}”.`)
          }
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
    async confirmImport (importData, text) {
      const confirmed = await this.$confirm(
        (text || '') +
        '<p>This will <strong>erase all your work</strong> (except what you have exported).<br/>Are you sure you want to continue?</p>',
        {
          buttonFalseText: 'Keep existing project',
          buttonTrueText: 'Import',
          icon: this.$vuetify.icons.warning,
          title: 'Warning',
          width: 600
        }
      )
      if (confirmed) {
        this.$store.commit('topology/importData', importData)
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
          .map(i => this.sortedLog[i].item.id)
      } else {
        ids = this.sortedLog.map(l => l.item.id)
      }

      this.$router.push({
        name: 'Canvas',
        params: { ids: ids.join(',') }
      })
    },
    downloadJSON () {
      try {
        this.working = true

        const json = JSON.stringify(exporter.exportData(this.data), undefined, 4)
        this.showAlert('success', 'Successfully exported.')
        download(this.getFilename('json'), 'application/json;charset=utf-8', json)
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

        const builder = new Builder(exporter.exportData(this.data))
        this.log = builder.log
        const script = builder.build()
        this.showAlert('success', 'Script built.')
        download(this.getFilename('py'), 'text/x-python;charset=utf-8', script)
      } catch (error) {
        console.error(error)
        this.showAlert('error', 'Script was not built.')
      } finally {
        this.working = false
      }
    },
    downloadImageStart (scale) {
      this.working = true
      this.imageScale = scale
      this.visCanvasOn = true
    },
    downloadImageFinish () {
      // The timeout prevents glitches like missing node icons.
      window.setTimeout(async () => {
        try {
          const { blob, width, height } = await this.$refs.visCanvas.toBlob(this.imageScale)
          this.visCanvasOn = false

          const size = `${width.toLocaleString()}\xa0×\xa0${height.toLocaleString()}\xa0px (${((width * height) / 1e6).toLocaleString()}\xa0Mpx)`

          if (blob) {
            this.showAlert('success', `Image rendered, size: ${size}.`)
            const url = URL.createObjectURL(blob)
            download(this.getFilename('png'), url)
            URL.revokeObjectURL(url)
          } else {
            this.showAlert('error', `Image rendering failed. Probably too large image for this browser, size: ${size}.`)
          }
        } catch (error) {
          console.error(error)
          this.showAlert('error', 'Image rendering failed.')
        } finally {
          this.working = false
        }
      }, 100)
    },
    downloadAddressingPlan () {
      try {
        this.working = true
        this.log = []

        const ap = new AddressingPlan(exporter.exportData(this.data))
        ap.build()
        ap.savePDF(this.data.projectName, this.getFilename('pdf'))

        this.showAlert('success', 'Addressing plan built.')
      } catch (error) {
        console.error(error)
        this.showAlert('error', 'Addressing plan was not built.')
      } finally {
        this.working = false
      }
    },
    getFilename (extension) {
      return `${this.data.projectName || 'mininet_network'}.${extension}`
    }
  }
}
</script>

<style scoped>
</style>
