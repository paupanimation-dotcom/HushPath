/**
 * Image -> ASCII pipeline (free / local).
 *
 * This keeps the SAME deterministic conversion technique you liked,
 * but swaps Gemini image generation for an optional local Stable Diffusion backend.
 *
 * Supported image backends:
 *   - Automatic1111 Stable Diffusion WebUI API (recommended)
 *     Start with --api and default URL: http://127.0.0.1:7860
 *
 * If you don't have an image backend running, this module will throw on image generation.
 * The UI already falls back to keeping the previous scene art or using LLM ASCII for portraits.
 */

export interface AsciiSettings {
  width: number; // output columns
  contrast: number; // 1.0 = normal, ~1.3 = boost
  inverted: boolean;
  rampIndex: number; // 0 = dense, 1 = simple
  threshold: number; // 0..1 cutoff for pure black
}

export const DENSE_RAMP = " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
export const SIMPLE_RAMP = " .:-=+*#%@";
export const RAMPS = [DENSE_RAMP, SIMPLE_RAMP];

export const ASPECT_CORRECTION = 0.55; // monospace chars are taller than wide

export const DEFAULT_SCENE_SETTINGS: AsciiSettings = {
  width: 80,
  // Higher contrast + simpler ramp makes silhouettes much cleaner/legible.
  contrast: 1.8,
  inverted: false,
  rampIndex: 1,
  threshold: 0.22,
};

export const DEFAULT_PORTRAIT_SETTINGS: AsciiSettings = {
  width: 40,
  contrast: 1.8,
  inverted: false,
  rampIndex: 1,
  threshold: 0.22,
};

declare global {
  interface Window {
    hushpathDesktop?: {
      sdTxt2Img: (body: any) => Promise<any>;
    };
  }
}

const SDWEBUI_URL = (import.meta.env.VITE_SDWEBUI_URL as string) || "http://127.0.0.1:7860";

// --- Web fallback -----------------------------------------------------------
// When running on GitHub Pages we cannot assume the player has a Stable Diffusion
// server running. To keep the EXACT same "image -> ASCII" conversion technique,
// we generate a deterministic high-contrast silhouette image locally (canvas)
// and feed it through the converter.

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

