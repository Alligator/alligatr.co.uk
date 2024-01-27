let outputCtx;
let ctx;
let offscreenCtx;

let audioCtx;
let inputAudioBuffer;
let outputAudioBuffer;

let bufferSrc;
let playbackStartedAt;
let playing;

const effects = [
  {
    name: 'brighten',
    perPixelFunc: (r, g, b, a) => {
      return [saturate(r + 32), saturate(g + 32), saturate(b + 32), a];
    },
  },
  {
    name: 'darken',
    perPixelFunc: (r, g, b, a) => {
      return [saturate(r - 32), saturate(g - 32), saturate(b - 32), a];
    },
  },
  {
    name: 'blur',
    filter: 'blur(1px)',
  },
  {
    name: 'contrast up',
    filter: 'contrast(125%)',
  },
  {
    name: 'contrast down',
    filter: 'contrast(80%)',
  },
  {
    name: 'invert',
    filter: 'invert(100%)',
  },
  {
    name: 'sharpen (weird)',
    func: (imgData) => {
      const buf8 = imgData.data;

      const weights = [
         0, -1,  0,
         0,  3,  0,
         0, -1,  0,
      ];
      const side = Math.round(Math.sqrt(weights.length));
      const halfSide = Math.floor(side/2);

      const w = imgData.width;
      const h = imgData.height;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const index = (y * w + x) * 4;

          let r = 0;
          let g = 0;
          let b = 0;
          // let a = 0;

          for (let cy = 0; cy < side; cy++) {
            for (let cx = 0; cx < side; cx++) {
              const scx = x + cx - halfSide;
              const scy = y + cy - halfSide;
              if (scx >= 0 && scx < w && scy >= 0 && scy < h) {
                const otherIndex = (scy * w + scx) * 4;
                const weight = weights[cy * side + cx];
                r += buf8[otherIndex] * weight;
                g += buf8[otherIndex + 1] * weight;
                b += buf8[otherIndex + 2] * weight;
                // a += buf8[otherIndex + 3] * weight;
              }
            }
          }

          buf8[index] = r;
          buf8[index + 1] = g;
          buf8[index + 2] = b;
          // buf8[index + 3] = a;
        }
      }

      return imgData;
    },
  },
  {
    name: 'dither (1 bit)',
    func: (imgData) => dither(imgData, 2),
  },
  {
    name: 'dither (2 bit)',
    func: (imgData) => dither(imgData, 4),
  },
  {
    name: 'dither (4 bit)',
    func: (imgData) => dither(imgData, 2 ** 4),
  },
];

function dither(imgData, steps) {
  // atkinson dithering
  const matrix = [
    // x, y, value
    [1, 0, 1 / 8],
    [2, 0, 1 / 8],
    [-1, 1, 1 / 8],
    [0, 1, 1 / 8],
    [1, 1, 1 / 8],
    [0, 2, 1 / 8],
  ];

  const data = imgData.data;
  const data32 = new Uint32Array(data.buffer);

  const step = 255 / steps;

  for (let i = 0; i < data32.length; i++) {
    const brightness = data32[i] & 0xff;

    const result = Math.min(255, Math.floor(brightness / step) * (255 / (steps - 1)));
    data32[i] = 255 << 24 | result << 16 | result << 8 | result;

    const error = result - brightness;
    if (result < 127 && brightness > 127) {
      debugger;
    }

    const x = i % imgData.width;
    const y = Math.floor(i / imgData.width);

    // diffuse the error
    for (let j = 0; j < matrix.length; j++) {
      const err = Math.floor(error * matrix[j][2]);
      const idx = ((x + matrix[j][0]) + (y + matrix[j][1]) * imgData.width);

      const val = data32[idx];
      const r = val & 0xff;
      data32[idx] =
        255 << 24 |
        (r - err) << 16 |
        (r - err) << 8 |
        (r - err);
    }
  }

  return imgData;
}

function saturate(x) {
  return Math.max(0, Math.min(x, 255));
}

