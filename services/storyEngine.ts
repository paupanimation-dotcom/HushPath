/**
 * Hushpath Story Engine (Web + Desktop)
 *
 * This build is meant to be playable from a browser link (GitHub Pages).
 * We do NOT ship a "demo AI" fallback anymore.
 *
 * Requirement:
 *   - Player must have Ollama running locally (free) so the web app can call http://127.0.0.1:11434
 *
 * If Ollama is not reachable (or CORS blocks it), the UI will show a setup overlay.
 */

import { GameResponse } from "../types";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

declare global {
  interface Window {
    hushpathDesktop?: {
      // (desktop builds only)
      ollamaChat: (body: any) => Promise<any>;
      ollamaGenerate: (body: any) => Promise<any>;
    };
  }
}

let chatHistory: ChatMessage[] = [];
let currentGenre = "High Fantasy";

const DEFAULT_OLLAMA_URL = "http://127.0.0.1:11434";
const DEFAULT_OLLAMA_MODEL = "qwen2.5:14b";

function readLocalStorage(key: string, fallback: string): string {
  try {
    const v = window?.localStorage?.getItem(key);
    return (v && v.trim()) || fallback;
  } catch {
    return fallback;
  }
}

function getFromQuery(key: string): string {
  try {
    const qp = new URLSearchParams(window.location.search);
    return (qp.get(key) || "").trim();
  } catch {
    return "";
  }
}

export function getOllamaUrl(): string {
  const qp = getFromQuery("ollama");
  if (qp) return qp;
  return (
    (import.meta.env.VITE_OLLAMA_URL as string) ||
    readLocalStorage("hushpath_ollama_url", DEFAULT_OLLAMA_URL) ||
    DEFAULT_OLLAMA_URL
  );
}

export function getOllamaModel(): string {
  const qp = getFromQuery("model");
  if (qp) return qp;
  return (
    (import.meta.env.VITE_OLLAMA_MODEL as string) ||
    readLocalStorage("hushpath_ollama_model", DEFAULT_OLLAMA_MODEL) ||
    DEFAULT_OLLAMA_MODEL
  );
}

export const setGameGenre = (genre: string) => {
  currentGenre = genre;
};

const getSystemInstruction = (genre: string) => `
You are the Engine for "Hushpath", a serious, replayable text RPG.
SETTING / GENRE: ${genre}

You MUST respond with STRICT JSON ONLY. No markdown. No extra text.

REQUIRED FIELDS (always include ALL of them):
- narrative: string (max 60 words)
- visualDescription: string (10-20 words) OR "" when no scene change
- mapArt: string (30 chars wide x 16 lines tall ASCII sector map)
- mapCoordinates: object {x:int, y:int} (start {0,0}; only change when player leaves the sector)
- playerState: object with:
  name, class, appearance, characterDescription,
  hp, maxHp, mana, maxMana,
  level, xp, gold,
  location,
  inventory: string[],
  statusEffects: string[],
  turn: int,
  journal: string[]
- suggestedActions: array of EXACTLY 4 UNIQUE strings:
  [Logical, Logical, Evil, Silly]
- requiresChoice: boolean
- gameOver: boolean

GAMEPLAY RULES:
- Always acknowledge the PLAYER ACTION and evolve the world state.
- Increment playerState.turn by +1 each response.
- suggestedActions must be contextual, non-repetitive, and MUST NOT ignore the player's last action.
  (Do NOT output the same four actions every turn.)
- Keep the story consistent and playable.

VISUALS:
- You DO NOT draw ASCII art.
- visualDescription is a compact prompt for a monochrome silhouette scene.
- Avoid words like "text", "letters", "sign", "logo".
- Do NOT include seed numbers.

MAP:
- mapArt must contain exactly one 'X' marking the player.
- Use # walls, . floor/path, ~ water, ^ hills/rocks, * special.

CHARACTER DESCRIPTION:
- characterDescription is 10-15 words, only change it if appearance meaningfully changes.
`;

function stripCodeFences(s: string): string {
  return s.replace(/```[a-zA-Z]*\n/g, "").replace(/```/g, "").trim();
}

function extractFirstJson(text: string): string {
  const t = stripCodeFences(text);
  const first = t.indexOf("{");
  if (first < 0) return t;

  // walk braces to find a valid first JSON object
  let depth = 0;
  for (let i = first; i < t.length; i++) {
    const ch = t[i];
    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) return t.slice(first, i + 1);
    }
  }
  return t;
}

function safeParseJson(text: string): any {
  const candidate = extractFirstJson(text);
  try {
    return JSON.parse(candidate);
  } catch {
    const cleaned = candidate.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
    return JSON.parse(cleaned);
  }
}

