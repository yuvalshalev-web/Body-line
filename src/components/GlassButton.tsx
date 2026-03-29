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
  const baseClasses = "group relative overflow-hidden rounded-2xl font-black transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";
  
  const variants = {
    primary: "bg-gradient-to-r from-sky-500 to-indigo-500 text-white hover:from-sky-400 hover:to-indigo-400 shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 backdrop-blur-sm border border-white/20",
    secondary: "bg-white/40 backdrop-blur-md text-slate-900 border border-white/60 shadow-[0_4px_15px_rgba(0,0,0,0.05)] hover:bg-white/60 hover:border-white hover:shadow-[0_10px_25px_rgba(0,0,0,0.08)]",
    danger: "bg-rose-500 text-white hover:bg-rose-600 shadow-[0_10px_30px_-10px_rgba(244,63,94,0.3)] hover:shadow-[0_20px_40px_-10px_rgba(244,63,94,0.4)]"
  };

  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {/* Shine effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
      </div>
      
      <div className="relative z-10 flex items-center justify-center gap-2 px-6 py-3">
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : children}
      </div>
    </button>
  );
};

export const GlassButtonV2 = GlassButton;
