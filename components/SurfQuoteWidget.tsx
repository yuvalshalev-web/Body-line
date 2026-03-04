
import React, { useState, useEffect } from 'react';
import { Quote, RefreshCw, Waves, Sparkles } from 'lucide-react';
import { getRandomQuote, SurfQuote } from '../data/surfQuotes';

const SurfQuoteWidget: React.FC = () => {
  const [quote, setQuote] = useState<SurfQuote>(getRandomQuote());
  const [isAnimating, setIsAnimating] = useState(false);

  const handleRefresh = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setQuote(getRandomQuote());
      setIsAnimating(false);
    }, 500);
  };

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-sky-50 to-indigo-50 rounded-[3.5rem] border border-white shadow-xl p-12 md:p-16 group">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-500/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
      
      <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-sky-500">
            <Quote size={24} />
          </div>
        </div>

        <div className={`transition-all duration-500 transform ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
          <h3 className="text-3xl md:text-4xl font-black text-[#2B2B2E] leading-tight italic font-['Frank_Ruhl_Libre'] tracking-tight">
            "{quote.text}"
          </h3>
          <div className="flex items-center justify-center gap-4 mt-8">
            <div className="h-px w-8 bg-sky-200"></div>
            <p className="text-sm font-black text-sky-600 uppercase tracking-widest">{quote.author}</p>
            <div className="h-px w-8 bg-sky-200"></div>
          </div>
        </div>

        <div className="pt-6">
          <button 
            onClick={handleRefresh}
            className="group/btn flex items-center gap-3 px-8 py-4 bg-white text-[#2B2B2E] rounded-2xl font-black text-xs shadow-lg hover:shadow-xl hover:bg-slate-50 transition-all active:scale-95"
          >
            <RefreshCw 
              size={18} 
              className={`text-sky-500 transition-transform duration-500 ${isAnimating ? 'rotate-180' : 'group-hover/btn:rotate-180'}`} 
            />
            REFRESH VIBE
          </button>
        </div>
      </div>

      {/* Background Icons */}
      <Waves className="absolute bottom-10 right-10 text-sky-200/30 -rotate-12" size={80} />
      <Sparkles className="absolute top-10 left-10 text-indigo-200/30" size={40} />
    </section>
  );
};

export default SurfQuoteWidget;
