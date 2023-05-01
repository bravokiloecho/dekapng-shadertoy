const inputElem = document.getElementById('canvas')

export const mouse = {
  x: 0,
  y: 0,
}

export const req = {
  id: undefined,
}

function setMousePosition(e) {
  const rect = inputElem.getBoundingClientRect()
  mouse.x = e.clientX / rect.width
  mouse.y = e.clientY / rect.height
}

export const requestFrame = (render) => {
  if (!req.id) {
    req.id = requestAnimationFrame(render)
  }
}

export const cancelFrame = () => {
  if (req.id) {
    cancelAnimationFrame(req.id)
    req.id = undefined
  }
}

export const setupMouseMove = () => {
  inputElem.addEventListener('mousemove', setMousePosition)

  inputElem.addEventListener(
    'touchmove',
    (e) => {
      e.preventDefault()
      setMousePosition(e.touches[0])
    },
    { passive: false }
  )
}
