
import React, { useState, useEffect, useRef, memo } from 'react';

export const AsciiTyper = memo(({ text, speed = 1, className = "" }: { text: string; speed?: number; className?: string }) => {
  const [displayed, setDisplayed] = useState('');
  const idx = useRef(0);

  useEffect(() => {
    const type = () => {
      if (idx.current < text.length) {
        idx.current += 30; // High speed block typing
        setDisplayed(text.substring(0, idx.current));
        setTimeout(type, speed);
      }
    };
    type();
  }, [text]);

  return <pre className={`font-mono leading-none select-none ${className}`}>{displayed}</pre>;
});
