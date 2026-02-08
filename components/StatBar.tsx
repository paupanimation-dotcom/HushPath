import React from 'react';

export const StatBar = ({ label, value, max, pattern }: { label: string; value: number; max: number; pattern: string }) => {
  // Ensure value is valid
  const safeValue = isNaN(value) ? 0 : value;
  const safeMax = isNaN(max) || max === 0 ? 1 : max;
  
  const pct = Math.min(100, Math.max(0, (safeValue / safeMax) * 100));
  // 20 characters for the bar
  const totalChars = 20;
  const filledChars = Math.round((pct / 100) * totalChars);
  const emptyChars = totalChars - filledChars;
  
  const fillChar = pattern === 'diagonal' ? '/' : pattern === 'cross' ? 'x' : '=';
  
  // Create the string safely
  const filledStr = fillChar.repeat(Math.max(0, filledChars));
  const emptyStr = " ".repeat(Math.max(0, emptyChars));
  
  const barString = `[${filledStr}${emptyStr}]`;

  return (
    <div className="w-full mb-4 font-mono">
      <div className="flex justify-between text-[10px] uppercase tracking-tighter mb-1 opacity-60 text-white">
        <span>{label}</span>
        <span>{safeValue}/{safeMax}</span>
      </div>
      <div className="text-white whitespace-pre tracking-widest text-xs">
        {barString}
      </div>
    </div>
  );
};