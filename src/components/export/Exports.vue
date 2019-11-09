<template>
  <v-layout wrap>
    <v-flex xs12 sm4>
      <v-btn :disabled="working" outlined block color="primary" @click="downloadJSON">JSON</v-btn>
    </v-flex>
    <v-flex xs12 sm4>
      <v-btn :disabled="working" outlined block color="primary" @click="downloadScript">Python 2 script</v-btn>
    </v-flex>
    <v-flex xs12 sm4>
      <v-btn :disabled="working" outlined block color="primary" @click="downloadAddressingPlan">Addressing plan</v-btn>
    </v-flex>

    <v-flex xs12 pt-4>
      <h3>Image</h3>
    </v-flex>

    <v-flex xs12>
      <ImageConfig :working="working" @render="downloadImage" />
    </v-flex>

    <div style="height: 0px; width: 0px; overflow: hidden;">
      <VisCanvas v-if="visCanvasOn" ref="visCanvas" @ready="visCanvasResolve" />
    </div>
  </v-layout>
</template>

<script>
import AddressingPlan from '@/builder/AddressingPlan'
import Builder from '@/builder'
import VisCanvas from '@/components/vis/VisCanvas'
import exporter from '@/exporter'
import { mapGetters } from 'vuex'

import ImageConfig from './ImageConfig'

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

export default {
  name: 'Exports',
  components: { ImageConfig, VisCanvas },
  data: () => ({
    visCanvasOn: false,
    visCanvasResolve: () => {}
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
    }
  },
  methods: {
    showAlert (type, text) {
      this.$store.commit('setAlert', { type, text })
    },
    downloadJSON () {
      try {
        this.working = true
        this.$emit('log', [])

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
        this.$emit('log', [])

        const builder = new Builder(exporter.exportData(this.data))
        this.$emit('log', builder.log)
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
    async downloadImage (size) {
      const sizeString = `${size.width.toLocaleString()}\xa0×\xa0${size.height.toLocaleString()}\xa0px (${((size.width * size.height) / 1e6).toLocaleString()}\xa0Mpx)`

      try {
        this.working = true
        this.$emit('log', [])

        const { blob } = await this.tryRenderingMethods(size, sizeString)

        this.showAlert('success', `Image rendered, size: ${sizeString}.`)
        const url = URL.createObjectURL(blob)
        download(this.getFilename('png'), url)
        URL.revokeObjectURL(url)
      } catch (error) {
        this.showAlert(
          'error',
          `Image rendering failed. Probably too large image for this browser, size: ${sizeString}.`
        )
      } finally {
        this.working = false
      }
    },
    async tryRenderingMethods (size, sizeString) {
      try {
        return await this.renderImage(size, sizeString, false)
      } catch (error) {
        const confirmed = await this.$confirm(
          '<p>Fallback method can be used to bypass your browsers limitations, but it is <strong>very slow</strong> and <strong>needs a lot of memory</strong>.</p>',
          {
            buttonFalseText: 'Give up',
            buttonTrueText: 'Try fallback method',
            icon: this.$vuetify.icons.error,
            title: 'Rendering failed',
            width: 600
          }
        )

        if (confirmed) {
          return this.renderImage(size, sizeString, true)
        } else {
          throw error
        }
      }
    },
    async renderImage (size, sizeString, fallback) {
      try {
        this.showAlert(
          'info',
          `Rendering image using ${fallback ? 'slow fallback' : 'fast native'} method, size: ${sizeString}.`
        )

        await new Promise(resolve => {
          this.visCanvasResolve = resolve
          this.visCanvasOn = true
        })

        // The timeout prevents glitches like missing node icons, especially in Firefox.
        await new Promise(resolve => window.setTimeout(resolve, 100))

        return await this.$refs.visCanvas.toBlob(
          size,
          fallback,
          progress => {
            this.$store.commit('setWorking', {
              working: true,
              curr: progress,
              max: 1
            })
          }
        )
      } catch (error) {
        throw error
      } finally {
        this.visCanvasOn = false
      }
    },
    downloadAddressingPlan () {
      try {
        this.working = true
        this.$emit('log', [])

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
