import React, { memo } from 'react';
import { AsciiTyper } from './AsciiTyper';
import { AsciiFrame } from './AsciiBorders';
import { AsciiLoader } from './AsciiLoader';

interface SceneDisplayProps {
  art: string;
  caption?: string;
  isLoading?: boolean;
}

export const SceneDisplay = memo(({ art, caption, isLoading }: SceneDisplayProps) => {
  return (
    <div className="w-full flex flex-col items-center justify-center p-4 md:p-6 bg-black border-b border-white/10 relative shrink-0 min-h-[400px] md:min-h-[500px]">
       
       <AsciiFrame pattern="thick" className="max-w-full w-full h-full flex flex-col">
            {/* Removed the overlay div that caused glitching */}
            
            {/* Screen Content - Fixed sizing logic */}
            <div className="w-full px-1 py-4 md:px-4 overflow-hidden flex justify-center items-center flex-1 relative bg-black">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                    <AsciiLoader />
                  </div>
                )}
                {/* Reverted to a cleaner font calculation, removed the dynamic clamp that was causing issues */}
                <div className="text-[10px] md:text-[14px] lg:text-[16px] leading-[0.85] tracking-tighter">
                    <AsciiTyper 
                        text={art || ""} 
                        speed={0.5} 
                        className="text-white block text-center whitespace-pre origin-center" 
                    />
                </div>
            </div>
       </AsciiFrame>

      {/* Caption */}
      <div className="mt-4 h-6 text-center w-full">
          {caption && (
            <div className="text-sm font-mono italic opacity-60 text-white tracking-wide animate-fade-in max-w-3xl mx-auto truncate">
            — {caption} —
            </div>
          )}
      </div>
    </div>
  );
});