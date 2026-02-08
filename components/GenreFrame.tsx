import React from 'react';

// SIDE PATTERN: DNA / Chain mix
const SIDE_PATTERN_CSS = `
data:image/svg+xml;utf8,<svg width="12" height="40" viewBox="0 0 12 40" xmlns="http://www.w3.org/2000/svg"><path d="M6 0 C 2 10, 2 10, 6 20 C 10 30, 10 30, 6 40" stroke="%23333" fill="none" vector-effect="non-scaling-stroke"/></svg>
`;

export const GenreFrame = ({ children }: { children?: React.ReactNode }) => {
  return (
    <div className="flex flex-col h-full w-full relative bg-black">
      
      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        {/* Visual Side Borders */}
        <div className="absolute left-0 top-0 bottom-0 w-3 md:w-6 bg-repeat-y opacity-30 hidden md:block border-r border-white/5" 
             style={{ backgroundImage: `url('${SIDE_PATTERN_CSS}')`, backgroundSize: '100% 40px' }}></div>
        <div className="absolute right-0 top-0 bottom-0 w-3 md:w-6 bg-repeat-y opacity-30 hidden md:block border-l border-white/5" 
             style={{ backgroundImage: `url('${SIDE_PATTERN_CSS}')`, backgroundSize: '100% 40px' }}></div>

        {/* Content Container */}
        <div className="flex-1 flex flex-col h-full md:px-8">
            {children}
        </div>
      </div>

    </div>
  );
};