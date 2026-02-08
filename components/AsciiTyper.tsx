import React, { useState, useEffect, useRef, memo } from 'react';

export const AsciiTyper = memo(({ text, speed = 1, className = "" }: { text: string; speed?: number; className?: string }) => {
  const [displayed, setDisplayed] = useState('');
  const idx = useRef(0);
  // Normalize newlines
  const cleanText = text.replace(/\\n/g, '\n');

  useEffect(() => {
    // If speed is very low (fast) or text is huge, just show it immediately to prevent lag
    if (speed <= 0.5) {
      setDisplayed(cleanText);
      return;
    }

    setDisplayed('');
    idx.current = 0;

    const type = () => {
      if (idx.current < cleanText.length) {
        // Typing chunk size
        const chunk = 50; 
        idx.current = Math.min(idx.current + chunk, cleanText.length);
        setDisplayed(cleanText.substring(0, idx.current));
        setTimeout(type, speed);
      }
    };
    type();
  }, [cleanText, speed]);

  // Removed internal leading/font classes to allow parent to control size completely
  return <pre className={`font-mono select-none ${className}`}>{displayed}</pre>;
});