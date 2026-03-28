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
          validators.decimal(),
          validators.minValue(0),
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
          validators.decimal(),
          validators.minValue(0),
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
          validators.integer(),
          validators.minValue(1),
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
          validators.decimal(),
          validators.minValue(0),
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
          validators.decimal(),
          validators.minValue(0),
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
          validators.integer(),
          validators.minValue(1),
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
            validators.integer(),
            validators.minValue(1),
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
            validators.integer(),
            validators.minValue(1),
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

<script setup>
defineOptions({ name: "ImageConfig" });

import { ref, reactive, computed, watch, onMounted } from "vue";
import { decimal, integer, minValue } from "@/validation/rules";
import { useTopologyStore } from "@/composables/useTopologyStore";

const SCREEN_DPCM = 38;
const PAPER_DPCM = 120;

function createValuesToScale(w, h) {
  const widthPx = (v) => v / w;
  const heightPx = (v) => v / h;
  return {
    widthScreenCm: (v) => widthPx(v * SCREEN_DPCM),
    widthPaperCm: (v) => widthPx(v * PAPER_DPCM),
    widthPx,
    heightScreenCm: (v) => heightPx(v * SCREEN_DPCM),
    heightPaperCm: (v) => heightPx(v * PAPER_DPCM),
    heightPx,
  };
}

function createScaleValues(w, h) {
  const widthPx = (s) => Math.ceil(s * w);
  const heightPx = (s) => Math.ceil(s * h);
  return {
    widthScreenCm: (s) => widthPx(s) / SCREEN_DPCM,
    widthPaperCm: (s) => widthPx(s) / PAPER_DPCM,
    widthPx,
    heightScreenCm: (s) => heightPx(s) / SCREEN_DPCM,
    heightPaperCm: (s) => heightPx(s) / PAPER_DPCM,
    heightPx,
  };
}

function createValuesToString(precision) {
  const fix = (v) => v.toFixed(precision);
  const fixZero = (v) => v.toFixed(0);
  return {
    widthScreenCm: fix,
    widthPaperCm: fix,
    widthPx: fixZero,
    heightScreenCm: fix,
    heightPaperCm: fix,
    heightPx: fixZero,
  };
}

const props = defineProps({
  working: {
    required: true,
    type: Boolean,
  },
});

const emit = defineEmits(["render"]);

const { boundingBox } = useTopologyStore();

const scale = ref(1);
const dark = ref(false);
const tiles = ref(false);
const tileHeightPx = ref(256);
const tileWidthPx = ref(256);
const size = reactive({
  widthScreenCm: 0,
  widthPaperCm: 0,
  widthPx: 0,
  heightScreenCm: 0,
  heightPaperCm: 0,
  heightPx: 0,
});
const validators = { decimal, integer, minValue };

const width = computed(() => boundingBox.value().width);
const height = computed(() => boundingBox.value().height);

const disabled = computed(
  () => props.working || width.value <= 0 || height.value <= 0,
);

const tilesWidthNumber = computed(() =>
  Math.max(1, Math.ceil(size.widthPx / tileWidthPx.value)),
);
const tilesHeightNumber = computed(() =>
  Math.max(1, Math.ceil(size.heightPx / tileHeightPx.value)),
);

const valuesToScale = computed(() =>
  createValuesToScale(width.value, height.value),
);
const scaleValues = computed(() =>
  createScaleValues(width.value, height.value),
);
const valuesToString = computed(() => createValuesToString(2));

function recompute(initiator, value) {
  const s = valuesToScale.value[initiator](Number(value));
  Object.keys(size).forEach((key) => {
    if (key === initiator) {
      size[key] = Number(value);
    } else {
      size[key] = Number(
        valuesToString.value[key](scaleValues.value[key](s)),
      );
    }
  });
  scale.value = s;
}

function recomputeAll(s) {
  Object.keys(size).forEach((key) => {
    size[key] = Number(valuesToString.value[key](scaleValues.value[key](s)));
  });
}

function render() {
  emit("render", {
    size: {
      width: +size.widthPx,
      height: +size.heightPx,
      scale: scale.value,
    },
    tiles: tiles.value
      ? {
          width: tileWidthPx.value,
          height: tileHeightPx.value,
        }
      : false,
    dark: dark.value,
  });
}

watch(width, () => recomputeAll(1));
watch(height, () => recomputeAll(1));

onMounted(() => recomputeAll(1));
</script>
