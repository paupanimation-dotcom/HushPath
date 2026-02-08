import React, { useEffect, useRef } from 'react';
import { StoryPanel } from '../types';
import { AsciiFrame, AsciiSeparator } from './AsciiBorders';

interface StoryViewProps {
  panels: StoryPanel[];
  onClose: () => void;
}

export const StoryView: React.FC<StoryViewProps> = ({ panels, onClose }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on open
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm animate-fade-in p-4 md:p-8">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h2 className="text-3xl font-mono font-normal text-white tracking-widest">CHRONICLE</h2>
          <AsciiSeparator pattern="-" className="max-w-xs mt-2 text-white/50"/>
        </div>
        <button 
          onClick={onClose}
          className="outline-none"
        >
          <AsciiFrame pattern="simple" className="text-white hover:bg-white hover:text-black transition-colors">
            <span className="px-6 py-2 font-mono uppercase text-xs tracking-widest block">Close Book</span>
          </AsciiFrame>
        </button>
      </div>

      <AsciiSeparator pattern="=" className="mb-8 text-white/30" />

      {/* Comic Grid */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto custom-scrollbar pr-2"
      >
        <div className="max-w-3xl mx-auto space-y-12 pb-12">
          {panels.length === 0 ? (
            <div className="text-center py-20 opacity-30 font-mono text-white">
              The pages are blank. Your story has not yet begun.
            </div>
          ) : (
            panels.map((panel, index) => (
              <div key={panel.id} className="group w-full">
                
                {/* Panel Container */}
                <AsciiFrame pattern="thick" className="w-full shadow-[8px_8px_0px_rgba(255,255,255,0.1)] transition-transform hover:translate-y-[-2px]">
                <div className="bg-black p-4 w-full overflow-hidden">
                  
                  {/* Action Caption REMOVED per user request */}

                  {/* Visual Art - FIXED SCALING & WRAPPING ISSUES */}
                  {panel.art && panel.art.trim().length > 0 && (
                    <div className="mb-6 bg-black relative flex items-center justify-center py-4 border border-white/10 min-h-[150px]">
                       {/* Added overflow-x-auto to handle wide ascii without breaking layout */}
                       <div className="w-full overflow-x-auto custom-scrollbar flex justify-center">
                          {/* 
                             CRITICAL FIX: 
                             1. whitespace-pre: Forces text NOT to wrap. 
                             2. font sizes: Matched strictly to main game display.
                          */}
                          <pre className="text-[10px] md:text-[14px] lg:text-[16px] leading-[0.85] tracking-tighter text-white whitespace-pre font-mono text-center mx-auto">
                             {panel.art}
                          </pre>
                       </div>
                       
                       {/* Panel Number Badge */}
                       <div className="absolute top-0 right-0 bg-white text-black text-xs px-2 py-1 font-mono z-20 opacity-50">
                         #{index + 1}
                       </div>
                    </div>
                  )}

                  {/* Location Header */}
                  <div className="flex justify-between items-baseline mb-4 opacity-60 text-xs font-mono uppercase tracking-widest pb-2 text-white">
                    <span>{panel.location}</span>
                    <span>Turn {panel.turn}</span>
                  </div>
                  <AsciiSeparator pattern=".-" className="mb-4 text-white/20" />

                  {/* Narrative Text */}
                  <div className="font-mono text-xl md:text-2xl font-normal leading-relaxed text-white text-justify opacity-90">
                    {panel.narrative}
                  </div>

                </div>
                </AsciiFrame>
                
                {/* Gutter Connector */}
                {index < panels.length - 1 && (
                  <div className="flex justify-center my-4 opacity-30">
                     <span className="font-mono text-xl">| | |</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};