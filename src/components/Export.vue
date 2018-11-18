<template>
  <v-container grid-list-md>
    <v-layout wrap>
      <v-flex xs12 md6>
        <section>
          <h3 class="headline">Export</h3>

          <p>
            <v-btn flat color="primary" :disabled="working" @click="downloadJSON">JSON</v-btn>
            <v-btn flat color="primary" :disabled="working" @click="downloadScript">Python 2 script</v-btn>
            <v-menu bottom offset-y :disabled="working">
              <v-btn flat color="primary" slot="activator" :disabled="working">Image</v-btn>
              <v-list>
                <v-list-tile v-for="(imageSize, i) in imageSizes" :key="'imageSize' + i" @click="">
                  <v-list-tile-title v-text="imageSize.title" @click="downloadImageStart(imageSize.data)"/>
                </v-list-tile>
              </v-list>
            </v-menu>
          </p>
        </section>
      </v-flex>

      <v-flex xs12 md6>
        <section>
          <h3 class="headline">Import</h3>

          <p>
            <v-btn flat color="primary" :disabled="working" @click="importEmpty">Empty</v-btn>
            <v-menu bottom offset-y :disabled="working">
              <v-btn flat color="primary" slot="activator" :disabled="working">Examples</v-btn>
              <v-list>
                <v-list-tile v-for="(example, i) in examples" :key="'example' + i" @click="">
                  <v-list-tile-title v-text="example.title" @click="importData(example.data)"/>
                </v-list-tile>
              </v-list>
            </v-menu>
            <v-btn flat color="primary" :disabled="working" @click="uploadJSON">File</v-btn>
          </p>
        </section>
      </v-flex>

      <v-slide-y-transition mode="out-in">
        <v-flex xs12 v-if="log.length">
          <section>
            <h3 class="headline">Log</h3>

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

            <v-btn flat color="primary" @click="selectInCanvas()">Select in the Canvas</v-btn>
          </section>
        </v-flex>
      </v-slide-y-transition>

      <div style="height: 0px; width: 0px; overflow: hidden;">
        <input type="file" ref="fileInput" @input="uploadFile"/>
        <VisCanvas v-if="visCanvasOn" @ready="downloadImageFinish" ref="visCanvas"/>
      </div>
    </v-layout>
  </v-container>
</template>

<script>
import Builder from '@/builder'
import VisCanvas from '@/components/vis/VisCanvas'
import exampleEmpty from '@/examples/empty'
import exampleMedium1C from '@/examples/medium_1_controller'
import exampleMedium2C from '@/examples/medium_2_controllers'
import exampleTiny from '@/examples/tiny'
import exampleTinyController from '@/examples/tiny_controller'
import exampleTinyMininetConf from '@/examples/tiny_mininet_conf'
import exampleTinyPhysicalInterface from '@/examples/tiny_physical_interface'
import exampleTinyTC from '@/examples/tiny_tc'
import exporter from '@/exporter'
import importScript from '@/importScript'

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

const logPriority = ['error', 'warning', 'info']

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
      title: 'Tiny with Mininet Settings',
      data: exampleTinyMininetConf
    }, {
      title: 'Medium with 1 controller',
      data: exampleMedium1C
    }, {
      title: 'Medium with 2 controllers',
      data: exampleMedium2C
    } ]
  }),
  computed: {
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
          if (file.type === 'application/json') {
            const json = fr.result
            const importData = JSON.parse(json)
            await this.confirmImport(importData)
          } else if (file.type === 'text/x-python') {
            const script = fr.result
            const importData = importScript(script)
            await this.confirmImport(importData, '<p>Importing scripts is highly unreliable. Imported project will be anything from <strong>incomplete</strong> to <strong>disfunctional</strong>.</p>')
          } else {
            this.showAlert('error', 'Unknown file format.')
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
          const image = await this.$refs.visCanvas.toBlob(this.imageScale)
          this.visCanvasOn = false

          this.showAlert('success', 'Image rendered.')
          const url = URL.createObjectURL(image)
          download('mininet_network.png', url)
          URL.revokeObjectURL(url)
        } catch (error) {
          console.error(error)
          this.showAlert('error', 'Image was not rendered. Maybe too large image?')
        } finally {
          this.working = false
        }
      }, 100)
    }
  }
}
</script>

<style scoped>
</style>
