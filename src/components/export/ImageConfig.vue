<template>
  <v-row>
    <v-col cols="12">
      <v-switch
        v-model="dark"
        color="primary"
        :disabled="disabled"
        label="Render in dark mode"
      />
    </v-col>

    <v-col cols="12" sm="4">
      <v-text-field
        ref="sizeWidthScreenCm"
        :disabled="disabled"
        :min="0"
        :step="0.1"
        :model-value="size.widthScreenCm"
        :rules="[
          validators.decimal(size.widthScreenCm),
          validators.minValue(0)(size.widthScreenCm),
        ]"
        label="Width on screen"
        type="number"
        suffix="cm"
        @update:model-value="(v) => recompute('widthScreenCm', v)"
      />
    </v-col>
    <v-col cols="12" sm="4">
      <v-text-field
        ref="sizeWidthPaperCm"
        :disabled="disabled"
        :min="0"
        :step="0.1"
        :model-value="size.widthPaperCm"
        :rules="[
          validators.decimal(size.widthPaperCm),
          validators.minValue(0)(size.widthPaperCm),
        ]"
        label="Width on paper"
        type="number"
        suffix="cm"
        @update:model-value="(v) => recompute('widthPaperCm', v)"
      />
    </v-col>
    <v-col cols="12" sm="4">
      <v-text-field
        ref="sizeWidthPx"
        :disabled="disabled"
        :min="1"
        :step="1"
        :model-value="size.widthPx"
        :rules="[
          validators.integer(size.widthPx),
          validators.minValue(1)(size.widthPx),
        ]"
        label="Width"
        type="number"
        suffix="px"
        @update:model-value="(v) => recompute('widthPx', v)"
      />
    </v-col>

    <v-col cols="12" sm="4">
      <v-text-field
        ref="sizeHeightScreenCm"
        :disabled="disabled"
        :min="0"
        :step="0.1"
        :model-value="size.heightScreenCm"
        :rules="[
          validators.decimal(size.heightScreenCm),
          validators.minValue(0)(size.heightScreenCm),
        ]"
        label="Height on screen"
        type="number"
        suffix="cm"
        @update:model-value="(v) => recompute('heightScreenCm', v)"
      />
    </v-col>
    <v-col cols="12" sm="4">
      <v-text-field
        ref="sizeHeightPaperCm"
        :disabled="disabled"
        :min="0"
        :step="0.1"
        :model-value="size.heightPaperCm"
        :rules="[
          validators.decimal(size.heightPaperCm),
          validators.minValue(0)(size.heightPaperCm),
        ]"
        label="Height on paper"
        type="number"
        suffix="cm"
        @update:model-value="(v) => recompute('heightPaperCm', v)"
      />
    </v-col>
    <v-col cols="12" sm="4">
      <v-text-field
        ref="sizeHeightPx"
        :disabled="disabled"
        :min="1"
        :step="1"
        :model-value="size.heightPx"
        :rules="[
          validators.integer(size.heightPx),
          validators.minValue(1)(size.heightPx),
        ]"
        label="Height"
        type="number"
        suffix="px"
        @update:model-value="(v) => recompute('heightPx', v)"
      />
    </v-col>

    <v-col cols="12">
      <v-switch
        v-model="tiles"
        color="primary"
        :disabled="disabled"
        label="Render as tiles"
      />
    </v-col>

    <template v-if="tiles">
      <v-col cols="12" sm="4">
        <v-text-field
          ref="sizeTileWidthPx"
          v-model="tileWidthPx"
          :disabled="disabled"
          :min="1"
          :step="1"
          :rules="[
            validators.integer(tileWidthPx),
            validators.minValue(1)(tileWidthPx),
          ]"
          label="The width of each tile"
          type="number"
          suffix="px"
        />
      </v-col>
      <v-col cols="12" sm="4">
        <v-text-field
          ref="sizeTileHeightPx"
          v-model="tileHeightPx"
          :disabled="disabled"
          :min="1"
          :step="1"
          :rules="[
            validators.integer(tileHeightPx),
            validators.minValue(1)(tileHeightPx),
          ]"
          label="The height of each tile"
          type="number"
          suffix="px"
        />
      </v-col>

      <v-col cols="12" sm="4">
        <v-text-field
          label="The number of tiles"
          readonly
          :disabled="disabled"
          :model-value="`${tilesWidthNumber}x${tilesHeightNumber} (${
            tilesWidthNumber * tilesHeightNumber
          })`"
        />
      </v-col>
    </template>

    <v-col cols="12">
      <v-btn
        :disabled="disabled"
        variant="outlined"
        block
        color="primary"
        @click="render"
      >
        Render image
      </v-btn>
    </v-col>
  </v-row>
</template>

<script>
import { decimal, integer, minValue } from "@/validation/rules";
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
  props: {
    working: {
      required: true,
      type: Boolean,
    },
  },
  emits: ["render"],
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
    validators: {
      decimal,
      integer,
      minValue,
    },
  }),
  computed: {
    ...mapGetters("topology", ["boundingBox"]),

    disabled() {
      return this.working || this.width <= 0 || this.height <= 0;
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
      const scale = this.valuesToScale[initiator](Number(value));
      Object.keys(this.size).forEach((key) => {
        if (key === initiator) {
          this.size[key] = Number(value);
        } else {
          this.size[key] = Number(
            this.valuesToString[key](this.scaleValues[key](scale)),
          );
        }
      });
      this.scale = scale;
    },
    recomputeAll(scale) {
      Object.keys(this.size).forEach((key) => {
        this.size[key] = Number(
          this.valuesToString[key](this.scaleValues[key](scale)),
        );
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
};
</script>
