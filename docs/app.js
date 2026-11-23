const plate = document.querySelector('#plate');
const canvas = document.querySelector('#scene');
const poster = document.querySelector('#poster');
const range = document.querySelector('[data-detune]');
const readout = document.querySelector('[data-cents]');
const soundButton = document.querySelector('[data-sound]');
const soundLabel = soundButton.querySelector('[data-sound-label]');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const limit = 30;
const fundamental = 220;

let cents = 0;
let surface;
let drive = 0;
let follower = 0;
let elapsed = 0;
let request = 0;
let lastFrame = 0;
let inView = true;
let lost = false;

function visible() {
  return surface && inView && !lost && !document.hidden;
}

function frame(now) {
  request = 0;
  if (!visible() || reduced.matches) return;
  if (lastFrame && now - lastFrame < 1000 / 30 - 1) {
    request = requestAnimationFrame(frame);
    return;
  }
  const dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.1) : 0;
  lastFrame = now;
  elapsed += dt;
  drive += (cents / limit - drive) * (1 - Math.exp(-dt * 15));
  follower += (drive - follower) * (1 - Math.exp(-dt * 3.2));
  surface.draw(elapsed, drive, follower, true);
  request = requestAnimationFrame(frame);
}

function schedule() {
  if (!visible() || reduced.matches) {
    cancelAnimationFrame(request);
    request = lastFrame = 0;
    if (visible()) {
      drive = follower = cents / limit;
      surface.draw(0, drive, follower, false);
    }
    return;
  }
  if (!request) request = requestAnimationFrame(frame);
}

let context;
let voices;
let wantsSound = false;
let revision = 0;

function labelSound(text, enabled) {
  if (soundLabel) soundLabel.textContent = text;
  soundButton.setAttribute('aria-label', text);
  soundButton.setAttribute('aria-pressed', String(enabled));
}

function releaseSound() {
  if (!voices) return;
  const { reference, tuned, gain } = voices;
  voices = undefined;
  const now = context.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setTargetAtTime(0, now, 0.025);
  reference.stop(now + 0.18);
  tuned.stop(now + 0.18);
  tuned.onended = () => {
    reference.disconnect();
    tuned.disconnect();
    gain.disconnect();
    if (!wantsSound && context.state === 'running')
      context.suspend().catch(() => {});
  };
}

async function setSound(enabled) {
  const session = ++revision;
  wantsSound = enabled;
  if (!enabled) {
    releaseSound();
    labelSound('Sound off', false);
    return;
  }
  try {
    context ||= new AudioContext();
    await context.resume();
    if (revision !== session || document.hidden) return;
    const reference = context.createOscillator();
    const tuned = context.createOscillator();
    const gain = context.createGain();
    // A quiet second partial gives the sine pair a string-like edge.
    const wave = context.createPeriodicWave(
      new Float32Array(4),
      new Float32Array([0, 1, 0.13, 0.045]),
    );
    for (const voice of [reference, tuned]) {
      voice.setPeriodicWave(wave);
      voice.frequency.value = fundamental;
      voice.connect(gain);
    }
    tuned.detune.value = cents;
    gain.connect(context.destination);
    const now = context.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.setTargetAtTime(0.07, now, 0.075);
    reference.start(now);
    tuned.start(now);
    voices = { reference, tuned, gain };
    labelSound('Sound on', true);
  } catch {
    if (revision !== session) return;
    wantsSound = false;
    releaseSound();
    labelSound('Audio unavailable', false);
    soundButton.disabled = true;
  }
}

function setCents(next) {
  cents = Math.round(Math.max(-limit, Math.min(limit, next)));
  range.value = String(cents);
  range.setAttribute(
    'aria-valuetext',
    cents + (Math.abs(cents) === 1 ? ' cent' : ' cents'),
  );
  const sign = cents < 0 ? '−' : cents > 0 ? '+' : '';
  readout.textContent = sign + String(Math.abs(cents)).padStart(2, '0');
  if (voices)
    voices.tuned.detune.setTargetAtTime(cents, context.currentTime, 0.045);
  if (reduced.matches) schedule();
}

range.addEventListener('input', () => setCents(range.valueAsNumber));
soundButton.addEventListener('click', () => setSound(!wantsSound));
setCents(range.valueAsNumber || 0);

let drag;
plate.addEventListener('dragstart', (event) => event.preventDefault());
plate.addEventListener('pointerdown', (event) => {
  if (drag || !event.isPrimary || event.button !== 0) return;
  drag = {
    id: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    cents,
    horizontal: false,
  };
  plate.setPointerCapture(event.pointerId);
});
plate.addEventListener('pointermove', (event) => {
  if (!drag || drag.id !== event.pointerId) return;
  const dx = event.clientX - drag.x;
  if (!drag.horizontal) {
    if (Math.abs(dx) < 3 || Math.abs(dx) < Math.abs(event.clientY - drag.y))
      return;
    drag.horizontal = true;
    plate.classList.add('dragging');
  }
  setCents(drag.cents + (dx * 2 * limit) / Math.max(1, plate.clientWidth));
});
function finishDrag(event) {
  if (drag && drag.id === event.pointerId) {
    plate.classList.remove('dragging');
    drag = undefined;
  }
}
plate.addEventListener('pointerup', finishDrag);
plate.addEventListener('pointercancel', finishDrag);
plate.addEventListener('lostpointercapture', finishDrag);
plate.addEventListener('dblclick', () => setCents(0));
function centerKey(event) {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === 'Home' || event.key === '0') {
    event.preventDefault();
    setCents(0);
  } else if (
    event.currentTarget === plate &&
    ['ArrowLeft', 'ArrowRight'].includes(event.key)
  ) {
    event.preventDefault();
    setCents(cents + (event.key === 'ArrowRight' ? 1 : -1));
  }
}
range.addEventListener('keydown', centerKey);
plate.addEventListener('keydown', centerKey);

function resize() {
  surface.resize(plate.clientWidth, plate.clientHeight);
  if (visible()) surface.draw(elapsed, drive, follower, !reduced.matches);
  schedule();
}

reduced.addEventListener('change', schedule);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && wantsSound) setSound(false);
  schedule();
});

try {
  const [{ createPlate }] = await Promise.all([
    import('./plate.js'),
    poster.decode(),
  ]);
  surface = await createPlate(canvas, poster);
  resize();
  plate.classList.add('ready');
  new ResizeObserver(resize).observe(plate);
  new IntersectionObserver((entries) => {
    inView = entries[entries.length - 1].isIntersecting;
    schedule();
  }).observe(plate);
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    lost = true;
    plate.classList.remove('ready');
    plate.classList.add('unavailable');
    schedule();
  });
  canvas.addEventListener('webglcontextrestored', () => {
    lost = false;
    resize();
    plate.classList.remove('unavailable');
    plate.classList.add('ready');
  });
} catch (error) {
  plate.classList.add('unavailable');
  console.warn('Showing the still edition of Overtone.', error);
}
