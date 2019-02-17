<template>
  <v-layout row wrap>
    <v-flex xs12 sm6 lg3>
      <v-text-field
        :disabled="working"
        label="Width on screen"
        type="number"
        :min="0"
        :step="0.1"
        :value="size.widthScreenCm"
        @input="v => recompute('widthScreenCm', v)"
        suffix="cm"
      />
    </v-flex>
    <v-flex xs12 sm6 lg3>
      <v-text-field
        :disabled="working"
        label="Height on screen"
        type="number"
        :min="0"
        :step="0.1"
        :value="size.heightScreenCm"
        @input="v => recompute('heightScreenCm', v)"
        suffix="cm"
      />
    </v-flex>
    <v-flex xs12 sm6 lg3>
      <v-text-field
        :disabled="working"
        label="Width on paper"
        type="number"
        :min="0"
        :step="0.1"
        :value="size.widthPaperCm"
        @input="v => recompute('widthPaperCm', v)"
        suffix="cm"
      />
    </v-flex>
    <v-flex xs12 sm6 lg3>
      <v-text-field
        :disabled="working"
        label="Height on paper"
        type="number"
        :min="0"
        :step="0.1"
        :value="size.heightPaperCm"
        @input="v => recompute('heightPaperCm', v)"
        suffix="cm"
      />
    </v-flex>

    <v-flex xs12 sm6 md4>
      <v-text-field
        :disabled="working"
        label="Width"
        type="number"
        :min="0"
        :step="1"
        :value="size.widthPx"
        @input="v => recompute('widthPx', v)"
        suffix="px"
      />
    </v-flex>
    <v-flex xs12 sm6 md4>
      <v-text-field
        :disabled="working"
        label="Height"
        type="number"
        :min="0"
        :step="1"
        :value="size.heightPx"
        @input="v => recompute('heightPx', v)"
        suffix="px"
      />
    </v-flex>

    <v-flex xs12 sm12 md4 mt-2>
      <v-btn
        :disabled="working"
        outline
        block
        color="primary"
        @click="$emit('render', { width: +size.widthPx, height: +size.heightPx, scale })"
      >
        Render image
      </v-btn>
    </v-flex>
  </v-layout>
</template>

<script>
import { mapGetters } from 'vuex'

const SCREEN_DPCM = 38
const PAPER_DPCM = 120

class ValuesToScale {
  constructor (width, height) {
    this.width = width
    this.height = height
  }

  widthScreenCm (v) {
    return this.widthPx(v * SCREEN_DPCM)
  }
  widthPaperCm (v) {
    return this.widthPx(v * PAPER_DPCM)
  }
  widthPx (v) {
    return v / this.width
  }

  heightScreenCm (v) {
    return this.heightPx(v * SCREEN_DPCM)
  }
  heightPaperCm (v) {
    return this.heightPx(v * PAPER_DPCM)
  }
  heightPx (v) {
    return v / this.height
  }
}

class ScaleValues {
  constructor (width, height) {
    this.width = width
    this.height = height
  }

  widthScreenCm (s) {
    return this.widthPx(s) / SCREEN_DPCM
  }
  widthPaperCm (s) {
    return this.widthPx(s) / PAPER_DPCM
  }
  widthPx (s) {
    return Math.ceil(s * this.width)
  }

  heightScreenCm (s) {
    return this.heightPx(s) / SCREEN_DPCM
  }
  heightPaperCm (s) {
    return this.heightPx(s) / PAPER_DPCM
  }
  heightPx (s) {
    return Math.ceil(s * this.height)
  }
}

class ValuesToString {
  constructor (precision) {
    this.precision = precision
  }

  widthScreenCm (v) {
    return v.toFixed(this.precision)
  }
  widthPaperCm (v) {
    return v.toFixed(this.precision)
  }
  widthPx (v) {
    return v.toFixed(0)
  }

  heightScreenCm (v) {
    return v.toFixed(this.precision)
  }
  heightPaperCm (v) {
    return v.toFixed(this.precision)
  }
  heightPx (v) {
    return v.toFixed(0)
  }
}

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
    size: {
      widthScreenCm: 0,
      widthPaperCm: 0,
      widthPx: 0,
      heightScreenCm: 0,
      heightPaperCm: 0,
      heightPx: 0
    }
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

    valuesToScale () {
      return new ValuesToScale(this.width, this.height)
    },
    scaleValues () {
      return new ScaleValues(this.width, this.height)
    },
    valuesToString () {
      return new ValuesToString(2)
    }
  },
  methods: {
    recompute (initiator, value) {
      const scale = this.valuesToScale[initiator](+value)
      Object.keys(this.size).forEach(key => {
        if (key === initiator) {
          this.size[key] = `${value}`
        } else {
          this.size[key] = this.valuesToString[key](
            this.scaleValues[key](scale)
          )
        }
      })
      this.scale = scale
    }
  },
  watch: {
    width () {
      this.recompute('widthPx', this.width, true)
    },
    height () {
      this.recompute('heightPx', this.height, true)
    }
  },
  mounted () {
    this.recompute('widthPx', this.width, true)
  }
}
</script>

<style scoped>
</style>
