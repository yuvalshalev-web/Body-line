
import React from 'react';
import { Newspaper, Calendar, ArrowLeft, ExternalLink, Sparkles, Zap, Activity, Info } from 'lucide-react';
import { NewsItem } from '../types';

interface NewsPageProps {
  news: NewsItem[];
}

const NewsPage: React.FC<NewsPageProps> = ({ news }) => {
  return (
    <div className="relative min-h-screen -m-6 p-6 md:-m-12 md:p-12 overflow-hidden bg-white text-right">
      {/* Dynamic Background Accents */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-blue-50/60 rounded-full blur-[120px] -mr-64"></div>
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-cyan-50/40 rounded-full blur-[130px]"></div>
      </div>

      <div className="relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest mb-3 border border-blue-100 shadow-sm">
            <Newspaper size={12} className="text-blue-500" />
            חדשות המערכת
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">מה חדש בקהילה?</h2>
          <p className="text-slate-500 mt-2 text-lg font-medium">הישארו מעודכנים בכל הפעילויות וההודעות האחרונות של חבל זוג.</p>
        </div>

        <div className="grid grid-cols-1 gap-14">
          {news.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((item) => (
            <article 
              key={item.id} 
              className="group flex flex-col lg:flex-row gap-10 bg-white p-4 rounded-[4rem] border border-slate-100 hover:shadow-[0_40px_100px_-20px_rgba(59,130,246,0.1)] transition-all duration-700 hover:-translate-y-1"
            >
              {item.imageUrl && (
                <div className="lg:w-2/5 aspect-[16/10] lg:aspect-square rounded-[3rem] overflow-hidden relative shadow-2xl shadow-blue-100/20">
                  <img 
                    src={item.imageUrl} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent"></div>
                  <div className="absolute bottom-6 right-6">
                     <div className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        {item.category === 'Update' ? <Info size={12} /> : item.category === 'Activity' ? <Activity size={12} /> : <Zap size={12} />}
                        {item.category === 'Update' ? 'עדכון' : item.category === 'Activity' ? 'פעילות' : 'הודעה'}
                     </div>
                  </div>
                </div>
              )}
              
              <div className={`flex-1 flex flex-col justify-center p-8 lg:p-14 ${!item.imageUrl ? 'text-center items-center' : ''}`}>
                <div className="flex items-center gap-4 mb-6 text-slate-400">
                  <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em]">
                    <Calendar size={14} className="text-blue-500" />
                    {new Date(item.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>

                <h3 className="text-3xl sm:text-4xl font-black text-slate-950 mb-8 group-hover:text-blue-600 transition-colors tracking-tighter leading-tight">
                  {item.title}
                </h3>
                
                <div className="text-slate-500 font-bold leading-relaxed mb-10 text-lg whitespace-pre-wrap italic">
                  {item.content}
                </div>

                <button className="flex items-center gap-3 text-slate-950 font-black text-xs uppercase tracking-[0.4em] group/btn hover:text-blue-600 transition-colors w-fit">
                  קרא עוד
                  <ArrowLeft size={18} className="text-blue-500 group-hover/btn:translate-x-[-8px] transition-transform" />
                </button>
              </div>
            </article>
          ))}

          {news.length === 0 && (
            <div className="py-40 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100 flex flex-col items-center">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 text-slate-200">
                <Newspaper size={48} />
              </div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">שקט במערכת</h3>
              <p className="text-slate-400 mt-2 font-medium text-lg">אין עדכונים חדשים כרגע. נשמור אתכם מעודכנים!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsPage;
