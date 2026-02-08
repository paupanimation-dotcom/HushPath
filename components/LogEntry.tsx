import React, { useState, memo } from 'react';
import { LogEntry as LogEntryType } from '../types';
import { Typewriter } from './Typewriter';
import { AsciiTyper } from './AsciiTyper';

// Helper to wrap quoted text in a trembling span
const renderWithEffects = (text: string) => {
  // Regex to match "double quotes" or “curly quotes”
  const parts = text.split(/(".*?"|“.*?”)/g);
  return (
    <>
      {parts.map((part, i) => {
        // Check if the part starts/ends with quotes
        if ((part.startsWith('"') && part.endsWith('"')) || (part.startsWith('“') && part.endsWith('”'))) {
          return (
            <span key={i} className="inline-block animate-tremble text-white decoration-clone">
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

export const LogEntry = memo(({ entry, onComplete }: { entry: LogEntryType; onComplete: () => void }) => {
  const [done, setDone] = useState(false);

  if (entry.type === 'ascii') return (
    <div className="my-8 animate-fade-in">
      <div className="w-full border-t border-b border-white/20 py-4 overflow-hidden flex justify-center">
        <AsciiTyper text={entry.content} className="text-[5px] sm:text-[7px] md:text-[9px]" />
      </div>
      {entry.caption && <div className="mt-2 text-[10px] italic opacity-40 text-center">— {entry.caption} —</div>}
    </div>
  );

  if (entry.type === 'user') return (
    <div className="flex justify-end my-4 animate-fade-in">
      {/* Increased text size for user inputs */}
      <div className="bg-black text-white px-6 py-3 text-xl md:text-2xl font-mono border border-white/20 shadow-[2px_2px_0px_rgba(255,255,255,0.1)]">
        <span className="opacity-50 mr-3 text-lg">&gt;</span>
        {entry.isTyping && !done ? (
            <Typewriter 
                text={entry.content} 
                speed={15} 
                onComplete={() => { setDone(true); onComplete(); }} 
            />
        ) : (
            <span>{entry.content}</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="my-6 text-2xl md:text-3xl font-normal leading-relaxed border-l-2 border-white/10 pl-6 text-white">
      {entry.isTyping && !done ? (
        <Typewriter 
          text={entry.content} 
          processText={renderWithEffects} 
          onComplete={() => { setDone(true); onComplete(); }} 
        />
      ) : (
        <span className="whitespace-pre-wrap">{renderWithEffects(entry.content)}</span>
      )}
    </div>
  );
});