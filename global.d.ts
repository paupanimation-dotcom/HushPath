export {};

declare global {
  interface Window {
    hushpathDesktop?: {
      // Text engine (OpenAI-compatible llama.cpp server behind the scenes)
      ollamaChat: (body: any) => Promise<any>;
      ollamaGenerate: (body: any) => Promise<any>;

      // Image engine (stable-diffusion.cpp)
      sdTxt2Img: (body: any) => Promise<{ images: string[] }>; // base64 PNG(s)

      // First-run AI installer
      aiSystemInfo: () => Promise<{ platform: string; arch: string; totalMemGB: number; cpu: string }>;
      aiStatus: () => Promise<{ ok: boolean; missing: Array<{ key: string; path: string }>; aiRoot: string }>;
      aiInstall: (body?: { profile?: 'lite' | 'standard' | 'high' }) => Promise<any>;
      onAiProgress: (
        handler: (payload: { pct: number; message: string; profile?: string; totalMemGB?: number }) => void
      ) => () => void;
    };
  }
}
