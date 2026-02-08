import React from 'react';
import { JournalEntry } from '../types';

interface TimelineProps {
  entries: JournalEntry[];
  onClose: () => void;
}

export const Timeline: React.FC<TimelineProps> = ({ entries, onClose }) => {
  const sortedEntries = [...entries].sort((a, b) => b.turn - a.turn);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black p-4 animate-fade-in">
      <div className="relative w-full max-w-3xl h-[85vh] bg-black border border-white flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white bg-black">
          <div>
            <h2 className="text-2xl font-serif text-white tracking-wide font-bold">
              Journal
            </h2>
            <p className="text-sm text-white mt-1 italic">
              Your journey so far...
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 border border-white hover:bg-white hover:text-black text-white transition-colors uppercase text-xs tracking-widest"
          >
            Close
          </button>
        </div>

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-thin">
          {sortedEntries.length === 0 ? (
            <div className="flex h-full items-center justify-center flex-col text-white gap-3">
              <div className="text-4xl">📜</div>
              <p className="text-sm">The pages are empty.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {sortedEntries.map((entry, index) => (
                <div key={entry.id} className="relative pl-8 md:pl-10 before:absolute before:left-3 before:top-2 before:bottom-[-32px] before:w-px before:bg-white last:before:hidden group">
                  <div className={`
                     absolute left-0 top-2 w-6 h-6 border-2 border-white bg-black flex items-center justify-center
                  `}>
                    <div className={`w-2 h-2 bg-white`}></div>
                  </div>
                  
                  <div className="bg-black p-4 border border-white">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className="text-xs font-mono text-white uppercase tracking-widest">Turn {entry.turn}</span>
                      <span className="text-xs px-2 py-0.5 border border-white text-white uppercase">{entry.type}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">{entry.title}</h3>
                    <p className="text-white text-sm leading-relaxed">{entry.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};