import * as twgl from 'twgl.js'

import vert from './vert.glsl'
import frag0 from './frag0.glsl'
import frag1 from './frag1.glsl'

import * as UI from './ui.js'
// import * as UTILS from './utils.js'

// import image from './gfx/square.jpg'

import { getImageExporter, exportImage } from './exportImage'

function main() {
  const canvas = document.querySelector('#canvas')
  const gl = canvas.getContext('webgl2', { antialias: false })
  if (!gl) {
    return
  }

  const vs = vert
  const fs0 = frag0
  const fs1 = frag1
  const programInfo0 = twgl.createProgramInfo(gl, [vs, fs0])
  const programInfo1 = twgl.createProgramInfo(gl, [vs, fs1])

  const arrays = {
    position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
  }

  // Fill canvas to screen
  twgl.resizeCanvasToDisplaySize(gl.canvas)

  // START FBO
  const fboAttachments = undefined
  const fbo = twgl.createFramebufferInfo(
    gl,
    fboAttachments,
    gl.canvas.width,
    gl.canvas.height
  )

  const bufferInfo0 = twgl.createBufferInfoFromArrays(gl, arrays)

  // fbo initialization
  gl.useProgram(programInfo0.program)
  twgl.setBuffersAndAttributes(gl, programInfo0, bufferInfo0)
  twgl.bindFramebufferInfo(gl, fbo)
  twgl.drawBufferInfo(gl, bufferInfo0)

  const widthOrig = gl.canvas.width
  const heightOrig = gl.canvas.height

  const bufferInfo1 = twgl.createBufferInfoFromArrays(gl, arrays)

  let frame = 0
  const ZOOM = 1

  const draw = (
    width,
    height,
    offsetX = 0,
    offsetY = 0,
    chunkWidth,
    chunkHeight
  ) => {
    // First pass
    const uniforms0 = {
      iDekaPngOffset: [offsetX, offsetY],
      iTime: frame,
      iResolution: [width, height],
      iSampleRate: 44100,
    }
    const fboWidth = chunkWidth || width
    const fboHeight = chunkHeight || height
    twgl.resizeFramebufferInfo(gl, fbo, fboAttachments, fboWidth, fboHeight)
    gl.useProgram(programInfo0.program)
    twgl.setBuffersAndAttributes(gl, programInfo0, bufferInfo0)
    twgl.setUniforms(programInfo0, uniforms0)
    twgl.bindFramebufferInfo(gl, fbo)
    twgl.drawBufferInfo(gl, bufferInfo0)
    // Second pass
    const uniforms1 = {
      iDekaPngOffset: [offsetX, offsetY],
      iTime: frame,
      iResolution: [width, height],
      iChannel0: fbo.attachments[0],
    }
    gl.useProgram(programInfo1.program)
    twgl.setBuffersAndAttributes(gl, programInfo1, bufferInfo1)
    twgl.setUniforms(programInfo1, uniforms1)
    twgl.bindFramebufferInfo(gl, null)
    twgl.drawBufferInfo(gl, bufferInfo1)
    console.log('width', width)
    console.log('height', height)
    console.log('offsetX', offsetX)
    console.log('offsetY', offsetY)
    console.log('widthOrig', widthOrig)
    console.log('heightOrig', heightOrig)
    console.log('chunkWidth', chunkWidth)
    console.log('chunkHeight', chunkHeight)
    console.log('fboWidth', fboWidth)
    console.log('fboHeight', fboHeight)
    console.log('*****')
  }

  const render = () => {
    UI.req.id = undefined

    twgl.resizeCanvasToDisplaySize(gl.canvas)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

    draw(gl.canvas.width, gl.canvas.height)

    frame += 1

    // UI.requestFrame(render)
  }

  UI.requestFrame(render)

  // SETUP IMAGE EXPORTER
  const ImageExporter = getImageExporter({
    gl,
    draw,
    title: 'Deka Test',
  })

  // export image on P keypress
  document.addEventListener('keydown', async (e) => {
    if (e.key === 'p') {
      UI.cancelFrame()
      await exportImage(ImageExporter, ZOOM)
      UI.requestFrame(render)
    }
  })
}

main()
