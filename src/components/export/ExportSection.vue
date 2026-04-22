<template>
  <v-row>
    <v-col cols="12" sm="4">
      <v-btn
        :disabled="working"
        variant="outlined"
        block
        color="primary"
        @click="downloadJSON"
        >JSON</v-btn
      >
    </v-col>
    <v-col cols="12" sm="4">
      <v-btn
        :disabled="working"
        variant="outlined"
        block
        color="primary"
        @click="downloadScript"
        >Python 2 script</v-btn
      >
    </v-col>
    <v-col cols="12" sm="4">
      <v-btn
        :disabled="working"
        variant="outlined"
        block
        color="primary"
        @click="downloadAddressingPlan"
        >Addressing plan</v-btn
      >
    </v-col>

    <v-col cols="12" class="pt-4">
      <h3>Image</h3>
    </v-col>

    <v-col cols="12">
      <ImageConfig :working="working" @render="downloadImage" />
    </v-col>

    <div class="w-0 h-0 overflow-hidden">
      <VisCanvas
        v-if="visCanvasOn"
        ref="visCanvas"
        :dark="dark"
        @ready="visCanvasResolve"
      />
    </div>
  </v-row>
</template>

<script setup>
import { ref, computed, nextTick } from "vue";
import AddressingPlan from "@/builder/AddressingPlan";
import Builder from "@/builder";
import VisCanvas from "@/components/vis/VisCanvas.vue";
import exporter from "@/exporter";

import ImageConfig from "./ImageConfig.vue";
import { useTopologyStore } from "@/composables/useTopologyStore";

const {
  data,
  working: storeWorking,
  setWorking,
  setAlert,
  clearAlert,
} = useTopologyStore();
const emit = defineEmits(["log"]);

const visCanvas = ref(null);
const visCanvasOn = ref(false);
const visCanvasResolve = ref(() => {});
const dark = ref(false);

const working = computed({
  get() {
    return !!storeWorking.value;
  },
  set(value) {
    if (value === true) {
      clearAlert();
    }
    setWorking({ working: value });
  },
});

function download(filename, mimeOrHref, fileData) {
  const href =
    mimeOrHref && fileData
      ? `data:${mimeOrHref},${encodeURIComponent(fileData)}`
      : mimeOrHref;

  const element = document.createElement("a");
  element.setAttribute("href", href);
  element.setAttribute("download", filename);
  element.style.display = "none";

  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

function showAlert(type, text) {
  setAlert({ type, text });
}

function getFilename(extension) {
  return `${data.value.projectName || "mininet_network"}.${extension}`;
}

function downloadJSON() {
  try {
    working.value = true;
    emit("log", []);

    const json = JSON.stringify(exporter.exportData(data.value), undefined, 4);
    showAlert("success", "Successfully exported.");
    download(getFilename("json"), "application/json;charset=utf-8", json);
  } catch (error) {
    console.error(error);
    showAlert("error", "Export failed.");
  } finally {
    working.value = false;
  }
}

function downloadScript() {
  try {
    working.value = true;
    emit("log", []);

    const builder = new Builder(exporter.exportData(data.value));
    emit("log", builder.log);
    const script = builder.build();
    showAlert("success", "Script built.");
    download(getFilename("py"), "text/x-python;charset=utf-8", script);
  } catch (error) {
    console.error(error);
    showAlert("error", "Script was not built.");
  } finally {
    working.value = false;
  }
}

async function renderImage(size, onBlob) {
  try {
    await new Promise((resolve) => {
      visCanvasResolve.value = resolve;
      visCanvasOn.value = true;
    });

    // The timeout prevents glitches like missing node icons, especially in Firefox.
    await new Promise((resolve) => window.setTimeout(resolve, 100));

    return await visCanvas.value.toTileBlobs({
      ...size,
      onBlob,
    });
  } finally {
    visCanvasOn.value = false;
  }
}

async function downloadImage({ size, tiles, dark: darkParam }) {
  dark.value = darkParam;

  await nextTick();

  const sizeString = tiles
    ? `${(
        Math.ceil(size.width / tiles.width) *
        Math.ceil(size.height / tiles.height)
      ).toLocaleString()} tiles of ${tiles.width.toLocaleString()}\xa0\xd7\xa0${tiles.height.toLocaleString()}\xa0px (${(
        (tiles.width * tiles.height) /
        1e6
      ).toLocaleString()}\xa0Mpx) each`
    : `${size.width.toLocaleString()}\xa0\xd7\xa0${size.height.toLocaleString()}\xa0px (${(
        (size.width * size.height) /
        1e6
      ).toLocaleString()}\xa0Mpx)`;

  try {
    working.value = true;
    emit("log", []);

    showAlert(
      "info",
      `Rendering image ${
        tiles ? "as tiles" : "as single picture"
      }, size: ${sizeString}.`,
    );

    await renderImage(
      {
        canvasHeight: size.height,
        canvasWidth: size.width,
        scale: size.scale,
        tileHeight: tiles ? tiles.height : size.height,
        tileWidth: tiles ? tiles.width : size.width,
      },
      async (blob, { col, cols, doneTiles, row, rows, totalTiles }) => {
        const tileSuffixDigits = tiles
          ? Math.ceil(Math.log10(Math.max(cols, rows)))
          : 0;

        const tileSuffix =
          cols === 1 && rows === 1
            ? null
            : `${`${col}`.padStart(
                tileSuffixDigits,
                "0",
              )}x${`${row}`.padStart(tileSuffixDigits, "0")}`;

        const url = URL.createObjectURL(blob);
        try {
          await new Promise((resolve) => setTimeout(resolve, 50));
          download(
            getFilename([tileSuffix, "png"].filter((v) => v != null).join(".")),
            url,
          );
          await new Promise((resolve) => setTimeout(resolve, 50));
          setWorking({
            curr: doneTiles,
            max: totalTiles,
          });
        } finally {
          URL.revokeObjectURL(url);
        }
      },
    );

    showAlert("success", `Image rendered, size: ${sizeString}.`);
  } catch (error) {
    console.error(error);
    showAlert(
      "error",
      `Image rendering failed. Probably too large image for this browser, size: ${sizeString}. You can try smaller size or rendering it as tiles.`,
    );
  } finally {
    working.value = false;
  }
}

function downloadAddressingPlan() {
  try {
    working.value = true;
    emit("log", []);

    const ap = new AddressingPlan(exporter.exportData(data.value));
    ap.build();
    ap.savePDF(data.value.projectName || "Mininet Network", getFilename("pdf"));

    showAlert("success", "Addressing plan built.");
  } catch (error) {
    console.error(error);
    showAlert("error", "Addressing plan was not built.");
  } finally {
    working.value = false;
  }
}

defineExpose({ getFilename, showAlert });
</script>
