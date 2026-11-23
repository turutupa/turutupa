const cols = 18;
const rows = 12;
const directions = {
  up: [0, -1],
  right: [1, 0],
  down: [0, 1],
  left: [-1, 0],
};
const same = (a, b) => a.x === b.x && a.y === b.y;

export function newGame() {
  return {
    cols,
    rows,
    body: [
      { x: 7, y: 6 },
      { x: 6, y: 6 },
      { x: 5, y: 6 },
      { x: 4, y: 6 },
    ],
    food: { x: 11, y: 6 },
    heading: 'right',
    queue: [],
    score: 0,
    over: false,
    won: false,
  };
}

export function turn(game, direction) {
  if (game.over || game.queue.length >= 2 || !directions[direction]) return;
  const last = game.queue.at(-1) || game.heading;
  const [x, y] = directions[last];
  const [nextX, nextY] = directions[direction];
  if (x * nextX + y * nextY === 0) game.queue.push(direction);
}

export function advance(game) {
  if (game.over) return;
  game.heading = game.queue.shift() || game.heading;
  const [dx, dy] = directions[game.heading];
  const head = {
    x: (game.body[0].x + dx + cols) % cols,
    y: (game.body[0].y + dy + rows) % rows,
  };
  const eating = same(head, game.food);
  const occupied = eating ? game.body : game.body.slice(0, -1);
  if (occupied.some((segment) => same(head, segment))) {
    game.over = true;
    return;
  }
  game.body.unshift(head);
  if (!eating) {
    game.body.pop();
    return;
  }
  game.score++;
  const free = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!game.body.some((segment) => segment.x === x && segment.y === y))
        free.push({ x, y });
    }
  }
  if (free.length) game.food = free[Math.floor(Math.random() * free.length)];
  else game.won = game.over = true;
}

// This closed route returns to its first pixel on the last beat of the loop.
const corners = [
  [3, 8],
  [3, 3],
  [8, 3],
  [8, 6],
  [14, 6],
  [14, 9],
  [6, 9],
  [6, 8],
];
const track = [];
for (let i = 0; i < corners.length; i++) {
  let [x, y] = corners[i];
  const [toX, toY] = corners[(i + 1) % corners.length];
  while (x !== toX || y !== toY) {
    track.push({ x, y });
    x += Math.sign(toX - x);
    y += Math.sign(toY - y);
  }
}

export function demoSnake(t) {
  const index = Math.floor(((t % 6) / 6) * track.length);
  return {
    cols,
    rows,
    food: { x: 13, y: 3 },
    body: Array.from(
      { length: 10 },
      (_, offset) => track[(index - offset + track.length) % track.length],
    ),
  };
}
