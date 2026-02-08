import { GameResponse, PlayerState } from "../types";

// A lightweight, fully in-browser fallback so the GitHub Pages build is playable.
// It is NOT meant to be "smart". It's meant to keep the game moving when no local AI is available.

let genre = "High Fantasy";

export function setDemoGenre(g: string) {
  genre = g || "High Fantasy";
}

let state: PlayerState | null = null;
let coords = { x: 0, y: 0 };

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeMap(x: number, y: number): string {
  const W = 30;
  const H = 16;
  const seed = hashString(`${genre}|${x}|${y}`);
  const rnd = mulberry32(seed);

  const grid: string[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => "."));

  // Border
  for (let i = 0; i < W; i++) {
    grid[0][i] = "#";
    grid[H - 1][i] = "#";
  }
  for (let j = 0; j < H; j++) {
    grid[j][0] = "#";
    grid[j][W - 1] = "#";
  }

  // A couple of deterministic features
  const features = ["~", "^", "*", "#"];
  for (let k = 0; k < 30; k++) {
    const fx = 1 + Math.floor(rnd() * (W - 2));
    const fy = 1 + Math.floor(rnd() * (H - 2));
    const f = features[Math.floor(rnd() * features.length)];
    if (rnd() < 0.65) grid[fy][fx] = f;
  }

  // Place player
  const px = Math.floor(W / 2);
  const py = Math.floor(H / 2);
  grid[py][px] = "X";

  return grid.map((row) => row.join("")).join("\n");
}

function locationLabel(x: number, y: number): string {
  const zones = [
    "The Quiet Road",
    "A Broken Orchard",
    "Fog-Marsh",
    "Cinder Steps",
    "Hollow Gate",
    "Lantern Ruins",
    "The Bent Forest",
    "Saltwind Ridge",
  ];
  const idx = hashString(`${genre}|loc|${x}|${y}`) % zones.length;
  return zones[idx];
}

function scenePrompt(x: number, y: number): string {
  const moods = ["high-contrast", "monochrome", "black background", "single subject", "clean silhouette"];
  const props = [
    "a lone traveler",
    "a stone arch",
    "a lantern",
    "a twisted tree",
    "a cracked mask",
    "a distant tower",
    "a hanging sign (no text)",
    "a narrow bridge",
  ];
  const idx = hashString(`${genre}|scene|${x}|${y}`);
  const p = props[idx % props.length];
  return `${p}, ${moods.join(", ")}`;
}

function narrativeFor(action: string, x: number, y: number): string {
  const seed = hashString(`${genre}|${action}|${x}|${y}|${state?.turn ?? 0}`);
  const rnd = mulberry32(seed);

  const openers = [
    "A cold hush clings to the air.",
    "The world holds its breath.",
    "Something unseen shifts behind you.",
    "Your footsteps sound too loud.",
    "A thin light cuts the darkness.",
  ];
  const beats = [
    "You spot a shape that doesn't belong.",
    "A path suggests itself, then doubts you.",
    "A soft whisper crawls along the stones.",
    "The ground answers with a faint tremor.",
    "For a moment, you feel watched.",
  ];
  const endings = [
    "You keep moving, anyway.",
    "You steady your breath and choose.",
    "You press on, pretending it's fine.",
    "You test your luck with a small grin.",
    "You decide this is someone else's problem. It isn't.",
  ];

  const o = openers[Math.floor(rnd() * openers.length)];
  const b = beats[Math.floor(rnd() * beats.length)];
  const e = endings[Math.floor(rnd() * endings.length)];
  const act = action.trim() ? `"${action.trim()}"` : "";
  return `${o} ${b} ${act} ${e}`.replace(/\s+/g, " ").trim();
}

function suggestedActions(): string[] {
  const base = [
    "Move north",
    "Search the area",
    "Do something evil",
    "Do something silly",
  ];
  return base;
}

function stepCoordsFromAction(action: string) {
  const a = action.toLowerCase();
  if (a.includes("north") || a.includes("up")) coords = { x: coords.x, y: coords.y - 1 };
  else if (a.includes("south") || a.includes("down")) coords = { x: coords.x, y: coords.y + 1 };
  else if (a.includes("east") || a.includes("right")) coords = { x: coords.x + 1, y: coords.y };
  else if (a.includes("west") || a.includes("left")) coords = { x: coords.x - 1, y: coords.y };
}

function ensureState(playerLook: string) {
  if (state) return;
  state = {
    name: "Traveler",
    class: "Unknown",
    appearance: playerLook || "Hooded",
    characterDescription: "Hooded traveler with tired eyes",
    hp: 20,
    maxHp: 20,
    mana: 10,
    maxMana: 10,
    level: 1,
    xp: 0,
    gold: 0,
    location: locationLabel(coords.x, coords.y),
    inventory: [],
    statusEffects: [],
    turn: 0,
    journal: [],
  };
}

function buildResponse(action: string): GameResponse {
  if (!state) throw new Error("Demo state missing");

  // Move if action suggests movement
  const before = { ...coords };
  stepCoordsFromAction(action);

  state.turn += 1;
  state.location = locationLabel(coords.x, coords.y);

  // Tiny progression
  if (Math.random() < 0.05) state.gold += 1;
  state.hp = clamp(state.hp, 1, state.maxHp);

  const moved = before.x !== coords.x || before.y !== coords.y;
  const v = moved ? scenePrompt(coords.x, coords.y) : "";

  return {
    narrative: narrativeFor(action, coords.x, coords.y),
    visualDescription: v || scenePrompt(coords.x, coords.y),
    mapArt: makeMap(coords.x, coords.y),
    mapCoordinates: { ...coords },
    playerState: { ...state },
    suggestedActions: suggestedActions(),
    requiresChoice: false,
    gameOver: false,
  };
}

export async function demoStartNewGame(playerLook: string): Promise<GameResponse> {
  coords = { x: 0, y: 0 };
  state = null;
  ensureState(playerLook);
  return buildResponse("Begin");
}

export async function demoPerformAction(action: string): Promise<GameResponse> {
  ensureState(state?.appearance || "Hooded");
  return buildResponse(action);
}
