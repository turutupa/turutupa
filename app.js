import { newGame, advance, turn, demoSnake } from './snake.js';

const el = (id) => document.getElementById(id);
const canvas = el('scene');
const stage = el('stage');
const soundButton = el('sound');
const motionButton = el('motion');
const gameButton = el('game');
const gamePanel = document.querySelector('.game-panel');
const noteButtons = [...document.querySelectorAll('[data-note]')];
const capture = document.documentElement.classList.contains('capture');
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const frequencies = [82.41, 110, 146.83, 196, 246.94, 329.63];
let scene,
  audio,
  soundOn = false;
let paused = motionPreference.matches;
let time = 0,
  previous = 0,
  pitch = 0,
  lastPluckAt = -Infinity;
let pointerX = 0,
  pointerY = 0,
  focus = 0,
  request = 0;
let game = null,
  gameTime = 0,
  touchStart;
let pausedBeforeGame = paused;

function setSound(enabled) {
  soundOn = enabled;
  soundButton.textContent = enabled ? 'Sound on' : 'Sound off';
  soundButton.setAttribute('aria-pressed', String(enabled));
}

// A short noise burst recirculates through a damped delay, like a plucked string.
function playNote(index) {
  if (!soundOn || !audio || audio.state !== 'running') return;
  const length = Math.round(audio.sampleRate * 1.6);
  const delay = Math.round(audio.sampleRate / frequencies[index] - 0.5);
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < delay; i++) samples[i] = Math.random() * 2 - 1;
  for (let i = delay; i < length; i++) {
    samples[i] = (samples[i - delay] + samples[i - delay + 1]) * 0.497;
  }
  const source = audio.createBufferSource();
  const gain = audio.createGain();
  source.buffer = buffer;
  source.connect(gain).connect(audio.destination);
  const now = audio.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.32, now + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.55);
  source.onended = () => {
    source.disconnect();
    gain.disconnect();
  };
  source.start();
}

function pluck(index) {
  pitch = index;
  lastPluckAt = performance.now() / 1000;
  playNote(index);
  noteButtons.forEach((button, i) =>
    button.classList.toggle('struck', i === index),
  );
  clearTimeout(pluck.release);
  pluck.release = setTimeout(
    () => noteButtons[index].classList.remove('struck'),
    210,
  );
  if (scene && paused) drawFrame(time);
}

soundButton.addEventListener('click', async () => {
  try {
    if (soundOn) {
      setSound(false);
      await audio.suspend();
      return;
    }
    audio ||= new AudioContext();
    await audio.resume();
    setSound(true);
    pluck(pitch);
  } catch {
    setSound(false);
    soundButton.textContent = 'Audio unavailable';
    soundButton.disabled = true;
  }
});
noteButtons.forEach((button, index) =>
  button.addEventListener('click', () => pluck(index)),
);

function setPaused(value) {
  paused = value;
  motionButton.textContent = value ? 'Resume motion' : 'Pause motion';
  motionButton.setAttribute('aria-pressed', String(value));
  if (game && !game.over) updateStatus();
  if (stage.classList.contains('ready')) schedule();
}
setPaused(paused);
motionButton.addEventListener('click', () => setPaused(!paused));
motionPreference.addEventListener('change', (e) => {
  pausedBeforeGame = e.matches;
  setPaused(e.matches);
});

function updateStatus() {
  el('score').textContent = 'Score ' + game.score;
  const status = game.won
    ? 'You filled the screen!'
    : game.over
      ? 'You ran into your tail.'
      : paused
        ? 'Game paused.'
        : 'Use the arrow keys or swipe to steer. The edges wrap.';
  el('game-help').textContent = status;
  el('restart').hidden = !game.over;
}

function startGame() {
  if (!game) pausedBeforeGame = paused;
  game = newGame();
  gameTime = 0;
  gamePanel.hidden = false;
  stage.classList.add('playing');
  gameButton.textContent = 'Exit Snake';
  setPaused(false);
  updateStatus();
}

function exitGame() {
  game = null;
  gamePanel.hidden = true;
  stage.classList.remove('playing');
  gameButton.innerHTML = 'Play Snake <span aria-hidden="true">↗</span>';
  setPaused(pausedBeforeGame);
  gameButton.focus({ preventScroll: true });
}

gameButton.addEventListener('click', () => (game ? exitGame() : startGame()));
el('restart').addEventListener('click', startGame);
document.querySelectorAll('[data-dir]').forEach((button) => {
  button.addEventListener('click', () => {
    if (game) turn(game, button.dataset.dir);
  });
});
document.addEventListener('keydown', (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (/^[1-6]$/.test(event.key) && !event.repeat) pluck(Number(event.key) - 1);
  if (!game) return;
  if (event.key === 'Escape') exitGame();
  if (event.key.startsWith('Arrow')) {
    event.preventDefault();
    turn(game, event.key.slice(5).toLowerCase());
  }
});