function normalizeResponse(obj: any): GameResponse {
  const res: GameResponse = {
    narrative: String(obj?.narrative ?? ""),
    visualDescription: String(obj?.visualDescription ?? ""),
    visualArt: typeof obj?.visualArt === "string" ? obj.visualArt : undefined,
    mapArt: typeof obj?.mapArt === "string" ? obj.mapArt : undefined,
    mapCoordinates:
      obj?.mapCoordinates && typeof obj.mapCoordinates.x === "number" && typeof obj.mapCoordinates.y === "number"
        ? { x: obj.mapCoordinates.x, y: obj.mapCoordinates.y }
        : undefined,
    playerState: obj?.playerState,
    suggestedActions: Array.isArray(obj?.suggestedActions) ? obj.suggestedActions.map(String) : [],
    requiresChoice: Boolean(obj?.requiresChoice ?? false),
    gameOver: Boolean(obj?.gameOver ?? false),
  };

  if (!res.playerState) throw new Error("Model response missing playerState");
  if (!res.narrative) res.narrative = "...";
  if (typeof res.visualDescription !== "string") res.visualDescription = "";

  // Ensure suggestedActions are always 4 unique strings
  const defaults = ["Look around", "Check inventory", "Do something evil", "Do something silly"];
  const uniq: string[] = [];
  for (const a of res.suggestedActions) {
    const s = String(a || "").trim();
    if (!s) continue;
    if (!uniq.some((u) => u.toLowerCase() === s.toLowerCase())) uniq.push(s);
  }
  for (const d of defaults) {
    if (uniq.length >= 4) break;
    if (!uniq.some((u) => u.toLowerCase() === d.toLowerCase())) uniq.push(d);
  }
  res.suggestedActions = uniq.slice(0, 4);

  return res;
}

async function callWithRetry<T>(fn: () => Promise<T>, retries = 1, delay = 450): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    await new Promise((r) => setTimeout(r, delay));
    return callWithRetry(fn, retries - 1, delay * 2);
  }
}

async function ollamaChat(messages: ChatMessage[]): Promise<string> {
  const body = {
    model: getOllamaModel(),
    messages,
    stream: false,
    format: "json",
    options: {
      temperature: 0.75,
      top_p: 0.9,
      repeat_penalty: 1.12,
      num_ctx: 8192,
    },
  };

  // Desktop build (IPC bridge avoids CORS for file:// origin)
  if (typeof window !== "undefined" && window.hushpathDesktop?.ollamaChat) {
    const res = await callWithRetry(() => window.hushpathDesktop!.ollamaChat(body));
    return String(res?.message?.content ?? res?.response ?? "");
  }

  const url = getOllamaUrl();
  const res = await callWithRetry(() =>
    fetch(`${url}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Ollama /api/chat failed (${res.status}): ${t}`);
  }
  const json = await res.json();
  return String(json?.message?.content ?? "");
}

async function ollamaGenerate(prompt: string): Promise<string> {
  const body = {
    model: getOllamaModel(),
    prompt,
    stream: false,
    options: {
      temperature: 0.7,
      top_p: 0.9,
      repeat_penalty: 1.12,
      num_ctx: 4096,
    },
  };

  if (typeof window !== "undefined" && window.hushpathDesktop?.ollamaGenerate) {
    const res = await callWithRetry(() => window.hushpathDesktop!.ollamaGenerate(body));
    return String(res?.response ?? "");
  }

  const url = getOllamaUrl();
  const res = await callWithRetry(() =>
    fetch(`${url}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Ollama /api/generate failed (${res.status}): ${t}`);
  }
  const json = await res.json();
  return String(json?.response ?? "");
}

export const startNewGame = async (playerLook: string): Promise<GameResponse> => {
  chatHistory = [{ role: "system", content: getSystemInstruction(currentGenre) }];

  const prompt = [
    `START GAME`,
    `Player appearance: ${playerLook}`,
    `Open with a strong scene hook.`,
    `Remember: JSON only, include ALL required fields.`,
    `Start at mapCoordinates {"x":0,"y":0} and turn=1.`,
  ].join("\n");

  chatHistory.push({ role: "user", content: prompt });

  const assistantText = await ollamaChat(chatHistory);
  chatHistory.push({ role: "assistant", content: assistantText });
  const obj = safeParseJson(assistantText);
  return normalizeResponse(obj);
};

export const performAction = async (action: string): Promise<GameResponse> => {
  if (chatHistory.length === 0) {
    // If the page reloaded mid-game, force a restart flow in the UI.
    throw new Error("Game not initialized");
  }

  chatHistory.push({ role: "user", content: `PLAYER ACTION: ${action}` });

  const assistantText = await ollamaChat(chatHistory);
  chatHistory.push({ role: "assistant", content: assistantText });
  const obj = safeParseJson(assistantText);
  return normalizeResponse(obj);
};

export const getAscii = async (prompt: string, dims: string = "80x30"): Promise<string> => {
  const req = `Generate ASCII ART only.\nDimensions: ${dims}.\nTheme: ${prompt}.\nRules: no markdown, art only. Use: /\\|_-.' ,:;()[]{}<>~+*#@ and whitespace.`;
  const txt = await ollamaGenerate(req);
  return stripCodeFences(txt);
};

export const getPortraitAscii = async (desc: string): Promise<string> =>
  getAscii(`Full body standing character silhouette, ${desc}`, "40x50");
