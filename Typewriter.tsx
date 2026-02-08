
import React, { useState, useEffect, useRef, memo } from 'react';

let audioCtx: AudioContext | null = null;

export const initAudio = async () => {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (audioCtx.state === 'suspended') await audioCtx.resume();
};

const playBlip = () => {
  if (!audioCtx || audioCtx.state !== 'running') return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = 'square';
  osc.frequency.setValueAtTime(400 + Math.random() * 50, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.04);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.05);
};

export const Typewriter = memo(({ text, speed = 20, onComplete }: { text: string; speed?: number; onComplete?: () => void }) => {
  const [displayed, setDisplayed] = useState('');
  const idx = useRef(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    setDisplayed('');
    idx.current = 0;
    const type = () => {
      if (idx.current < text.length) {
        const char = text[idx.current];
        setDisplayed(prev => prev + char);
        if (/[a-zA-Z0-9]/.test(char)) playBlip();
        idx.current++;
        timer.current = window.setTimeout(type, speed);
      } else if (onComplete) onComplete();
    };
    timer.current = window.setTimeout(type, speed);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [text]);

  return <span>{displayed}</span>;
});
