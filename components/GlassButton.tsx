import React, { useRef, useState } from 'react';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  noGradient?: boolean;
}

export function GlassButton({ children, className = '', noGradient = false, ...props }: GlassButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [background, setBackground] = useState<string | undefined>(undefined);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (noGradient) return;
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setBackground(`radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 60%)`);
  };

  const handleMouseLeave = () => {
    if (noGradient) return;
    setBackground(undefined);
  };

  return (
    <button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`hd-glass-button ${className}`}
      style={{ background }}
      {...props}
    >
      <span className="button-text flex items-center justify-center gap-2">{children}</span>
    </button>
  );
}

// --- APPENDED CODE: V2 ---
export function GlassButtonV2({ children, className = '', noGradient = false, ...props }: GlassButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [background, setBackground] = useState<string | undefined>(undefined);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (noGradient) return;
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setBackground(`radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.1) 70%)`);
  };

  const handleMouseLeave = () => {
    if (noGradient) return;
    setBackground(undefined);
  };

  return (
    <button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 px-6 py-3 font-bold text-white shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] backdrop-blur-[15px] transition-all duration-300 hover:scale-105 hover:border-white/40 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.5)] active:scale-95 ${className}`}
      {...props}
    >
      {/* Interactive Gradient Overlay */}
      {!noGradient && (
        <div 
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{ background, opacity: background ? 1 : 0 }}
        />
      )}
      <span className="relative z-10 flex items-center justify-center gap-2 drop-shadow-md">{children}</span>
    </button>
  );
}
