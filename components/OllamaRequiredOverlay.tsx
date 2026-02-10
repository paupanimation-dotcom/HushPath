import React, { useEffect, useMemo, useState } from 'react';

type Props = {
  onReady: () => void;
};

const DEFAULT_URL = 'http://127.0.0.1:11434';
const MODEL_CHOICES = [
  { id: 'qwen2.5:14b', label: 'Qwen2.5 14B (recomendado: calidad/velocidad)' },
  { id: 'qwen2.5:32b', label: 'Qwen2.5 32B (mejor calidad, más lento)' },
  { id: 'llama3.1:8b', label: 'Llama 3.1 8B (rápido, menos calidad)' },
];

function readLS(key: string, fallback: string) {
  try {
    return (localStorage.getItem(key) || fallback).trim();
  } catch {
    return fallback;
  }
}

function writeLS(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

async function pingOllama(url: string) {
  const r = await fetch(`${url.replace(/\/$/, '')}/api/tags`, { method: 'GET' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export function OllamaRequiredOverlay({ onReady }: Props) {
  const origin = useMemo(() => window.location.origin, []);

  const [url, setUrl] = useState(() => readLS('hushpath_ollama_url', DEFAULT_URL));
  const [model, setModel] = useState(() => readLS('hushpath_ollama_model', 'qwen2.5:14b'));

  const [checking, setChecking] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelsFound, setModelsFound] = useState<string[]>([]);

  const check = async () => {
    setChecking(true);
    setError(null);
    try {
      writeLS('hushpath_ollama_url', url);
      writeLS('hushpath_ollama_model', model);

      const data = await pingOllama(url);
      const names = Array.isArray(data?.models) ? data.models.map((m: any) => String(m?.name || '')).filter(Boolean) : [];
      setModelsFound(names);

      // Connection is fine; game can run.
      setOk(true);
      onReady();
    } catch (e: any) {
      setOk(false);
      setModelsFound([]);
      const msg = String(e?.message || e);
      setError(
        `No puedo conectar con Ollama en ${url}.\n` +
          `Error: ${msg}\n\n` +
          `Esto suele ser por:\n` +
          `• Ollama no está instalado / no está abierto\n` +
          `• CORS bloqueado (Ollama no permite el Origin del navegador)\n` +
          `• Firewall / antivirus\n`
      );
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    // Auto-check once on mount (non-blocking UX)
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cmds = useMemo(() => {
    const originLine = origin;
    return [
      `# 1) Instala Ollama (Windows): https://ollama.com`,
      `# 2) Descarga un modelo (elige uno):`,
      `ollama pull ${model}`,
      `# 3) Permite que la web pueda llamar a Ollama (CORS):`,
      `# PowerShell (solo para esta sesión):`,
      `$env:OLLAMA_ORIGINS="${originLine}"; ollama serve`,
      `# Alternativa (permanente, requiere reiniciar sesión/PC):`,
      `setx OLLAMA_ORIGINS "${originLine}"`,
      `# 4) Vuelve a esta pestaña y pulsa "Reintentar".`,
    ].join('\n');
  }, [model, origin]);

  const copyCmds = async () => {
    try {
      await navigator.clipboard.writeText(cmds);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-green-200 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl border border-green-700/50 rounded-xl p-6 bg-black/90 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-green-100">Hushpath necesita Ollama</h2>
            <p className="mt-2 text-sm text-green-300/80">
              Sin API keys. La IA corre en tu PC con <span className="text-green-200">Ollama</span>.
              Esta web se conecta a <span className="text-green-200">localhost</span>.
            </p>
          </div>
          <div className="text-right text-xs text-green-300/70">
            <div>Origin: <span className="text-green-200">{origin}</span></div>
            <div className="mt-1">Ollama URL: <span className="text-green-200">{url}</span></div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-green-700/30 rounded-lg p-4">
            <div className="text-sm font-semibold text-green-100">1) Ajustes</div>

            <label className="mt-3 block text-xs text-green-300/70">URL de Ollama</label>
            <input
              className="mt-1 w-full bg-black border border-green-700/50 rounded px-3 py-2 text-green-100 font-mono text-sm"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={DEFAULT_URL}
            />

            <label className="mt-3 block text-xs text-green-300/70">Modelo</label>
            <select
              className="mt-1 w-full bg-black border border-green-700/50 rounded px-3 py-2 text-green-100 font-mono text-sm"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              {MODEL_CHOICES.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>

            {modelsFound.length > 0 ? (
              <div className="mt-3 text-xs text-green-300/70">
                Modelos detectados en tu Ollama: <span className="text-green-200">{modelsFound.slice(0, 6).join(', ')}</span>
                {modelsFound.length > 6 ? <span>…</span> : null}
              </div>
            ) : null}
          </div>

          <div className="border border-green-700/30 rounded-lg p-4">
            <div className="text-sm font-semibold text-green-100">2) Instalar / Permitir</div>
            <p className="mt-2 text-xs text-green-300/70 whitespace-pre-wrap">
              {cmds}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="px-3 py-2 rounded bg-black border border-green-700/50 hover:bg-green-900/20"
                onClick={copyCmds}
                type="button"
              >
                Copiar comandos
              </button>
            </div>
            <p className="mt-3 text-[11px] text-green-300/60">
              Nota: En muchas PCs, el navegador permite llamar a <span className="text-green-200">http://localhost</span> aunque la web esté en HTTPS, pero <span className="text-green-200">CORS</span> debe estar permitido.
            </p>
          </div>
        </div>

        <div className="mt-5 border border-green-700/30 rounded-lg p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-green-100">Estado</div>
            <div className={`text-xs ${ok ? 'text-green-200' : 'text-yellow-200'}`}>{ok ? 'OK' : 'No conectado'}</div>
          </div>

          {error ? (
            <div className="mt-3 text-xs text-red-300 whitespace-pre-wrap">{error}</div>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              disabled={checking}
              className="px-4 py-2 rounded bg-green-900/40 border border-green-600/60 hover:bg-green-900/60 disabled:opacity-50"
              onClick={check}
              type="button"
            >
              {checking ? 'Comprobando…' : 'Reintentar'}
            </button>
          </div>

          <div className="mt-4 text-xs text-green-300/60">
            Consejo de calidad: si tu PC lo aguanta, usa <span className="text-green-200">qwen2.5:32b</span>. Si va lento, baja a <span className="text-green-200">qwen2.5:14b</span>.
          </div>
        </div>
      </div>
    </div>
  );
}
