import React from 'react';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
}

export const GlassButton: React.FC<GlassButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  ...props 
}) => {
  const baseClasses = "relative overflow-hidden rounded-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800",
    secondary: "bg-white/20 text-slate-900 border border-slate-200 hover:bg-white/40",
    danger: "bg-rose-500 text-white hover:bg-rose-600"
  };

  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      <div className="relative z-10 flex items-center justify-center gap-2">
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : children}
      </div>
    </button>
  );
};

export const GlassButtonV2 = GlassButton;
