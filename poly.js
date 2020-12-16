const canvas = document.getElementById('canvas')

function getCursorPosition(canvas, event) {
  const rect = canvas.getBoundingClientRect()
  let x = event.clientX - rect.left
  let y = event.clientY - rect.top

  const t = ctx.getTransform()

  // Adjust for translate (moving)
  x = x - t.e
  y = y - t.f

  // Adjust for scaling
  x = x * t.a
  y = y * t.d

  // TODO: adjust for skewing (with trig) I'm not using skewing yet though.

  const newEvent = new CustomEvent('canvasclicked', {detail: {x: x, y: y}})
  canvas.dispatchEvent(newEvent)
}


canvas.addEventListener('mousedown', (e) => {
  getCursorPosition(canvas, e)
})

// Used as a reference
const width = parseInt(canvas.width)
const height = parseInt(canvas.height)

const ctx = canvas.getContext('2d')

// Perhaps using paths like this is inefficient?
function line(x1, y1, x2, y2) {
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
}

function ellipseFill(x, y, w, h) {
  ctx.beginPath()
  ctx.ellipse(x, y, w, h || w, 0, 0, 2*Math.PI)
  ctx.fill()
}

function dot(x, y) {
  const DOT_SIZE = 3
  ellipseFill(x, y, DOT_SIZE)
}

// My use of xScale, yScale is bad style, but I don't know how to
// Scale the coordinate grid without scaling dot sizes as well.
// TODO: Use xScale, yScale globally, and in my helpers so I can scale
//       the coordinate grid without changing sizes.

function scatter(xs, ys, xScale, yScale) {
  if (xs.length !== ys.length) {
    throw `xs.length(${xs.length}) != ys.length(${ys.length})`
  }
  xScale = xScale || 1
  yScale = yScale || 1

  for (let i = 0; i < xs.length; i++) {
    dot(xs[i] * xScale, ys[i] * yScale)
  }
}

// TODO: Fix double draw of some lines.
function plot(xs, ys, xScale, yScale) {
  if (xs.length !== ys.length) {
    throw `xs.length(${xs.length}) != ys.length(${ys.length})`
  }
  xScale = xScale || 1
  yScale = yScale || 1

  ctx.beginPath()
  ctx.moveTo(xs[0]*xScale, ys[0]*yScale)
  for (let i = 1; i < xs.length; i++) {
    ctx.lineTo(xs[i] * xScale, ys[i] * yScale)
    ctx.stroke()
  }
}

function dataf(f, s, e, step) {
  let xs = []; let ys = []
  for (let x = s; x < e; x += step) {
    xs.push(x); ys.push(f(x))
  }

  return [xs, ys]
}

function setup() {
  // Make it like a math coordinate axis
  ctx.translate(width/2, height/2)
  ctx.scale(1, -1)

  console.log('fill', ctx.fillStyle, 'stroke', ctx.strokeStyle)


  canvas.addEventListener('canvasclicked', (e) => {
    const {x, y} = e.detail
    mouseClicked(x, y)
  })
}

// TODO: Way to clear points, way to undo
let points = []

function mouseClicked(x, y) {
  points.push({x: x, y: y})

  console.log("x: " + x + " y: " + y)
}


function draw() {
  // Coordinate axis
  line(0, 0, 0, height/2)
  line(0, 0, 0, -height/2)
  line(0, 0, width/2, 0)
  line(0, 0, -width/2, 0)


  // Test scatter
  scatter([1, 2, 3], [4, 5, 3], 30, 30)

  // Test plot
  // plot([1, 2, 3], [4, 5, 3], 30, 30)

  // TODO: Use beiz

  const [xs, ys] = dataf(x => x**2/3, -5, 5, 0.1)
  plot(xs, ys, 30, 30)


}



setup()
draw() // todo: repeat or callbacks?