function proceduralSilhouette(prompt: string, aspectRatio: string): string {
  const { width, height } = aspectToSize(aspectRatio);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // black background
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);

  // Deterministic shapes (white) based on prompt keywords.
  // This produces varied, readable silhouettes even when no image model is available.
  const words = String(prompt || "").toLowerCase();
  const seed = hashString(words);
  const rnd = mulberry32(seed);

  const has = (k: string) => words.includes(k);

  // Simple drawing helpers (all in silhouette language)
  const fillWhite = () => {
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#fff";
  };
  const cutBlack = () => {
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "#000";
    ctx.strokeStyle = "#000";
  };
  const circle = (x: number, y: number, r: number) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  const rect = (x: number, y: number, w: number, h: number) => {
    ctx.fillRect(x, y, w, h);
  };
  const tri = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.closePath();
    ctx.fill();
  };

  const cx = width * 0.5;
  const groundY = height * (0.72 + (rnd() - 0.5) * 0.05);

  fillWhite();
  // optional horizon / ground line (keeps silhouettes anchored)
  if (rnd() < 0.75) {
    rect(0, groundY, width, Math.max(2, height * 0.02));
  }

  const drawMask = () => {
    const w = width * (0.32 + rnd() * 0.08);
    const h = height * (0.36 + rnd() * 0.08);
    const x = cx - w / 2;
    const y = groundY - h;

    // rounded-ish mask
    rect(x, y, w, h);
    circle(x, y + h * 0.18, w * 0.22);
    circle(x + w, y + h * 0.18, w * 0.22);
    circle(x, y + h * 0.82, w * 0.22);
    circle(x + w, y + h * 0.82, w * 0.22);

    // eye cutouts
    cutBlack();
    circle(cx - w * 0.18, y + h * 0.45, w * 0.09);
    circle(cx + w * 0.18, y + h * 0.45, w * 0.09);
    fillWhite();
  };

  const drawHouse = () => {
    const w = width * (0.34 + rnd() * 0.1);
    const h = height * (0.26 + rnd() * 0.08);
    const x = cx - w / 2;
    const y = groundY - h;
    rect(x, y, w, h);
    tri(x - w * 0.05, y, cx, y - h * 0.55, x + w * 1.05, y);

    // door cutout
    cutBlack();
    const dw = w * 0.18;
    const dh = h * 0.55;
    rect(cx - dw / 2, groundY - dh, dw, dh);
    fillWhite();
  };

  const drawTree = (x: number) => {
    const trunkW = width * (0.03 + rnd() * 0.02);
    const trunkH = height * (0.12 + rnd() * 0.06);
    rect(x - trunkW / 2, groundY - trunkH, trunkW, trunkH);
    circle(x, groundY - trunkH, width * (0.06 + rnd() * 0.03));
  };

  const drawRock = () => {
    const w = width * (0.22 + rnd() * 0.1);
    const h = height * (0.14 + rnd() * 0.06);
    const x = cx - w / 2;
    const y = groundY - h;
    ctx.beginPath();
    ctx.moveTo(x, groundY);
    ctx.lineTo(x + w * 0.15, y + h * 0.2);
    ctx.lineTo(cx, y);
    ctx.lineTo(x + w * 0.85, y + h * 0.25);
    ctx.lineTo(x + w, groundY);
    ctx.closePath();
    ctx.fill();
  };

  // Choose a primary silhouette based on prompt keywords.
  const primary =
    has("mask") || has("skull") || has("face")
      ? "mask"
      : has("house") || has("hut") || has("cabin") || has("door")
      ? "house"
      : has("forest") || has("tree") || has("woods") || has("marsh")
      ? "trees"
      : has("mountain") || has("ridge") || has("cliff")
      ? "rock"
      : rnd() < 0.25
      ? "mask"
      : rnd() < 0.55
      ? "house"
      : "rock";

  if (primary === "mask") drawMask();
  else if (primary === "house") drawHouse();
  else if (primary === "rock") drawRock();
  else {
    // trees cluster
    const count = 3 + Math.floor(rnd() * 4);
    const spread = width * 0.28;
    for (let i = 0; i < count; i++) {
      drawTree(cx + (rnd() - 0.5) * spread);
    }
  }

  // Secondary context silhouettes (kept minimal so ASCII stays clean)
  if (has("moon") || has("night") || has("dark") || rnd() < 0.35) {
    circle(width * (0.18 + rnd() * 0.2), height * (0.18 + rnd() * 0.15), width * (0.04 + rnd() * 0.02));
  }
  if (has("fog") || has("mist") || has("marsh") || rnd() < 0.35) {
    // thin fog bands (very subtle)
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#fff";
    const bands = 2 + Math.floor(rnd() * 3);
    for (let i = 0; i < bands; i++) {
      const y = height * (0.55 + rnd() * 0.25);
      rect(0, y, width, Math.max(2, height * 0.01));
    }
  }

  // Small specks for texture (limited)
  const specks = 2 + Math.floor(rnd() * 4);
  fillWhite();
  for (let i = 0; i < specks; i++) {
    const x = width * (0.15 + rnd() * 0.7);
    const y = height * (0.15 + rnd() * 0.55);
    circle(x, y, Math.max(2, Math.floor(4 + rnd() * 10)));
  }

  return canvas.toDataURL("image/png");
}

function aspectToSize(aspectRatio: string): { width: number; height: number } {
  // Keep sizes modest for speed; you can raise these if your GPU can handle it.
  switch (aspectRatio) {
    case "2:3":
      return { width: 512, height: 768 };
    case "3:2":
    default:
      return { width: 768, height: 512 };
  }
}

async function callWithRetry<T>(fn: () => Promise<T>, retries = 2, delay = 700): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    await new Promise((r) => setTimeout(r, delay));
    return callWithRetry(fn, retries - 1, delay * 2);
  }
}

