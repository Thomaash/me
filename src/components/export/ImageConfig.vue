<template>
  <v-layout row wrap>
    <v-flex xs12 sm6 lg3>
      <v-text-field
        :disabled="working"
        label="Width on screen"
        type="number"
        :min="0"
        :step="0.1"
        v-model.number="widthScreenCm"
        suffix="cm"
      />
    </v-flex>
    <v-flex xs12 sm6 lg3>
      <v-text-field
          :disabled="working"
          label="Height on screen"
          type="number"
          :min="0"
          v-model.number="heightScreenCm"
          suffix="cm"
        />
    </v-flex>
    <v-flex xs12 sm6 lg3>
      <v-text-field
        :disabled="working"
        label="Width on paper"
        type="number"
        :min="0"
        v-model.number="widthPaperCm"
        suffix="cm"
      />
    </v-flex>
    <v-flex xs12 sm6 lg3>
      <v-text-field
        :disabled="working"
        label="Height on paper"
        type="number"
        :min="0"
        v-model.number="heightPaperCm"
        suffix="cm"
      />
    </v-flex>

    <v-flex xs12 sm6 md4>
      <v-text-field
        :disabled="working"
        label="Width"
        type="number"
        :min="0"
        v-model.number="widthPx"
        suffix="px"
      />
    </v-flex>
    <v-flex xs12 sm6 md4>
      <v-text-field
        :disabled="working"
        label="Height"
        type="number"
        :min="0"
        v-model.number="heightPx"
        suffix="px"
      />
    </v-flex>

    <v-flex xs12 sm12 md4 mt-2>
      <v-btn
        :disabled="working"
        outline
        block
        color="primary"
        @click="$emit('render', scale)"
      >
        Render image
      </v-btn>
    </v-flex>
  </v-layout>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'ImageConfig',
  props: {
    working: {
      required: true,
      type: Boolean
    }
  },
  data: () => ({
    scale: 1,
    screenDpcm: 38,
    paperDpcm: 120
  }),
  computed: {
    ...mapGetters('topology', [
      'boundingBox'
    ]),

    width () {
      return this.boundingBox().width
    },
    height () {
      return this.boundingBox().height
    },

    widthPx: {
      get () {
        return Math.ceil(this.width * this.scale)
      },
      set  (v) {
        this.scale = v / this.width
      }
    },
    heightPx: {
      get () {
        return Math.ceil(this.height * this.scale)
      },
      set  (v) {
        this.scale = v / this.height
      }
    },

    widthScreenCm: {
      get () {
        return Math.round((
          Math.ceil(this.width * this.scale) / this.screenDpcm
        ) * 100) / 100
      },
      set  (v) {
        this.scale = v * this.screenDpcm / this.width
      }
    },
    heightScreenCm: {
      get () {
        return Math.round((
          Math.ceil(this.height * this.scale) / this.screenDpcm
        ) * 100) / 100
      },
      set  (v) {
        this.scale = v * this.screenDpcm / this.height
      }
    },

    widthPaperCm: {
      get () {
        return Math.round((
          Math.ceil(this.width * this.scale) / this.paperDpcm
        ) * 100) / 100
      },
      set  (v) {
        this.scale = v * this.paperDpcm / this.width
      }
    },
    heightPaperCm: {
      get () {
        return Math.round((
          Math.ceil(this.height * this.scale) / this.paperDpcm
        ) * 100) / 100
      },
      set  (v) {
        this.scale = v * this.paperDpcm / this.height
      }
    }
  }
}
</script>

<style scoped>
</style>
