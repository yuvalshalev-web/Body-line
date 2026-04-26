import React, { useState, useEffect } from 'react';
import { Globe, ExternalLink, Clock, Loader2 } from 'lucide-react';
import { useRandomHeader } from '../hooks/useRandomHeader';

interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
  thumbnail: string;
  source: string;
}

const RSS_FEEDS = [
  { name: 'Surfer Magazine', url: 'https://www.surfer.com/feed' },
  { name: 'Stab Magazine', url: 'https://stabmag.com/feed/' },
  { name: 'The Inertia', url: 'https://www.theinertia.com/feed/' }
];

const SurfingNewsPage: React.FC = () => {
  const headerImage = useRandomHeader();
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const allNews: NewsArticle[] = [];
        
        for (const feed of RSS_FEEDS) {
          try {
            const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`);
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
              throw new Error(`Received non-JSON response from server: ${contentType}`);
            }
            const data = await response.json();
            
            if (data.status === 'ok') {
              const items = data.items.slice(0, 10).map((item: any) => {
                // Try to find image in enclosure, thumbnail, or content
                let imageUrl = item.thumbnail || item.enclosure?.link || '';
                if (!imageUrl && item.content) {
                  const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
                  if (imgMatch) imageUrl = imgMatch[1];
                }
                if (!imageUrl && item.description) {
                  const imgMatch = item.description.match(/<img[^>]+src="([^">]+)"/);
                  if (imgMatch) imageUrl = imgMatch[1];
                }

                return {
                  title: item.title,
                  link: item.link,
                  pubDate: item.pubDate,
                  thumbnail: imageUrl,
                  source: feed.name
                };
              });
              allNews.push(...items);
            }
          } catch (err) {
            console.warn(`Failed to fetch from ${feed.name}:`, err);
          }
        }

        // Sort by date descending
        allNews.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
        setNews(allNews);
      } catch (err) {
        setError('שגיאה בטעינת החדשות');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 px-4 md:px-0" dir="rtl">
      {/* Body-line Standard Header Stack */}
      <div className="surfboard-hero-container mb-0 space-y-2 header-wallpaper !py-12 pb-24 rounded-[3rem] relative overflow-hidden" style={{ '--bg-image': `url(${headerImage})` } as React.CSSProperties}>
        <div className="header-content-wrapper relative z-20">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-sky-500/10 text-sky-500 mb-2 shadow-sm border border-sky-500/20 relative z-10">
            <Globe size={40} />
          </div>
          <h1 className="main-page-title">
            <span className="surfer-title text-[#121212]">חדשות מהעולם</span>
          </h1>
          <p className="header-subtitle max-w-2xl mx-auto text-[#121212]">
            עדכונים וחדשות מעולם הגלישה העולמי 🌊
          </p>
        </div>
      </div>

      <div className="relative z-30 -mt-16 bg-transparent">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 luxury-card">
            <div className="grain-overlay" />
            <Loader2 className="animate-spin text-sky-500 mb-4" size={48} />
            <p className="text-slate-500 font-black uppercase tracking-widest text-xs">טוען חדשות מהעולם...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 luxury-card">
            <div className="grain-overlay" />
            <Globe className="mx-auto text-slate-300 mb-4" size={64} />
            <h3 className="text-2xl font-bold text-slate-400">שגיאה בטעינת החדשות</h3>
            <p className="text-slate-500 mt-2">אנא נסה שוב מאוחר יותר</p>
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-20 luxury-card">
            <div className="grain-overlay" />
            <Globe className="mx-auto text-slate-300 mb-4" size={64} />
            <h3 className="text-2xl font-bold text-slate-400">אין חדשות כרגע</h3>
            <p className="text-slate-500 mt-2">נסה שוב מאוחר יותר</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {news.map((item, index) => (
              <a 
                key={index} 
                href={item.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="group luxury-card overflow-hidden transition-all duration-500 flex flex-col hover:-translate-y-2"
              >
                <div className="grain-overlay" />
                <div className="h-48 bg-slate-100 flex items-center justify-center relative overflow-hidden">
                  {item.thumbnail ? (
                    <img 
                      src={item.thumbnail} 
                      alt="" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    />
                  ) : (
                    <Globe className="text-slate-200" size={48} />
                  )}
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full z-10">
                    {item.source}
                  </div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col relative z-20">
                  <h3 className="text-lg font-black text-slate-800 mb-3 line-clamp-2 group-hover:text-sky-600 transition-colors" dir="ltr">
                    {item.title}
                  </h3>
                  
                  <div className="mt-auto flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-sky-400" />
                      <span dir="ltr">{new Date(item.pubDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sky-500">
                      <span>קרא עוד</span>
                      <ExternalLink size={14} />
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SurfingNewsPage;
