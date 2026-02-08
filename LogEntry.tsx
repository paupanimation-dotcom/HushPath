
import React, { useState, memo } from 'react';
import { LogEntry as LogEntryType } from './types';
import { Typewriter } from './Typewriter';
import { AsciiTyper } from './AsciiTyper';

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
    <div className="flex justify-end my-4">
      <div className="bg-white text-black px-4 py-1 text-sm font-bold uppercase italic shadow-[4px_4px_0px_rgba(255,255,255,0.3)]">
        {entry.content}
      </div>
    </div>
  );

  return (
    <div className="my-6 text-lg md:text-xl leading-relaxed border-l-2 border-white/10 pl-6 opacity-90">
      {entry.isTyping && !done ? (
        <Typewriter text={entry.content} onComplete={() => { setDone(true); onComplete(); }} />
      ) : (
        <span className="whitespace-pre-wrap">{entry.content}</span>
      )}
    </div>
  );
});
