import React, { useRef, useState } from 'react';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function GlassButton({ children, className = '', ...props }: GlassButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [background, setBackground] = useState<string | undefined>(undefined);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setBackground(`radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 60%)`);
  };

  const handleMouseLeave = () => {
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
