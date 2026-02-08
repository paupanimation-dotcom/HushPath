import React, { memo } from 'react';

// Repeat a string enough times to fill most screens
const REPEAT_COUNT = 200;

export const AsciiSeparator = memo(({ pattern = "+--*==o==*--+", className = "" }: { pattern?: string; className?: string }) => (
  <div className={`w-full overflow-hidden whitespace-nowrap select-none font-mono leading-none opacity-50 ${className}`}>
    {pattern.repeat(REPEAT_COUNT)}
  </div>
));

export const VerticalAsciiSeparator = memo(({ pattern = "|", className = "" }: { pattern?: string; className?: string }) => (
  <div className={`h-full overflow-hidden flex flex-col items-center select-none font-mono leading-none opacity-30 w-4 shrink-0 justify-start ${className}`}>
    {Array.from({ length: 100 }).map((_, i) => (
      <span key={i} className="mb-1">{pattern}</span>
    ))}
  </div>
));

interface AsciiFrameProps {
  children: React.ReactNode;
  pattern?: 'thick' | 'ornate' | 'simple' | 'double' | 'info';
  className?: string;
  padX?: boolean;
}

const PATTERNS = {
  thick: {
    h: "|xxx{ }xxx/ \\xxx{ }xxx|",
    v: "}{",
  },
  ornate: {
    h: "*==o==*--+--*==o==*",
    v: "||",
  },
  simple: {
    h: "---------------------",
    v: "|",
  },
  double: {
    h: "=====================",
    v: "||",
  },
  info: {
    h: ".....................",
    v: ":",
  }
};

export const AsciiFrame = memo(({ children, pattern = 'thick', className = "", padX = true }: AsciiFrameProps) => {
  const p = PATTERNS[pattern];
  
  return (
    <div className={`inline-flex flex-col items-center relative ${className}`}>
      {/* Top Border - w-0 min-w-full prevents the long text from expanding the container */}
      <div className="w-0 min-w-full overflow-hidden whitespace-nowrap font-mono text-xs leading-[0.8] text-[#555] select-none shrink-0 z-10 text-center">
        {p.h.repeat(REPEAT_COUNT)}
      </div>

      <div className="relative flex min-h-0 w-full">
        {/* Left Border - Absolute */}
        <div className="absolute left-0 top-0 bottom-0 w-3 overflow-hidden font-mono text-xs leading-[1] text-[#555] select-none flex flex-col items-center justify-start py-0 z-10">
            {Array.from({ length: 80 }).map((_, i) => (
               <div key={i} className="mb-0.5">{p.v}</div>
            ))}
        </div>

        {/* Content */}
        <div className={`flex-1 relative overflow-hidden ${padX ? 'px-4 md:px-6' : 'px-3'} mx-2`}>
            {children}
        </div>

        {/* Right Border - Absolute */}
        <div className="absolute right-0 top-0 bottom-0 w-3 overflow-hidden font-mono text-xs leading-[1] text-[#555] select-none flex flex-col items-center justify-start py-0 z-10">
             {Array.from({ length: 80 }).map((_, i) => (
               <div key={i} className="mb-0.5">{p.v}</div>
            ))}
        </div>
      </div>

      {/* Bottom Border - w-0 min-w-full prevents expansion */}
      <div className="w-0 min-w-full overflow-hidden whitespace-nowrap font-mono text-xs leading-[0.8] text-[#555] select-none shrink-0 z-10 text-center">
        {p.h.repeat(REPEAT_COUNT)}
      </div>
    </div>
  );
});