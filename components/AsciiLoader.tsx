
import React, { useState, useEffect, memo } from 'react';

export const AsciiLoader = memo(({ className = "" }: { className?: string }) => {
  const frames = [
    "[       ]",
    "[=      ]",
    "[==     ]",
    "[===    ]",
    "[====   ]",
    "[=====  ]",
    "[====== ]",
    "[=======]"
  ];
  
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % frames.length);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center gap-2 opacity-50 ${className}`}>
      <div className="font-mono text-xs whitespace-pre animate-pulse text-[#d4d4d4]">
        LOADING DATA...
      </div>
      <div className="font-mono text-sm whitespace-pre text-[#d4d4d4]">
        {frames[frame]}
      </div>
    </div>
  );
});