// canvas stuff
function applyEffect(name) {
  const fx = effects.find(e => e.name === name);
  stop();

  if (fx.perPixelFunc) {
    // pixel manip
    const imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const buf32 = new Uint32Array(imgData.data.buffer);
    for (let i = 0; i < buf32.length; i++) {
      const r = buf32[i] & 0xff;
      const g = (buf32[i] >> 8) & 0xff;
      const b = (buf32[i] >> 16) & 0xff;
      const a = (buf32[i] >> 24) & 0xff;
      const [nr, ng, nb, na] = fx.perPixelFunc(r, g, b, a);
      buf32[i] =
        (na << 24) |
        (nb << 16) |
        (ng << 8)  |
        nr;
    }
    ctx.putImageData(imgData, 0, 0);
  } if (fx.func) {
    const imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const modifiedImgData = fx.func(imgData);
    ctx.putImageData(modifiedImgData, 0, 0);
  } else if (fx.filter) {
    offscreenCtx.drawImage(ctx.canvas, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.filter = fx.filter;
    ctx.drawImage(offscreenCtx.canvas, 0, 0);
  }

}

function drawImage(u8Buf) {
  const imgEl = document.getElementById('img');

  const imgSize = Math.ceil(Math.sqrt(u8Buf.length));

  outputCtx.canvas.width = imgSize;
  outputCtx.canvas.height = imgSize;

  ctx.canvas.width = imgSize;
  ctx.canvas.height = imgSize;

  offscreenCtx.canvas.width = imgSize;
  offscreenCtx.canvas.height = imgSize;

  const u32Pixels = new Uint32Array(canvas.width * canvas.height);
  for (let i = 0; i < u32Pixels.length; i++) {
    if (i >= u8Buf.length) {
      u32Pixels[i] = 0;
      continue;
    }
    const pixel = u8Buf[i];
    u32Pixels[i] =
        (255 << 24)   | // alpha
        (pixel << 16) | // blue
        (pixel << 8)  | // green
        pixel;          // red;
  }

  const u8Pixels = new Uint8ClampedArray(u32Pixels.buffer);
  const imgData = new ImageData(u8Pixels, canvas.width, canvas.height);
  ctx.putImageData(imgData, 0, 0);

  imgEl.style.display = 'flex';
}

function drawOutput() {
  if (!bufferSrc || !playing) {
    outputCtx.drawImage(ctx.canvas, 0, 0);
  }

  if (playing) {
    outputCtx.clearRect(0, 0, outputCtx.canvas.width, outputCtx.canvas.height);
    outputCtx.drawImage(ctx.canvas, 0, 0);

    const elapsed = audioCtx.currentTime - playbackStartedAt;
    const sampleRate = bufferSrc.buffer.sampleRate;
    const nsamples = Math.floor(elapsed * sampleRate);
    const x = nsamples % outputCtx.canvas.width;
    const y = Math.floor(nsamples / outputCtx.canvas.width);

    outputCtx.fillStyle = 'yellow';
    outputCtx.fillRect(0, y, outputCtx.canvas.width, 1);
  }

  window.requestAnimationFrame(drawOutput);
}

function playCanvas() {
  const imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const f32Buf = new Float32Array(imgData.data.length / 4);
  for (let i = 0; i < imgData.data.length; i += 4) {
    // grayscale, so only check the red channel
    const pixel = imgData.data[i];
    f32Buf[i / 4] = (pixel / 127.5) - 1;
  }
  outputAudioBuffer.copyToChannel(f32Buf, 0);
  playAudio(outputAudioBuffer);
}

// audio stuff
function playAudio(audioBuf) {
  if (bufferSrc) {
    bufferSrc.stop();
    playing = false;
  }
  bufferSrc = audioCtx.createBufferSource();
  bufferSrc.buffer = audioBuf;
  bufferSrc.connect(audioCtx.destination);
  bufferSrc.onended = (evt) => {
    if (bufferSrc === evt.target) {
      // was this the current buffer src?
      playing = false
    }
  };
  playbackStartedAt = audioCtx.currentTime;
  bufferSrc.start();
  window.requestIdleCallback(() => playing = true);
}

function audio2img(f32Buf) {
  const u8Buf = new Uint8ClampedArray(f32Buf.length);
  for (let i = 0; i < f32Buf.length; i++) {
    // samples are -1 to 1
    // map to 0 - 255
    const sample = f32Buf[i];
    u8Buf[i] = Math.round((sample + 1) * 127.5);
  }
  return u8Buf;
}

async function readAudio(buf) {
  audioCtx = new AudioContext();
  inputAudioBuffer = await audioCtx.decodeAudioData(buf);
  processAudio();
}

function processAudio() {
  let f32Buf = inputAudioBuffer.getChannelData(0);
  f32Buf = f32Buf.slice(0, 800 * 800); // limit images to 800 x 800

  outputAudioBuffer = new AudioBuffer({
    sampleRate: inputAudioBuffer.sampleRate,
    numberOfChannels: 1,
    length: f32Buf.length,
  });

  const img = audio2img(f32Buf);

  drawImage(img);
}

function stop() {
  if (bufferSrc) {
    bufferSrc.stop();
    playing = false;
  }
}

window.addEventListener('load', () => {
  // prep canvases
  // output - the one on the page
  const outputCanvas = document.getElementById('canvas');
  outputCtx = outputCanvas.getContext('2d');

  // ctx - the one we draw to
  const canvas = document.createElement('canvas');
  ctx = canvas.getContext('2d');

  // offscreen - used for filters
  const offscreenCanvas = document.createElement('canvas');
  offscreenCtx = offscreenCanvas.getContext('2d');

  // start the raf loop
  drawOutput();

  // event handlers etc
  const uploadEl = document.getElementById('upload');
  uploadEl.addEventListener('change', (evt) => {
    stop();

    const file = evt.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      readAudio(e.target.result);
    };
    reader.readAsArrayBuffer(file);
  });

  document.getElementById('example').addEventListener('click', async () => {
    const resp = await fetch('example.mp3');
    const data = await resp.arrayBuffer();
    readAudio(data);
  });

  document.getElementById('play').addEventListener('click', () => {
    playCanvas();
  });

  document.getElementById('stop').addEventListener('click', () => {
    stop();
  });

  document.getElementById('reset').addEventListener('click', () => {
    stop();
    processAudio();
  });

  const controlEl = document.getElementById('controls');
  for (const effect of effects) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.innerText = effect.name;
    btn.addEventListener('click', () => applyEffect(effect.name));
    controlEl.appendChild(btn);
  }
});