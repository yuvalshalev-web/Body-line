
import React, { useState, useEffect } from 'react';
import { Globe, Loader2, ExternalLink, Calendar, Newspaper, AlertCircle, RefreshCw, Bookmark, Waves } from 'lucide-react';

interface Article {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: string;
  content: string;
}

const CACHE_KEY = 'habal_zug_surf_news_cache';
const CACHE_DURATION = 60 * 60 * 1000; // 60 minutes in milliseconds

const SurfingNewsPage: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    // Check Cache first if not forcing refresh
    if (!forceRefresh) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const parsedCache = JSON.parse(cached);
          const isExpired = Date.now() - parsedCache.timestamp > CACHE_DURATION;
          
          if (!isExpired && parsedCache.articles && parsedCache.articles.length > 0) {
            setArticles(parsedCache.articles);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error("Cache parsing error:", e);
          localStorage.removeItem(CACHE_KEY);
        }
      }
    }

    try {
      const feeds = [
        { url: 'https://www.surfline.com/surf-news/feed', name: 'Surfline' },
        { url: 'https://www.worldsurfleague.com/rss', name: 'WSL' },
        { url: 'https://www.surfer.com/.rss/full/', name: 'Surfer' }
      ];

      const results = await Promise.allSettled(
        feeds.map(async (feed) => {
          let apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`;
          if (process.env.RSS_API_KEY) {
            apiUrl += `&api_key=${process.env.RSS_API_KEY}`;
          }
          
          const res = await fetch(apiUrl);
          if (!res.ok) throw new Error(`Failed to fetch ${feed.name}`);
          
          const data = await res.json();
          if (data.status !== 'ok') return [];
          
          return (data.items || []).map((item) => ({
            title: item.title || 'Untitled',
            description: item.description || item.content || '',
            url: item.link,
            urlToImage: item.enclosure?.link || 
                        item.thumbnail || 
                        extractImage(item.description) || 
                        extractImage(item.content) || 
                        `https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&q=80&w=800&sig=${Math.random()}`,
            publishedAt: item.pubDate,
            source: feed.name,
            content: item.content || ''
          }));
        })
      );

      // Fix: Cast the results to the fulfilled type after filtering to safely access the 'value' property
      const combined = (results.filter(result => result.status === 'fulfilled') as PromiseFulfilledResult<Article[]>[])
        .flatMap(result => result.value)
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

      if (combined.length === 0) {
        throw new Error('לא נמצאו חדשות באף אחד מהמקורות. נסו שוב בעוד כמה דקות.');
      }

      // Save to Cache
      const cacheData = {
        articles: combined,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      
      setArticles(combined);
    } catch (err: any) {
      console.error("News fetch error:", err);
      setError(err.message || 'לא הצלחנו לטעון חדשות כרגע. ייתכן שיש בעיית חיבור לשרתי החדשות.');
    } finally {
      setLoading(false);
    }
  };

  const extractImage = (html) => {
    if (!html) return '';
    const match = html.match(/<img[^>]+(?:src|data-src)="([^">]+)"/);
    return match ? match[1] : '';
  };

  const cleanDescription = (text) => {
    if (!text) return '';
    return text
      .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gmi, '')
      .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gmi, '')
      .replace(/<[^>]*>?/gm, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  };

  useEffect(() => {
    fetchNews(false);
  }, []);

  const SkeletonCard = () => (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm h-[500px] animate-pulse">
      <div className="aspect-video bg-slate-100"></div>
      <div className="p-8 space-y-4">
        <div className="h-3 w-20 bg-slate-50 rounded-full"></div>
        <div className="h-6 w-full bg-slate-50 rounded-full"></div>
        <div className="h-6 w-4/5 bg-slate-50 rounded-full"></div>
        <div className="space-y-2 pt-4">
          <div className="h-4 w-full bg-slate-50 rounded-full"></div>
          <div className="h-4 w-full bg-slate-50 rounded-full"></div>
          <div className="h-4 w-2/3 bg-slate-50 rounded-full"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen -m-6 p-6 md:-m-12 md:p-12 overflow-hidden bg-white text-right">
      <div className="relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Body-line Standard Header Stack */}
        <div className="surfboard-hero-container mb-10 space-y-4">
          {/* Top Badge */}
          <div className="header-badge-glass">
            <Globe size={12} className="text-[#00f2fe]" />
            <span>GLOBAL SURF UPDATES</span>
          </div>

          {/* Main Title */}
          <h1 className="main-page-title">
            חדשות גלישה
          </h1>

          {/* Subtitle with Emoji context */}
          <div className="flex flex-col items-center gap-6">
            <p className="header-subtitle max-w-2xl">
              מבזקים חיים ועדכונים מהעולם - Surfline, WSL ו-Surfer 🌍
            </p>
            
            <button 
              onClick={() => fetchNews(true)}
              disabled={loading}
              className="flex items-center gap-4 px-8 py-4 bg-[#006994] text-white rounded-[1.5rem] font-black text-sm hover:bg-[#4E8294] transition-all active:scale-95 shadow-lg group disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} className="group-hover:rotate-180 transition-transform text-[#00FFFF]" />}
              <span>רענן עדכונים</span>
            </button>
          </div>
        </div>

        {error ? (
          <div className="py-40 text-center bg-rose-50 rounded-[4rem] border-2 border-dashed border-rose-100 flex flex-col items-center p-12">
            <AlertCircle size={48} className="text-rose-400 mb-6" />
            <h3 className="text-2xl font-black text-rose-900 mb-2">אופס, משהו השתבש</h3>
            <p className="text-rose-600 font-bold mb-8 max-w-md mx-auto">{error}</p>
            <button 
              onClick={() => fetchNews(true)} 
              className="px-8 py-4 bg-[#006994] text-white rounded-2xl font-black text-sm shadow-xl hover:bg-[#4E8294] transition-all active:scale-95 flex items-center gap-3"
            >
              <RefreshCw size={18} />
              <span>נסה שנית</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            ) : articles.length > 0 ? (
              articles.map((article, idx) => (
                <div 
                  key={idx} 
                  className="group flex flex-col bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 shadow-sm"
                >
                  <div className="relative aspect-video overflow-hidden bg-slate-50">
                    <img 
                      src={article.urlToImage} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                      alt={article.title}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&q=80&w=800";
                      }}
                    />
                    <div className="absolute top-4 right-4 bg-[#006994]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-[10px] font-black text-white shadow-lg flex items-center gap-2">
                      <Waves size={10} className="text-[#00FFFF]" />
                      {article.source}
                    </div>
                  </div>
                  
                  <div className="p-8 flex-1 flex flex-col">
                    <div className="flex items-center gap-3 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">
                      <Calendar size={12} />
                      {new Date(article.publishedAt).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    
                    <h3 className="text-xl font-black text-slate-950 mb-4 group-hover:text-[#006994] transition-colors tracking-tight leading-snug line-clamp-2" dir="ltr">
                      {article.title}
                    </h3>
                    
                    <p className="text-slate-500 font-bold text-sm leading-relaxed mb-6 line-clamp-3 overflow-hidden text-ellipsis" dir="ltr">
                      {cleanDescription(article.description)}
                    </p>
                    
                    <a 
                      href={article.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between text-[#006994] font-black text-xs uppercase tracking-widest group/link hover:text-[#4E8294] transition-colors"
                    >
                      <span>Read More</span>
                      <ExternalLink size={14} className="group-hover/link:translate-x-[-4px] transition-transform text-[#40E0D0]" />
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-40 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100 flex flex-col items-center">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 text-slate-200">
                  <Newspaper size={48} />
                </div>
                <h3 className="text-2xl font-black text-[#2B2B2E]">לא נמצאו כתבות</h3>
                <p className="text-slate-400 mt-2 font-medium">נסה לרענן את העמוד בעוד מספר דקות.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SurfingNewsPage;