function coordinates(event) {
  const rect = canvas.getBoundingClientRect();
  return [
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    1 - ((event.clientY - rect.top) / rect.height) * 2,
  ];
}
canvas.addEventListener('pointermove', (event) => {
  if (event.pointerType === 'touch') return;
  [pointerX, pointerY] = coordinates(event);
  canvas.style.cursor =
    !game && scene?.pickString?.(pointerX, pointerY) != null
      ? 'pointer'
      : 'default';
});
canvas.addEventListener('pointerleave', () => {
  pointerX = pointerY = 0;
});
canvas.addEventListener('pointerdown', (event) => {
  touchStart = [event.clientX, event.clientY];
  if (game) canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointercancel', () => {
  touchStart = null;
});
canvas.addEventListener('pointerup', (event) => {
  if (!touchStart) return;
  const dx = event.clientX - touchStart[0],
    dy = event.clientY - touchStart[1];
  touchStart = null;
  if (game) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) > 12)
      turn(
        game,
        Math.abs(dx) > Math.abs(dy)
          ? dx > 0
            ? 'right'
            : 'left'
          : dy > 0
            ? 'down'
            : 'up',
      );
  } else if (Math.abs(dx) + Math.abs(dy) < 15) {
    const index = scene?.pickString?.(...coordinates(event));
    if (index != null && index >= 0) pluck(index);
  }
});

function drawFrame(t, captureFrame = false) {
  const sinceNote = captureFrame
    ? Infinity
    : performance.now() / 1000 - lastPluckAt;
  const still = !captureFrame && (paused || (game && pausedBeforeGame));
  const automatic = !game && sinceNote > 2 && (captureFrame || !paused);
  const beat = ((t % 6) + 6) % 6;
  const intensity = automatic
    ? Math.exp(-5 * (beat % 1))
    : Math.exp(-4 * sinceNote);
  scene.render(t, {
    pitch: automatic ? Math.floor(beat) : pitch,
    pluck: intensity,
    noteAge: automatic ? beat % 1 : sinceNote,
    pointerX: captureFrame || still ? 0 : pointerX,
    pointerY: captureFrame || still ? 0 : pointerY,
    reducedMotion: !!still,
    demo: !game,
    focus: captureFrame ? 0 : focus,
    snake: game || demoSnake(t),
  });
}

function animate(milliseconds) {
  const dt = previous ? Math.min((milliseconds - previous) / 1000, 0.08) : 0;
  previous = milliseconds;
  if (!paused && !(game && pausedBeforeGame)) time += dt;
  if (game && !game.over && !paused) {
    gameTime += dt;
    const interval = Math.max(0.095, 0.235 - game.score * 0.006);
    if (gameTime >= interval) {
      gameTime -= interval;
      const before = game.score;
      advance(game);
      if (game.score !== before) pluck((game.score - 1) % frequencies.length);
      if (game.over || game.score !== before) updateStatus();
    }
  }
  const target = game ? 1 : 0;
  focus =
    (game && pausedBeforeGame) || paused
      ? target
      : focus + (target - focus) * (1 - Math.exp(-dt * 6));
  drawFrame(time);
  if (!paused) request = requestAnimationFrame(animate);
}

function schedule() {
  cancelAnimationFrame(request);
  previous = 0;
  if (capture || document.hidden || !stage.classList.contains('ready')) return;
  request = requestAnimationFrame(animate);
}

function sizeScene() {
  const box = stage.getBoundingClientRect();
  scene.resize(Math.round(box.width), Math.round(box.height));
  drawFrame(time, capture);
}

function showFallback() {
  cancelAnimationFrame(request);
  stage.classList.remove('ready');
  if (game) exitGame();
  gameButton.disabled = motionButton.disabled = true;
  el('scene-error').hidden = false;
}

try {
  const { createScene } = await import('./scene.js');
  scene = createScene(canvas);
  sizeScene();
  new ResizeObserver(sizeScene).observe(stage);
  stage.classList.add('ready');
  gameButton.disabled = false;
  canvas.addEventListener('webglcontextlost', showFallback, { once: true });
  if (capture) window.renderProfileFrame = (t) => drawFrame(t, true);
  else {
    schedule();
    document.addEventListener('visibilitychange', schedule);
  }
} catch (error) {
  console.error('The instrument could not start.', error);
  showFallback();
}
