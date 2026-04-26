import React from 'react';
import { useData } from '../contexts/DataContext';
import { Newspaper, User, Calendar } from 'lucide-react';
import { useRandomHeader } from '../hooks/useRandomHeader';

const NewsPage: React.FC = () => {
  const headerImage = useRandomHeader();
  const { news } = useData();

  // Sort news by date (newest first)
  const sortedNews = [...news].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 pb-20" dir="rtl">
      {/* Body-line Standard Header Stack */}
      <div className="surfboard-hero-container mb-0 space-y-2 header-wallpaper !py-12 pb-24" style={{ '--bg-image': `url(${headerImage})` } as React.CSSProperties}>
        <div className="header-content-wrapper relative z-20">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-sky-500/10 text-sky-500 mb-2 shadow-sm border border-sky-500/20 relative z-10">
            <Newspaper size={40} />
          </div>
          <h1 className="main-page-title">
            <span className="surfer-title text-[#121212]">לוח פוסטים</span>
          </h1>
          <p className="header-subtitle max-w-2xl mx-auto text-[#121212]">
            עדכונים, חדשות ופוסטים מהקהילה.
          </p>
        </div>
      </div>

      <div className="relative z-30 -mt-16 mx-4 md:mx-0 space-y-8">
        {sortedNews.map(item => (
          <div key={item.id} className="luxury-card p-6 md:p-8 relative overflow-hidden transition-all group">
            <div className="grain-overlay opacity-[0.03]" />
            <div className="premium-sweep-fx opacity-10" />
            
            <div className="flex items-center gap-4 mb-6 relative z-10">
              {item.authorAvatar ? (
                <img src={item.authorAvatar} alt={item.authorName} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <User size={24} />
                </div>
              )}
              <div>
                <h3 className="font-bold text-slate-900">{item.authorName}</h3>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Calendar size={14} />
                  {new Date(item.date).toLocaleDateString('he-IL')}
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-black text-slate-900 mb-4">{item.title}</h2>
            
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap mb-6">
              {item.content}
            </p>

            {item.imageUrl && (
              <div className="rounded-2xl overflow-hidden bg-slate-100">
                <img src={item.imageUrl} alt={item.title} className="w-full h-auto max-h-[500px] object-contain" />
              </div>
            )}
          </div>
        ))}

        {news.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
            <Newspaper className="mx-auto text-slate-300 mb-4" size={64} />
            <h3 className="text-2xl font-bold text-slate-400">אין פוסטים עדיין</h3>
            <p className="text-slate-500 mt-2">הפוסטים הראשונים יופיעו כאן בקרוב</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsPage;
