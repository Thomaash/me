import Jimp from 'jimp/es'

async function blobToImage (blob) {
  return Jimp.read(await new Response(blob).arrayBuffer())
}
async function imageToBlob (image) {
  return new Blob([
    await image.getBufferAsync(Jimp.MIME_PNG)
  ], { type: image.getMIME() })
}

class ImageJoiner {
  constructor (width, height, tileSize, cols, rows) {
    this.width = width
    this.height = height
    this.cols = cols
    this.rows = rows
    this.tileSize = tileSize
    this.tilesAdded = 0

    this.ready = (async (resolve, reject) => {
      try {
        this.image = await new Jimp(this.width, this.height)
        this.image.rgba(true) // Aplha is a waste of memory, but it doesn't work without it
        this.image.filterType(4)
        this.image.deflateLevel(9)
        this.image.deflateStrategy(0)
        resolve()
      } catch (error) {
        reject(error)
      }
    })()
  }

  async addTile (blob, col, row) {
    const x = col * this.tileSize
    const y = row * this.tileSize

    this.image.composite(await blobToImage(blob), x, y)
    ++this.tilesAdded
  }

  async toBlob () {
    return imageToBlob(this.image)
  }

  get done () {
    return this.tilesAdded === this.cols * this.rows
  }
}

const msgHandler = {
  joiner: null,
  async 'init' ({ width, height, tileSize, cols, rows }) {
    this.joiner = new ImageJoiner(width, height, tileSize, cols, rows)
    await this.joiner.ready
    self.postMessage({
      progress: 0
    })
  },
  async 'add-tile' ({ blob, col, row }) {
    await this.joiner.ready
    await this.joiner.addTile(blob, col, row)

    self.postMessage({
      progress: this.joiner.tilesAdded / (this.joiner.cols * this.joiner.rows + 1)
    })
    if (this.joiner.done) {
      self.postMessage({ progress: 1, blob: await this.joiner.toBlob() })
    }
  }
}
self.addEventListener('message', event => {
  msgHandler[event.data.type](event.data.payload).catch(error => {
    console.error(error)
    self.postMessage({ progress: 1, errorMsg: error.message })
  })
})
