import * as dekapng from 'dekapng'

import { wait } from './utils.js'

const saveData = (function () {
  const a = document.createElement('a')
  document.body.appendChild(a)
  a.style.display = 'none'
  return function saveData(blob, fileName) {
    const url = window.URL.createObjectURL(blob)
    a.href = url
    a.download = fileName
    a.click()
  }
})()

const makeBigPng = async ({ drawArea, width, height }) => {
  const pngRGBAWriter = new dekapng.PNGRGBAWriter(width, height)

  const chunkWidth = 1000
  const chunkHeight = 100

  const progress = document.querySelector('#progress')
  function setProgress(p) {
    if (!progress) return
    progress.textContent = `${(p * 100) | 0}%`
  }

  setProgress(0)

  for (let chunkY = 0; chunkY < height; chunkY += chunkHeight) {
    const rowChunks = []
    const localHeight = Math.min(chunkHeight, height - chunkY)

    for (let chunkX = 0; chunkX < width; chunkX += chunkWidth) {
      const localWidth = Math.min(chunkWidth, width - chunkX)

      const data = drawArea(
        width,
        height,
        chunkX,
        chunkY,
        localWidth,
        localHeight
      )
      if (!data) {
        return
      }
      rowChunks.push(data)
    }

    for (let row = 0; row < localHeight; ++row) {
      rowChunks.forEach((chunk) => {
        const rowSize = chunk.width * 4
        const chunkOffset = rowSize * row
        pngRGBAWriter.addPixels(chunk.data, chunkOffset, chunk.width)
      })
    }

    setProgress(Math.min(1, (chunkY + chunkHeight) / height))
    await wait()
  }

  return pngRGBAWriter.finishAndGetBlob()
}

const getDrawArea =
  ({ gl, draw }) =>
  (width, height, chunkX, chunkY, chunkWidth, chunkHeight) => {
    gl.canvas.width = chunkWidth
    gl.canvas.height = chunkHeight
    gl.viewport(0, 0, chunkWidth, chunkHeight)
    const offsetX = chunkX
    const offsetY = height - chunkY - 1
    draw(width, height, offsetX, offsetY, chunkWidth, chunkHeight)

    const data = new Uint8Array(chunkWidth * chunkHeight * 4)
    gl.readPixels(
      0,
      0,
      chunkWidth,
      chunkHeight,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      data
    )

    // swap lines (should probably just fix code in makeBigPng to read backward
    const lineSize = chunkWidth * 4
    const line = new Uint8Array(lineSize)
    const numLines = (chunkHeight / 2) | 0
    for (let i = 0; i < numLines; ++i) {
      const topOffset = lineSize * i
      const bottomOffset = lineSize * (chunkHeight - i - 1)
      line.set(data.slice(topOffset, topOffset + lineSize), 0)
      data.set(data.slice(bottomOffset, bottomOffset + lineSize), topOffset)
      data.set(line, bottomOffset)
    }
    return {
      width: chunkWidth,
      height: chunkHeight,
      data: data,
    }
  }

export const getImageExporter =
  ({ gl, draw, title }) =>
  (width, height) => {
    // Form the drawArea function
    const drawArea = getDrawArea({
      gl,
      draw,
    })

    return new Promise((resolve) => {
      makeBigPng({ drawArea, width, height }).then((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          saveData(blob, `${title}-${width}x${height}.png`)
        }
        resolve()
      })
    })
  }

export const exportImage = (imageExporter, upscaleAmount) => {
  const canvas = document.querySelector('#canvas')
  const width = canvas.width
  const height = canvas.height
  return imageExporter(width * upscaleAmount, height * upscaleAmount)
}
