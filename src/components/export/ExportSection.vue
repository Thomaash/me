<template>
  <v-layout wrap>
    <v-flex xs12 sm4>
      <v-btn
        :disabled="working"
        outlined
        block
        color="primary"
        @click="downloadJSON"
        >JSON</v-btn
      >
    </v-flex>
    <v-flex xs12 sm4>
      <v-btn
        :disabled="working"
        outlined
        block
        color="primary"
        @click="downloadScript"
        >Python 2 script</v-btn
      >
    </v-flex>
    <v-flex xs12 sm4>
      <v-btn
        :disabled="working"
        outlined
        block
        color="primary"
        @click="downloadAddressingPlan"
        >Addressing plan</v-btn
      >
    </v-flex>

    <v-flex xs12 pt-4>
      <h3>Image</h3>
    </v-flex>

    <v-flex xs12>
      <ImageConfig :working="working" @render="downloadImage" />
    </v-flex>

    <div style="height: 0px; width: 0px; overflow: hidden">
      <VisCanvas
        v-if="visCanvasOn"
        ref="visCanvas"
        :dark="dark"
        @ready="visCanvasResolve"
      />
    </div>
  </v-layout>
</template>

<script>
import AddressingPlan from "@/builder/AddressingPlan";
import Builder from "@/builder";
import VisCanvas from "@/components/vis/VisCanvas";
import exporter from "@/exporter";
import { mapGetters } from "vuex";

import ImageConfig from "./ImageConfig";

function download(filename, mimeOrHref, data) {
  const href =
    mimeOrHref && data
      ? `data:${mimeOrHref},${encodeURIComponent(data)}`
      : mimeOrHref;

  const element = document.createElement("a");
  element.setAttribute("href", href);
  element.setAttribute("download", filename);
  element.style.display = "none";

  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

export default {
  name: "ExportSection",
  components: { ImageConfig, VisCanvas },
  data: () => ({
    visCanvasOn: false,
    visCanvasResolve: () => {},
    dark: false,
  }),
  computed: {
    ...mapGetters("topology", ["data"]),
    working: {
      get() {
        return !!this.$store.state.working;
      },
      set(value) {
        if (value === true) {
          this.$store.commit("clearAlert");
        }
        this.$store.commit("setWorking", { working: value });
      },
    },
  },
  methods: {
    showAlert(type, text) {
      this.$store.commit("setAlert", { type, text });
    },
    downloadJSON() {
      try {
        this.working = true;
        this.$emit("log", []);

        const json = JSON.stringify(
          exporter.exportData(this.data),
          undefined,
          4
        );
        this.showAlert("success", "Successfully exported.");
        download(
          this.getFilename("json"),
          "application/json;charset=utf-8",
          json
        );
      } catch (error) {
        console.error(error);
        this.showAlert("error", "Export failed.");
      } finally {
        this.working = false;
      }
    },
    downloadScript() {
      try {
        this.working = true;
        this.$emit("log", []);

        const builder = new Builder(exporter.exportData(this.data));
        this.$emit("log", builder.log);
        const script = builder.build();
        this.showAlert("success", "Script built.");
        download(this.getFilename("py"), "text/x-python;charset=utf-8", script);
      } catch (error) {
        console.error(error);
        this.showAlert("error", "Script was not built.");
      } finally {
        this.working = false;
      }
    },
    async downloadImage({ size, tiles, dark }) {
      this.dark = dark;

      await this.$nextTick();

      const sizeString = tiles
        ? `${(
            Math.ceil(size.width / tiles.width) *
            Math.ceil(size.height / tiles.height)
          ).toLocaleString()} tiles of ${tiles.width.toLocaleString()}\xa0×\xa0${tiles.height.toLocaleString()}\xa0px (${(
            (tiles.width * tiles.height) /
            1e6
          ).toLocaleString()}\xa0Mpx) each`
        : `${size.width.toLocaleString()}\xa0×\xa0${size.height.toLocaleString()}\xa0px (${(
            (size.width * size.height) /
            1e6
          ).toLocaleString()}\xa0Mpx)`;

      try {
        this.working = true;
        this.$emit("log", []);

        this.showAlert(
          "info",
          `Rendering image ${
            tiles ? "as tiles" : "as single picture"
          }, size: ${sizeString}.`
        );

        await this.renderImage(
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
                    "0"
                  )}x${`${row}`.padStart(tileSuffixDigits, "0")}`;

            const url = URL.createObjectURL(blob);
            try {
              await new Promise((resolve) => setTimeout(resolve, 50));
              download(
                this.getFilename(
                  [tileSuffix, "png"].filter((v) => v != null).join(".")
                ),
                url
              );
              await new Promise((resolve) => setTimeout(resolve, 50));
              this.$store.commit("setWorking", {
                curr: doneTiles,
                max: totalTiles,
              });
            } finally {
              URL.revokeObjectURL(url);
            }
          }
        );

        this.showAlert("success", `Image rendered, size: ${sizeString}.`);
      } catch (error) {
        console.error(error);
        this.showAlert(
          "error",
          `Image rendering failed. Probably too large image for this browser, size: ${sizeString}. You can try smaller size or rendering it as tiles.`
        );
      } finally {
        this.working = false;
      }
    },
    async renderImage(size, onBlob) {
      try {
        await new Promise((resolve) => {
          this.visCanvasResolve = resolve;
          this.visCanvasOn = true;
        });

        // The timeout prevents glitches like missing node icons, especially in Firefox.
        await new Promise((resolve) => window.setTimeout(resolve, 100));

        return await this.$refs.visCanvas.toTileBlobs({
          ...size,
          onBlob,
        });
      } finally {
        this.visCanvasOn = false;
      }
    },
    downloadAddressingPlan() {
      try {
        this.working = true;
        this.$emit("log", []);

        const ap = new AddressingPlan(exporter.exportData(this.data));
        ap.build();
        ap.savePDF(
          this.data.projectName || "Mininet Network",
          this.getFilename("pdf")
        );

        this.showAlert("success", "Addressing plan built.");
      } catch (error) {
        console.error(error);
        this.showAlert("error", "Addressing plan was not built.");
      } finally {
        this.working = false;
      }
    },
    getFilename(extension) {
      return `${this.data.projectName || "mininet_network"}.${extension}`;
    },
  },
};
</script>
