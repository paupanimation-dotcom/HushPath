
import React, { useState, useEffect, useRef, memo } from 'react';

interface InteractiveMapProps {
  currentChunk: string;
  coords: { x: number, y: number };
  className?: string;
}

// Strict sizing for map chunks to ensure seamless stitching
// We will force the font size and line height in the CSS to match these values.
const FONT_SIZE_PX = 10;
const LINE_HEIGHT_PX = 10;
const CHAR_WIDTH_PX = 6; // Approximate width for Courier New at 10px. 0.6em usually.

const COLS = 30;
const ROWS = 16;

const CHUNK_W_PX = COLS * CHAR_WIDTH_PX; 
const CHUNK_H_PX = ROWS * LINE_HEIGHT_PX;

export const InteractiveMap = memo(({ currentChunk, coords, className = "" }: InteractiveMapProps) => {
  const [knownChunks, setKnownChunks] = useState<Record<string, string>>({});
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  // Update known chunks
  useEffect(() => {
    if (currentChunk && coords) {
      const key = `${coords.x},${coords.y}`;
      setKnownChunks(prev => {
        if (prev[key] === currentChunk) return prev;
        return { ...prev, [key]: currentChunk };
      });

      // Auto-center on first load only, or if player is far off screen? 
      // Let's simple center if it's the very first chunk loaded.
      if (!initialized.current && containerRef.current) {
        const cw = containerRef.current.clientWidth;
        const ch = containerRef.current.clientHeight;
        setPan({
            x: (cw / 2) - (coords.x * CHUNK_W_PX) - (CHUNK_W_PX / 2),
            y: (ch / 2) - (coords.y * CHUNK_H_PX) - (CHUNK_H_PX / 2)
        });
        initialized.current = true;
      }
    }
  }, [currentChunk, coords.x, coords.y]);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setLastMouse({ x: clientX, y: clientY });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    // e.preventDefault(); // allow default only if we want browser gestures, but for map we usually want to prevent
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const dx = clientX - lastMouse.x;
    const dy = clientY - lastMouse.y;
    
    setPan(p => ({ x: p.x + dx, y: p.y + dy }));
    setLastMouse({ x: clientX, y: clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden bg-black cursor-move select-none ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
      style={{ touchAction: 'none' }}
    >
      <div className="absolute top-2 right-2 z-10 text-[10px] text-white/40 bg-black/50 px-1 pointer-events-none font-mono">
        COORDS: {coords.x}, {coords.y}
      </div>

      {/* Map Surface */}
      <div 
        className="absolute will-change-transform"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
      >
        {Object.entries(knownChunks).map(([key, chunk]) => {
          const [cx, cy] = key.split(',').map(Number);
          return (
            <div 
              key={key}
              className="absolute bg-black"
              style={{
                left: cx * CHUNK_W_PX,
                top: cy * CHUNK_H_PX,
                width: CHUNK_W_PX, 
                height: CHUNK_H_PX
              }}
            >
               <pre 
                 className="text-white/90 whitespace-pre font-mono overflow-hidden"
                 style={{
                    fontSize: `${FONT_SIZE_PX}px`,
                    lineHeight: `${LINE_HEIGHT_PX}px`,
                    width: '100%',
                    height: '100%',
                    letterSpacing: '0px'
                 }}
               >
                 {chunk}
               </pre>
            </div>
          );
        })}
        
        {/* Player Position Indicator (Centered in current sector) */}
        <div 
            className="absolute w-1.5 h-1.5 bg-white rounded-full animate-pulse pointer-events-none shadow-[0_0_8px_rgba(255,255,255,0.8)]"
            style={{
                left: coords.x * CHUNK_W_PX + (CHUNK_W_PX / 2),
                top: coords.y * CHUNK_H_PX + (CHUNK_H_PX / 2),
                transform: 'translate(-50%, -50%)'
            }}
        />
      </div>

      {/* Fog/Empty State Hint */}
      {Object.keys(knownChunks).length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-white/20 text-xs font-mono">NO MAP DATA</span>
          </div>
      )}
    </div>
  );
});
