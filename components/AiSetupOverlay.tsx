import React, { useEffect, useMemo, useState } from 'react';

type Profile = 'lite' | 'standard' | 'high';

type SystemInfo = {
  platform: string;
  arch: string;
  totalMemGB: number;
  cpu: string;
};

type Status = {
  ok: boolean;
  missing: Array<{ key: string; path: string }>;
  aiRoot: string;
};

type Props = {
  onReady: () => void;
};

function pctBar(pct: number, width: number = 32): string {
  const clamped = Math.max(0, Math.min(100, pct));
  const filled = Math.round((clamped / 100) * width);
  return '[' + '#'.repeat(filled) + '-'.repeat(Math.max(0, width - filled)) + ']';
}

export function AiSetupOverlay({ onReady }: Props) {
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [installing, setInstalling] = useState(false);
  const [pct, setPct] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recommended: Profile = useMemo(() => {
    const mem = info?.totalMemGB ?? 16;
    if (mem < 8) return 'lite';
    if (mem < 16) return 'standard';
    return 'high';
  }, [info]);

  useEffect(() => {
    // If we are not in the desktop build, skip AI installer.
    if (!window.hushpathDesktop?.aiStatus) {
      onReady();
      return;
    }

    let unsubscribe: null | (() => void) = null;

    (async () => {
      try {
        const [sys, st] = await Promise.all([
          window.hushpathDesktop!.aiSystemInfo(),
          window.hushpathDesktop!.aiStatus(),
        ]);
        setInfo(sys);
        setStatus(st);
        if (st.ok) onReady();
      } catch (e: any) {
        setError(String(e?.message ?? e));
      }
    })();

    unsubscribe = window.hushpathDesktop.onAiProgress((p) => {
      if (typeof p?.pct === 'number') setPct(p.pct);
      if (typeof p?.message === 'string') setMessage(p.message);
    });

    return () => {
      try { unsubscribe?.(); } catch {}
    };
  }, [onReady]);

  const startInstall = async (profile: Profile) => {
    if (!window.hushpathDesktop?.aiInstall) return;
    setError(null);
    setInstalling(true);
    setPct(0);
    setMessage('Starting…');
    try {
      await window.hushpathDesktop.aiInstall({ profile });
      const st = await window.hushpathDesktop.aiStatus();
      setStatus(st);
      if (st.ok) onReady();
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setInstalling(false);
    }
  };

  // Only show if desktop build AND AI isn't ready
  if (!window.hushpathDesktop?.aiStatus) return null;
  if (status?.ok) return null;

  const missingLines = (status?.missing || []).slice(0, 6).map((m) => `- ${m.key}: ${m.path}`).join('\n');

  return (
    <div className="fixed inset-0 z-50 bg-black text-green-200 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl border border-green-700/50 rounded-xl p-6 bg-black/90 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-green-100">Hushpath AI Setup</h2>
            <p className="mt-2 text-sm text-green-300/80">
              This game uses free, open-source local models for story text + ASCII images.
              No API keys.
            </p>
          </div>
          <div className="text-right text-xs text-green-300/70">
            {info ? (
              <>
                <div>RAM: {info.totalMemGB} GB</div>
                <div className="mt-1">CPU: {info.cpu}</div>
              </>
            ) : (
              <div>Detecting system…</div>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-green-700/30 rounded-lg p-4">
            <div className="text-sm font-semibold text-green-100">What gets installed?</div>
            <ul className="mt-2 text-sm space-y-1 text-green-300/80 list-disc list-inside">
              <li><span className="text-green-200">Text engine</span> (llama.cpp) + a small instruct model</li>
              <li><span className="text-green-200">Image engine</span> (stable-diffusion.cpp) + SD v1.5 (monochrome-friendly)</li>
            </ul>
            <p className="mt-2 text-xs text-green-300/60">
              These files are downloaded once and stored here:
              <br />
              <span className="text-green-200 break-all">{status?.aiRoot || ''}</span>
            </p>
          </div>

          <div className="border border-green-700/30 rounded-lg p-4">
            <div className="text-sm font-semibold text-green-100">Status</div>
            <div className="mt-2 text-xs whitespace-pre-wrap text-green-300/70">
              {missingLines || 'Checking…'}
            </div>
          </div>
        </div>

        <div className="mt-5 border border-green-700/30 rounded-lg p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-green-100">Installer</div>
            <div className="text-xs text-green-300/70">Recommended: <span className="text-green-200">{recommended.toUpperCase()}</span></div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              disabled={installing}
              className="px-4 py-2 rounded bg-green-900/40 border border-green-600/60 hover:bg-green-900/60 disabled:opacity-50"
              onClick={() => startInstall(recommended)}
            >
              Install AI (Recommended)
            </button>
            <button
              disabled={installing}
              className="px-3 py-2 rounded bg-black border border-green-700/50 hover:bg-green-900/20 disabled:opacity-50"
              onClick={() => startInstall('lite')}
            >
              Lite
            </button>
            <button
              disabled={installing}
              className="px-3 py-2 rounded bg-black border border-green-700/50 hover:bg-green-900/20 disabled:opacity-50"
              onClick={() => startInstall('standard')}
            >
              Standard
            </button>
            <button
              disabled={installing}
              className="px-3 py-2 rounded bg-black border border-green-700/50 hover:bg-green-900/20 disabled:opacity-50"
              onClick={() => startInstall('high')}
            >
              High
            </button>
          </div>

          <div className="mt-4 text-xs text-green-200">
            {pctBar(pct)} <span className="ml-2">{Math.round(pct)}%</span>
          </div>
          <div className="mt-1 text-xs text-green-300/80">{message}</div>

          {error ? (
            <div className="mt-3 text-xs text-red-300 whitespace-pre-wrap">{error}</div>
          ) : null}

          <div className="mt-4 text-xs text-green-300/60">
            Tip: this uses the same “black background / high-contrast silhouette” technique as your ASCII Art Generator,
            so the ASCII stays clean and readable.
          </div>
        </div>
      </div>
    </div>
  );
}
