/**
 * Hushpath Story Engine
 *
 * Goal for the web version (GitHub Pages): the game MUST be playable from a browser link.
 *
 * - Default backend: DEMO (runs 100% in-browser, no installs).
 * - Optional backend: OLLAMA (player runs Ollama locally, the web app calls 127.0.0.1).
 *
 * To force Ollama mode on the hosted web build:
 *   add ?backend=ollama to the URL
 *
 * NOTE: Browsers may block calling localhost if Ollama doesn't allow CORS.
 */

import { GameResponse } from "../types";
import { demoStartNewGame, demoPerformAction, setDemoGenre } from "./storyEngineDemo";

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

const OLLAMA_URL = (import.meta.env.VITE_OLLAMA_URL as string) || "http://127.0.0.1:11434";
const OLLAMA_MODEL = (import.meta.env.VITE_OLLAMA_MODEL as string) || "llama3.2:3b";

function getBackend(): "demo" | "ollama" {
  try {
    const qp = new URLSearchParams(window.location.search);
    const b = (qp.get("backend") || "").toLowerCase();
    if (b === "ollama") return "ollama";
  } catch {
    // ignore
  }
  const env = String((import.meta.env.VITE_AI_BACKEND as string) || "demo").toLowerCase();
  return env === "ollama" ? "ollama" : "demo";
}

export const setGameGenre = (genre: string) => {
  currentGenre = genre;
  setDemoGenre(genre);
};

const getSystemInstruction = (genre: string) => `
You are the Engine for "Hushpath", a high-end text RPG.
SETTING: ${genre}

MANDATE:
1) RESPONSE FORMAT: Strict JSON ONLY. No markdown. No commentary.
2) REQUIRED FIELDS (always include all of them):
   - narrative (string, under 60 words)
   - visualDescription (string): short image prompt (10-20 words) OR empty string "" if no meaningful scene change
   - mapArt (string): 30 chars wide x 16 lines tall ASCII sector map
   - mapCoordinates (object): {x:int, y:int} sector id. Start is {0,0}. Only change when leaving the sector.
   - playerState (object) with: name, class, appearance, characterDescription, hp, maxHp, mana, maxMana, level, xp, gold, location, inventory[], statusEffects[], turn, journal[]
   - suggestedActions (array of EXACTLY 4 strings): [Logical, Logical, Evil, Silly]
   - requiresChoice (boolean)
   - gameOver (boolean)

3) VISUALS (visualDescription):
   - You do NOT draw ASCII art anymore.
   - Output a short image prompt for the CURRENT scene.
   - Avoid any text/signs/letters.
   - Only output a new visualDescription on meaningful changes. Otherwise output "".

4) MAP:
   - mapArt must include an 'X' marking the player.
   - Use # for walls, . for floor/path, ~ for water, ^ for hills/rocks, * for special.

5) CHARACTER DESCRIPTION:
   - characterDescription max 10-15 words.
   - Only change it if appearance meaningfully changes.

Stay consistent. Keep it playable.
`;

function stripCodeFences(s: string): string {
  return s.replace(/```[a-zA-Z]*\n/g, "").replace(/```/g, "").trim();
}

function extractFirstJsonObject(text: string): string {
  const t = stripCodeFences(text);
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first >= 0 && last > first) return t.slice(first, last + 1);
  return t;
}

function safeParseJson(text: string): any {
  const candidate = extractFirstJsonObject(text);
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

  const defaults = ["Look around", "Check inventory", "Do something evil", "Do something silly"];
  while (res.suggestedActions.length < 4) res.suggestedActions.push(defaults[res.suggestedActions.length]);
  if (res.suggestedActions.length > 4) res.suggestedActions = res.suggestedActions.slice(0, 4);

  if (!res.playerState) throw new Error("Model response missing playerState");
  if (!res.narrative) res.narrative = "...";
  if (typeof res.visualDescription !== "string") res.visualDescription = "";
  return res;
}

async function callWithRetry<T>(fn: () => Promise<T>, retries = 1, delay = 400): Promise<T> {
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
    model: OLLAMA_MODEL,
    messages,
    stream: false,
    format: "json",
    options: { temperature: 0.8, num_ctx: 4096 },
  };

  // Desktop build (IPC bridge avoids CORS for file:// origin)
  if (typeof window !== "undefined" && window.hushpathDesktop?.ollamaChat) {
    const res = await callWithRetry(() => window.hushpathDesktop!.ollamaChat(body));
    return String(res?.message?.content ?? res?.response ?? "");
  }

  // Web build
  const res = await callWithRetry(() =>
    fetch(`${OLLAMA_URL}/api/chat`, {
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
    model: OLLAMA_MODEL,
    prompt,
    stream: false,
    options: { temperature: 0.7, num_ctx: 2048 },
  };

  if (typeof window !== "undefined" && window.hushpathDesktop?.ollamaGenerate) {
    const res = await callWithRetry(() => window.hushpathDesktop!.ollamaGenerate(body));
    return String(res?.response ?? "");
  }

  const res = await callWithRetry(() =>
    fetch(`${OLLAMA_URL}/api/generate`, {
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
  const backend = getBackend();
  if (backend !== "ollama") return demoStartNewGame(playerLook);

  chatHistory = [{ role: "system", content: getSystemInstruction(currentGenre) }];
  const prompt = `START GAME. Player appearance: ${playerLook}.\nDescribe where we start.\nProvide visualDescription for the opening scene.\nProvide mapArt and mapCoordinates: {x:0, y:0}.`;
  chatHistory.push({ role: "user", content: prompt });

  try {
    const assistantText = await ollamaChat(chatHistory);
    chatHistory.push({ role: "assistant", content: assistantText });
    const obj = safeParseJson(assistantText);
    return normalizeResponse(obj);
  } catch {
    // If Ollama isn't reachable (common on GitHub Pages), fall back.
    return demoStartNewGame(playerLook);
  }
};

export const performAction = async (action: string): Promise<GameResponse> => {
  const backend = getBackend();
  if (backend !== "ollama") return demoPerformAction(action);
  if (chatHistory.length === 0) return demoPerformAction(action);

  chatHistory.push({ role: "user", content: action });
  try {
    const assistantText = await ollamaChat(chatHistory);
    chatHistory.push({ role: "assistant", content: assistantText });
    const obj = safeParseJson(assistantText);
    return normalizeResponse(obj);
  } catch {
    return demoPerformAction(action);
  }
};

export const getAscii = async (prompt: string, dims: string = "80x30"): Promise<string> => {
  const backend = getBackend();
  if (backend !== "ollama") {
    // In demo mode, we don't ask an LLM for ASCII. Keep it simple.
    return "";
  }
  const req = `Generate ASCII ART only.\nDimensions: ${dims}.\nTheme: ${prompt}.\nRules: no markdown, art only. Use: /\\|_-.' ,:;()[]{}<>~+*#@ and whitespace.`;
  const txt = await ollamaGenerate(req);
  return stripCodeFences(txt);
};

export const getPortraitAscii = async (desc: string): Promise<string> => getAscii(`Full body standing character silhouette, ${desc}`, "40x50");
