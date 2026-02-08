
import React from 'react';

export const StatBar = ({ label, val, max, pattern }: { label: string; val: number; max: number; pattern: string }) => {
  const pct = Math.min(100, Math.max(0, (val / max) * 100));
  return (
    <div className="w-full mb-4">
      <div className="flex justify-between text-[10px] uppercase tracking-tighter mb-1 font-mono opacity-60">
        <span>{label}</span>
        <span>{val}/{max}</span>
      </div>
      <div className="h-2 w-full border border-white bg-black overflow-hidden">
        <div 
          className={`h-full bg-white transition-all duration-700 pattern-${pattern}`} 
          style={{ width: `${pct}%` }} 
        />
      </div>
    </div>
  );
};