async function sdTxt2Img(payload: any): Promise<any> {
  // Desktop build: IPC bridge avoids CORS (file:// origin).
  if (typeof window !== "undefined" && window.hushpathDesktop?.sdTxt2Img) {
    return callWithRetry(() => window.hushpathDesktop!.sdTxt2Img(payload));
  }

  // Web/dev: direct fetch to the SD WebUI API
  const res = await callWithRetry(() =>
    fetch(`${SDWEBUI_URL}/sdapi/v1/txt2img`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`SD WebUI txt2img failed (${res.status}): ${t}`);
  }
  return res.json();
}

/**
 * Generate a base64 PNG image using Stable Diffusion WebUI.
 */
export async function generateSourceImage(prompt: string, aspectRatio: string = "3:2"): Promise<string> {
  const { width, height } = aspectToSize(aspectRatio);

  // Hushpath's “ASCII Art Generator” technique:
  // force a pure-black background and a single, bright subject with very clean edges.
  // This keeps the ASCII conversion readable.
  const enhancedPrompt = [
    prompt,
    'monochrome',
    'pure black background (#000000)',
    'single subject centered',
    'white / light-gray subject',
    'very high contrast',
    'clean silhouette edges',
    'simple shapes, minimal detail',
    'no text, no letters, no watermark, no logo',
    'no busy background, no scenery clutter',
  ].join(', ');

  const negativePrompt = [
    'text', 'letters', 'numbers', 'caption', 'logo', 'watermark',
    'low contrast', 'blurry', 'grain', 'noise',
    'colorful', 'gradients', 'busy background',
  ].join(', ');

  const payload = {
    prompt: enhancedPrompt,
    negative_prompt: negativePrompt,
    width,
    height,
    steps: 10,
    cfg_scale: 6,
    sampler_index: "Euler a",
    batch_size: 1,
    n_iter: 1,
  };

  try {
    const data = await sdTxt2Img(payload);
    if (!data?.images?.[0]) throw new Error("SD WebUI returned no images");
    return `data:image/png;base64,${data.images[0]}`;
  } catch (e) {
    // Web-friendly fallback: procedural high-contrast silhouette image
    // (still uses the same image->ascii conversion afterwards).
    const fallback = proceduralSilhouette(prompt, aspectRatio);
    if (!fallback) throw e;
    return fallback;
  }
}

/**
 * Deterministically converts a base64 image to ASCII.
 */
export async function convertImageToAscii(base64Image: string, settings: AsciiSettings): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      try {
        resolve(processImage(img, settings));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error("Failed to load image for conversion"));
    img.src = base64Image;
  });
}

function processImage(img: HTMLImageElement, settings: AsciiSettings): string {
  const { width, contrast, inverted, rampIndex, threshold } = settings;
  const ramp = RAMPS[Math.max(0, Math.min(RAMPS.length - 1, rampIndex))];

  const height = Math.max(1, Math.floor((width / img.width) * img.height * ASPECT_CORRECTION));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  let out = "";
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];

      // Luminosity grayscale
      let gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;

      // Contrast boost around mid-gray
      gray = (gray - 128) * contrast + 128;
      gray = Math.max(0, Math.min(255, gray));

      let normalized = gray / 255;

      // Threshold for deep blacks
      if (normalized < threshold) normalized = 0;

      if (inverted) normalized = 1.0 - normalized;

      const maxIndex = ramp.length - 1;
      const charIndex = Math.floor(normalized * maxIndex);
      out += ramp[Math.max(0, Math.min(maxIndex, charIndex))];
    }
    out += "\n";
  }

  return out;
}

/**
 * Convenience: prompt -> image -> ascii.
 */
export async function generateAsciiFromPrompt(prompt: string, settings: AsciiSettings, aspectRatio: string = "3:2"): Promise<string> {
  const img = await generateSourceImage(prompt, aspectRatio);
  return convertImageToAscii(img, settings);
}
