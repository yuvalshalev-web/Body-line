import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Waves, 
  Sparkles, 
  Zap,
  Tag
} from 'lucide-react';
import { SURF_DICTIONARY } from '../data/surfDictionary';

const categories = ["הכל", "ציוד", "תנאים", "טכניקה", "הגל", "תרבות", "פויל"];

const GlossaryPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('הכל');

  const filteredTerms = useMemo(() => {
    return SURF_DICTIONARY.filter(item => {
      const matchesSearch = 
        item.term.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.definition.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'הכל' || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, activeCategory]);

  return (
    <div className="min-h-screen bg-white text-right animate-in fade-in duration-700 pb-20" dir="rtl">
      {/* Body-line Standard Header Stack */}
      <div className="surfboard-hero-container mb-10 space-y-4 pt-10">
        {/* Top Badge */}
        <div className="header-badge-glass">
          <BookOpen size={12} className="text-[#00f2fe]" />
          <span>THE SURFER'S ENCYCLOPEDIA</span>
        </div>

        {/* Main Title */}
        <h1 className="main-page-title">
          <span className="surfer-title">מילון הגלישה</span>
        </h1>

        {/* Subtitle with Emoji context */}
        <div className="flex flex-col items-center gap-6">
          <p className="header-subtitle max-w-2xl">
            כל המושגים, הסלנג והטכנולוגיה שמאחורי עולם הגלישה. דבר בשפה של הים 🌊
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <section className="sticky top-20 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100 py-8 mb-12">
        <div className="flex flex-col gap-6">
          <div className="relative group">
            <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-sky-500 transition-colors" size={24} />
            <input 
              type="text" 
              placeholder="חפש מונח, הסבר או ביצוע..." 
              className="w-full pr-16 pl-8 py-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] font-black text-lg outline-none focus:bg-white focus:ring-4 ring-sky-500/5 transition-all shadow-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4 overflow-x-auto pb-2 no-scrollbar px-2">
            <div className="p-3 bg-slate-100 rounded-2xl text-slate-400">
              <Filter size={18} />
            </div>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-8 py-3 rounded-2xl font-black text-xs transition-all whitespace-nowrap shadow-sm border ${
                  activeCategory === cat 
                    ? 'bg-sky-500 border-sky-500 text-white shadow-sky-200' 
                    : 'bg-white border-slate-100 text-slate-400 hover:border-sky-200 hover:text-sky-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2">
        {filteredTerms.length > 0 ? filteredTerms.map((item) => (
          <div 
            key={item.id} 
            className="group relative flex flex-col bg-white rounded-[3rem] border border-slate-100 p-10 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
          >
            <div className="flex items-start justify-between mb-6">
              <span className="px-4 py-1.5 bg-sky-50 text-sky-600 rounded-full text-[12px] font-black uppercase tracking-widest flex items-center gap-2">
                <Tag size={10} />
                {item.category}
              </span>
              <Sparkles className="text-indigo-100 group-hover:text-indigo-500 transition-colors" size={20} />
            </div>

            <h3 className="text-3xl font-black text-[#2B2B2E] mb-6 group-hover:text-sky-600 transition-colors leading-tight">
              {item.term}
            </h3>

            <div className="h-px w-12 bg-slate-100 mb-6 group-hover:w-24 transition-all duration-700"></div>

            <p className="text-slate-500 font-bold text-lg leading-relaxed line-clamp-4">
              {item.definition}
            </p>

            <div className="absolute bottom-6 left-10 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
              <div className="w-10 h-10 bg-slate-950 text-white rounded-xl flex items-center justify-center">
                <Zap size={18} />
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-40 text-center bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-100 flex flex-col items-center">
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-8 text-slate-200 shadow-xl">
              <Search size={48} />
            </div>
            <h3 className="text-3xl font-black text-[#2B2B2E] mb-2">לא מצאנו את המונח הזה...</h3>
            <p className="text-slate-400 font-bold italic">אולי הוא עוד לא נכנס לליין-אפ שלנו.</p>
          </div>
        )}
      </div>

      {/* Footer Decoration */}
      <div className="mt-24 pt-12 border-t border-slate-100 flex flex-col items-center gap-6">
        <div className="flex items-center gap-2 text-slate-300 font-black text-[12px] uppercase tracking-[0.4em]">
          <Waves size={16} />
          End of Lineup
          <Waves size={16} />
        </div>
      </div>
    </div>
  );
};

export default GlossaryPage;
