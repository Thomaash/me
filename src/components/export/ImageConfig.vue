<template>
  <v-layout row wrap>
    <v-flex xs12 sm12>
      <v-switch
        v-model="dark"
        :disabled="disabled"
        label="Render in dark mode"
      />
    </v-flex>

    <v-flex xs12 sm4>
      <v-text-field
        ref="sizeWidthScreenCm"
        :disabled="disabled"
        :min="0"
        :step="0.1"
        :value="size.widthScreenCm"
        :error-messages="errors.size.widthScreenCm"
        :rules="[badNumberRule('sizeWidthScreenCm')]"
        label="Width on screen"
        type="number"
        suffix="cm"
        @input="(v) => recompute('widthScreenCm', v)"
      />
    </v-flex>
    <v-flex xs12 sm4>
      <v-text-field
        ref="sizeWidthPaperCm"
        :disabled="disabled"
        :min="0"
        :step="0.1"
        :value="size.widthPaperCm"
        :error-messages="errors.size.widthPaperCm"
        :rules="[badNumberRule('sizeWidthPaperCm')]"
        label="Width on paper"
        type="number"
        suffix="cm"
        @input="(v) => recompute('widthPaperCm', v)"
      />
    </v-flex>
    <v-flex xs12 sm4>
      <v-text-field
        ref="sizeWidthPx"
        :disabled="disabled"
        :min="1"
        :step="1"
        :value="size.widthPx"
        :error-messages="errors.size.widthPx"
        :rules="[badNumberRule('sizeWidthPx')]"
        label="Width"
        type="number"
        suffix="px"
        @input="(v) => recompute('widthPx', v)"
      />
    </v-flex>

    <v-flex xs12 sm4>
      <v-text-field
        ref="sizeHeightScreenCm"
        :disabled="disabled"
        :min="0"
        :step="0.1"
        :value="size.heightScreenCm"
        :error-messages="errors.size.heightScreenCm"
        :rules="[badNumberRule('sizeHeightScreenCm')]"
        label="Height on screen"
        type="number"
        suffix="cm"
        @input="(v) => recompute('heightScreenCm', v)"
      />
    </v-flex>
    <v-flex xs12 sm4>
      <v-text-field
        ref="sizeHeightPaperCm"
        :disabled="disabled"
        :min="0"
        :step="0.1"
        :value="size.heightPaperCm"
        :error-messages="errors.size.heightPaperCm"
        :rules="[badNumberRule('sizeHeightPaperCm')]"
        label="Height on paper"
        type="number"
        suffix="cm"
        @input="(v) => recompute('heightPaperCm', v)"
      />
    </v-flex>
    <v-flex xs12 sm4>
      <v-text-field
        ref="sizeHeightPx"
        :disabled="disabled"
        :min="1"
        :step="1"
        :value="size.heightPx"
        :error-messages="errors.size.heightPx"
        :rules="[badNumberRule('sizeHeightPx')]"
        label="Height"
        type="number"
        suffix="px"
        @input="(v) => recompute('heightPx', v)"
      />
    </v-flex>

    <v-flex xs12 sm12>
      <v-switch v-model="tiles" :disabled="disabled" label="Render as tiles" />
    </v-flex>

    <template v-if="tiles">
      <v-flex xs12 sm4>
        <v-text-field
          ref="sizeTileWidthPx"
          v-model="tileWidthPx"
          :disabled="disabled"
          :min="1"
          :step="1"
          :error-messages="errors.tileWidthPx"
          :rules="[badNumberRule('sizeTileWidthPx')]"
          label="The width of each tile"
          type="number"
          suffix="px"
        />
      </v-flex>
      <v-flex xs12 sm4>
        <v-text-field
          ref="sizeTileHeightPx"
          v-model="tileHeightPx"
          :disabled="disabled"
          :min="1"
          :step="1"
          :error-messages="errors.tileHeightPx"
          :rules="[badNumberRule('sizeTileHeightPx')]"
          label="The height of each tile"
          type="number"
          suffix="px"
        />
      </v-flex>

      <v-flex xs12 sm4>
        <v-text-field
          label="The number of tiles"
          readonly
          :disabled="disabled"
          :value="`${tilesWidthNumber}x${tilesHeightNumber} (${
            tilesWidthNumber * tilesHeightNumber
          })`"
        />
      </v-flex>
    </template>

    <v-flex xs12>
      <v-btn
        :disabled="disabled || invalid"
        outlined
        block
        color="primary"
        @click="render"
      >
        Render image
      </v-btn>
    </v-flex>
  </v-layout>
</template>

<script>
import { decimal, integer, minValue } from "@/validation/rules";
import errors from "@/validation/errors";
import { mapGetters } from "vuex";

const SCREEN_DPCM = 38;
const PAPER_DPCM = 120;

class ValuesToScale {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }

  widthScreenCm(v) {
    return this.widthPx(v * SCREEN_DPCM);
  }

  widthPaperCm(v) {
    return this.widthPx(v * PAPER_DPCM);
  }

  widthPx(v) {
    return v / this.width;
  }

  heightScreenCm(v) {
    return this.heightPx(v * SCREEN_DPCM);
  }

  heightPaperCm(v) {
    return this.heightPx(v * PAPER_DPCM);
  }

  heightPx(v) {
    return v / this.height;
  }
}

class ScaleValues {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }

  widthScreenCm(s) {
    return this.widthPx(s) / SCREEN_DPCM;
  }

  widthPaperCm(s) {
    return this.widthPx(s) / PAPER_DPCM;
  }

  widthPx(s) {
    return Math.ceil(s * this.width);
  }

  heightScreenCm(s) {
    return this.heightPx(s) / SCREEN_DPCM;
  }

  heightPaperCm(s) {
    return this.heightPx(s) / PAPER_DPCM;
  }

  heightPx(s) {
    return Math.ceil(s * this.height);
  }
}

class ValuesToString {
  constructor(precision) {
    this.precision = precision;
  }

  widthScreenCm(v) {
    return v.toFixed(this.precision);
  }

  widthPaperCm(v) {
    return v.toFixed(this.precision);
  }

  widthPx(v) {
    return v.toFixed(0);
  }

  heightScreenCm(v) {
    return v.toFixed(this.precision);
  }

  heightPaperCm(v) {
    return v.toFixed(this.precision);
  }

  heightPx(v) {
    return v.toFixed(0);
  }
}

export default {
  name: "ImageConfig",
  mixins: [errors],
  props: {
    working: {
      required: true,
      type: Boolean,
    },
  },
  data: () => ({
    scale: 1,
    dark: false,
    tiles: false,
    tileHeightPx: 256,
    tileWidthPx: 256,
    size: {
      widthScreenCm: 0,
      widthPaperCm: 0,
      widthPx: 0,
      heightScreenCm: 0,
      heightPaperCm: 0,
      heightPx: 0,
    },
  }),
  computed: {
    ...mapGetters("topology", ["boundingBox"]),

    disabled() {
      return this.working || this.width <= 0 || this.height <= 0;
    },
    invalid() {
      return (
        this.$v.tileHeightPx.$invalid ||
        this.$v.tileWidthPx.$invalid ||
        this.$v.size.heightPaperCm.$invalid ||
        this.$v.size.heightPx.$invalid ||
        this.$v.size.heightScreenCm.$invalid ||
        this.$v.size.widthPaperCm.$invalid ||
        this.$v.size.widthPx.$invalid ||
        this.$v.size.widthScreenCm.$invalid
      );
    },

    width() {
      return this.boundingBox().width;
    },
    height() {
      return this.boundingBox().height;
    },

    tilesWidthNumber() {
      return Math.max(1, Math.ceil(this.size.widthPx / this.tileWidthPx));
    },
    tilesHeightNumber() {
      return Math.max(1, Math.ceil(this.size.heightPx / this.tileHeightPx));
    },

    valuesToScale() {
      return new ValuesToScale(this.width, this.height);
    },
    scaleValues() {
      return new ScaleValues(this.width, this.height);
    },
    valuesToString() {
      return new ValuesToString(2);
    },
  },
  watch: {
    width() {
      this.recomputeAll(1);
    },
    height() {
      this.recomputeAll(1);
    },
  },
  mounted() {
    this.recomputeAll(1);
  },
  methods: {
    recompute(initiator, value) {
      const scale = this.valuesToScale[initiator](+value);
      Object.keys(this.size).forEach((key) => {
        if (key === initiator) {
          this.size[key] = `${value}`;
        } else {
          this.size[key] = this.valuesToString[key](
            this.scaleValues[key](scale)
          );
        }
      });
      this.scale = scale;
    },
    recomputeAll(scale) {
      Object.keys(this.size).forEach((key) => {
        this.size[key] = this.valuesToString[key](this.scaleValues[key](scale));
      });
    },
    render() {
      this.$emit("render", {
        size: {
          width: +this.size.widthPx,
          height: +this.size.heightPx,
          scale: this.scale,
        },
        tiles: this.tiles
          ? {
              width: this.tileWidthPx,
              height: this.tileHeightPx,
            }
          : false,
        dark: this.dark,
      });
    },
  },
  validations: {
    tileHeightPx: { integer, minValue: minValue(1) },
    tileWidthPx: { integer, minValue: minValue(1) },
    size: {
      heightPaperCm: { decimal, minValue: minValue(0) },
      heightPx: { integer, minValue: minValue(1) },
      heightScreenCm: { decimal, minValue: minValue(0) },
      widthPaperCm: { decimal, minValue: minValue(0) },
      widthPx: { integer, minValue: minValue(1) },
      widthScreenCm: { decimal, minValue: minValue(0) },
    },
  },
};
</script>
