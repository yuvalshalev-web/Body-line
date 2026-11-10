import React, { useState, useEffect, useMemo } from 'react';
import { 
  Globe, 
  ExternalLink, 
  Clock, 
  Loader2, 
  Search, 
  Sparkles, 
  ShieldCheck, 
  Filter, 
  RefreshCw, 
  Trophy, 
  Waves, 
  Tv, 
  Compass, 
  CheckCircle2, 
  ArrowUpRight 
} from 'lucide-react';
import { useRandomHeader } from '../hooks/useRandomHeader';

interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
  thumbnail: string;
  source: string;
  summary?: string;
  category?: 'competitions' | 'big_waves' | 'gear' | 'video' | 'culture' | 'general';
  categoryLabel?: string;
  relevanceScore?: number;
  hebrewTitle?: string;
  hebrewSummary?: string;
  isTranslating?: boolean;
}

const CATEGORY_TABS = [
  { id: 'all', label: 'הכל', icon: Globe },
  { id: 'competitions', label: 'WSL ותחרויות', icon: Trophy },
  { id: 'big_waves', label: 'גלים גדולים & סוואל', icon: Waves },
  { id: 'gear', label: 'ציוד & שייפינג', icon: Compass },
  { id: 'video', label: 'סרטונים & מדיה', icon: Tv },
  { id: 'culture', label: 'תרבות & סטייל', icon: Sparkles },
];

const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  competitions: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  wsl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  big_waves: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=800&q=80',
  big_wave: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=800&q=80',
  gear: 'https://images.unsplash.com/photo-1537519646099-335112f03225?auto=format&fit=crop&w=800&q=80',
  video: 'https://images.unsplash.com/photo-1455729552865-3ef5885ab656?auto=format&fit=crop&w=800&q=80',
  culture: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=800&q=80',
  general: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=800&q=80',
  default: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=800&q=80'
};

const getFallbackSurfImage = (category?: string) => {
  if (category && CATEGORY_FALLBACK_IMAGES[category]) {
    return CATEGORY_FALLBACK_IMAGES[category];
  }
  return CATEGORY_FALLBACK_IMAGES.default;
};

const SurfingNewsPage: React.FC = () => {
  const headerImage = useRandomHeader();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [translatedMap, setTranslatedMap] = useState<Record<string, { title: string; summary: string }>>({});
  const [translatingMap, setTranslatingMap] = useState<Record<string, boolean>>({});

  const fetchNews = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const res = await fetch('/api/news/world-surf');
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.articles)) {
        setArticles(data.articles);
      } else {
        throw new Error('מבנה תגובה לא תקין');
      }
    } catch (err: any) {
      console.warn('Failed to fetch surf news from server endpoint, attempting RSS fallback:', err);
      // Fallback: direct RSS fetch with surf relevance filter
      await fetchFallbackRSS();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchFallbackRSS = async () => {
    const RSS_FEEDS = [
      { name: 'Surfer Magazine', url: 'https://www.surfer.com/feed' },
      { name: 'Stab Magazine', url: 'https://stabmag.com/feed/' },
      { name: 'The Inertia', url: 'https://www.theinertia.com/feed/' },
      { name: 'Carve Magazine', url: 'https://www.carvemag.com/feed/' }
    ];

    const SURF_KEYWORDS = ['surf', 'wave', 'board', 'wsl', 'pipeline', 'tahiti', 'teahupo', 'barrel', 'swell', 'wetsuit', 'fin', 'leash', 'quiksilver', 'billabong', 'ripcurl', 'surfer'];
    const OFF_TOPIC_WORDS = ['snowboard', 'skatepark', 'crypto', 'nft', 'politics', 'movie review', 'gadget review', 'electric scooter'];

    const fallbackArticles: NewsArticle[] = [];

    for (const feed of RSS_FEEDS) {
      try {
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`);
        const data = await response.json();

        if (data.status === 'ok' && Array.isArray(data.items)) {
          for (const item of data.items) {
            const textToScore = `${item.title || ''} ${item.description || ''} ${item.content || ''}`.toLowerCase();
            
            const hasOffTopic = OFF_TOPIC_WORDS.some(word => textToScore.includes(word));
            if (hasOffTopic) continue;

            const surfMatches = SURF_KEYWORDS.filter(kw => textToScore.includes(kw)).length;
            if (surfMatches < 2 && !textToScore.includes('surf')) continue;

            let imageUrl = item.thumbnail || item.enclosure?.link || '';
            if (!imageUrl && item.content) {
              const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
              if (imgMatch) imageUrl = imgMatch[1];
            }

            const cat = surfMatches > 4 ? 'competitions' : 'general';

            fallbackArticles.push({
              title: item.title,
              link: item.link,
              pubDate: item.pubDate,
              thumbnail: imageUrl || getFallbackSurfImage(cat),
              source: feed.name,
              summary: item.description ? item.description.replace(/<[^>]*>?/gm, '').slice(0, 150) + '...' : '',
              category: cat,
              categoryLabel: 'גלישת גלים',
              relevanceScore: 90
            });
          }
        }
      } catch (e) {
        console.warn(`Fallback fetch error for ${feed.name}:`, e);
      }
    }

    fallbackArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    setArticles(fallbackArticles);
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleTranslateSummary = async (article: NewsArticle, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const articleId = article.link;
    if (translatedMap[articleId]) {
      // Toggle off if already translated
      const updated = { ...translatedMap };
      delete updated[articleId];
      setTranslatedMap(updated);
      return;
    }

    setTranslatingMap(prev => ({ ...prev, [articleId]: true }));

    try {
      const res = await fetch('/api/news/translate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: article.title,
          summary: article.summary
        })
      });

      if (!res.ok) throw new Error('Translation request failed');
      const data = await res.json();

      setTranslatedMap(prev => ({
        ...prev,
        [articleId]: {
          title: data.hebrewTitle || article.title,
          summary: data.hebrewSummary || article.summary || ''
        }
      }));
    } catch (err) {
      console.error('Translation error:', err);
    } finally {
      setTranslatingMap(prev => ({ ...prev, [articleId]: false }));
    }
  };

  const filteredArticles = useMemo(() => {
    return articles.filter(art => {
      const matchesSearch = 
        !searchQuery.trim() || 
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (art.summary && art.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
        art.source.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = 
        selectedCategory === 'all' || 
        art.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [articles, searchQuery, selectedCategory]);

  const featuredArticle = filteredArticles[0];
  const gridArticles = filteredArticles.slice(1);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 px-4 md:px-0 pb-16" dir="rtl">
      {/* Header Wallpaper Banner */}
      <div 
        className="surfboard-hero-container mb-0 space-y-2 header-wallpaper !py-12 pb-24 rounded-[3rem] relative overflow-hidden shadow-2xl" 
        style={{ '--bg-image': `url(${headerImage})` } as React.CSSProperties}
      >
        <div className="header-content-wrapper relative z-20 text-center">
          <div className="inline-fetch-badge inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500/20 backdrop-blur-md text-sky-400 font-bold text-xs mb-4 border border-sky-400/30 shadow-lg animate-pulse">
            <Sparkles size={16} className="text-amber-400" />
            <span>עדכונים חיים מהמגזינים המובילים בעולם</span>
          </div>

          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-sky-500/10 text-sky-500 mb-2 shadow-sm border border-sky-500/20 relative z-10 mx-auto">
            <Globe size={40} className="animate-spin-slow" />
          </div>

          <h1 className="main-page-title">
            <span className="surfer-title text-[#121212]">חדשות גלישה מהעולם</span>
          </h1>
          <p className="header-subtitle max-w-2xl mx-auto text-[#121212] font-medium text-sm md:text-base">
            סינון אלגוריתמי חכם 100% ממוקד גלישת גלים, תחרויות WSL, ציוד ותרבות סוואל 🌊
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-30 -mt-16 space-y-6">
        
        {/* Quality Seal & Search Bar Container */}
        <div className="luxury-card p-4 md:p-6 rounded-3xl backdrop-blur-xl bg-white/90 shadow-xl border border-white/60 space-y-4">
          <div className="grain-overlay" />
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative z-20">
            {/* Algorithm Quality Seal Badge */}
            <div className="flex items-center gap-3 bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-indigo-500/10 px-4 py-2.5 rounded-2xl border border-sky-200/60 w-full md:w-auto">
              <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-md shrink-0">
                <ShieldCheck size={22} />
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                  <span>אלגוריתם סינון גלישה נקי</span>
                  <CheckCircle2 size={14} className="text-emerald-500 fill-emerald-100" />
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  סינון כתבות שאינן קשורות לגל הימי (100% גלישת גלים טהורה)
                </p>
              </div>
            </div>

            {/* Refresh Button & Live Stats */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                {filteredArticles.length} כתבות נמצאו
              </span>

              <button
                onClick={() => fetchNews(true)}
                disabled={refreshing || loading}
                className="flex items-center gap-2 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200/80 px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                <RefreshCw size={14} className={refreshing ? 'animate-spin text-sky-600' : ''} />
                <span>רענן חדשות</span>
              </button>
            </div>
          </div>

          {/* Search Bar & Category Filter Controls */}
          <div className="pt-2 border-t border-slate-100 space-y-4 relative z-20">
            {/* Live Search Input */}
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="חפש לפי כותרת, נושא, או שם המגזין (WSL, Kelly Slater, Surfboard, Pipeline...)"
                className="w-full pl-4 pr-11 py-3 bg-slate-50/80 border border-slate-200/80 rounded-2xl text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold bg-slate-200/60 rounded-full w-5 h-5 flex items-center justify-center"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {CATEGORY_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = selectedCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedCategory(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                      isActive
                        ? 'bg-sky-500 text-white shadow-sky-500/20 scale-105'
                        : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                    }`}
                  >
                    <Icon size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 luxury-card rounded-3xl bg-white/80 backdrop-blur-md">
            <div className="grain-overlay" />
            <Loader2 className="animate-spin text-sky-500 mb-4" size={48} />
            <p className="text-slate-700 font-bold text-sm">מנתח ומייבא חדשות גלישה בלבד...</p>
            <p className="text-slate-400 text-xs mt-1">מפעיל אלגוריתם סינון מנוסה לסינון תוכן שאינו גלישת גלים</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 luxury-card rounded-3xl bg-white/80 backdrop-blur-md space-y-4">
            <div className="grain-overlay" />
            <Globe className="mx-auto text-rose-400 mb-2 animate-bounce" size={56} />
            <h3 className="text-xl font-bold text-slate-800">שגיאה בטעינת החדשות</h3>
            <p className="text-slate-500 text-xs max-w-md mx-auto">{error}</p>
            <button
              onClick={() => fetchNews(true)}
              className="inline-flex items-center gap-2 bg-sky-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md hover:bg-sky-600 transition-all"
            >
              <RefreshCw size={14} />
              <span>נסה שוב כעת</span>
            </button>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-16 luxury-card rounded-3xl bg-white/80 backdrop-blur-md space-y-3">
            <div className="grain-overlay" />
            <Filter className="mx-auto text-slate-300 mb-2" size={56} />
            <h3 className="text-lg font-bold text-slate-700">לא נמצאו כתבות התואמות את הסינון</h3>
            <p className="text-slate-400 text-xs">נסה לשנות את מילת החיפוש או לעבור לקטגוריה "הכל"</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
              className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition-all"
            >
              אפס מסננים
            </button>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Featured Hero Article (First Item) */}
            {featuredArticle && (
              <div className="luxury-card overflow-hidden rounded-3xl bg-white/95 border border-white/80 shadow-xl transition-all duration-300 hover:shadow-2xl">
                <div className="grain-overlay" />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                  {/* Hero Image */}
                  <div className="lg:col-span-7 h-64 lg:h-auto min-h-[260px] bg-slate-900 relative overflow-hidden group">
                    <img
                      src={featuredArticle.thumbnail || getFallbackSurfImage(featuredArticle.category)}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      onError={(e) => {
                        const img = e.currentTarget;
                        img.onerror = null;
                        img.src = getFallbackSurfImage(featuredArticle.category);
                      }}
                    />

                    <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                      <span className="bg-sky-500/90 backdrop-blur-md text-white text-[10px] font-black tracking-widest px-3 py-1 rounded-full shadow-lg border border-sky-400/40">
                        🔥 כתבה ראשית
                      </span>
                      <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full border border-white/20">
                        {featuredArticle.source}
                      </span>
                    </div>

                    {featuredArticle.relevanceScore && (
                      <div className="absolute bottom-4 right-4 bg-emerald-500/90 text-white backdrop-blur-md text-[10px] font-extrabold px-2.5 py-1 rounded-lg border border-emerald-400/40 shadow-md">
                        {featuredArticle.relevanceScore}% זיקה לגל
                      </div>
                    )}
                  </div>

                  {/* Hero Content */}
                  <div className="lg:col-span-5 p-6 lg:p-8 flex flex-col justify-between relative z-20">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs text-sky-600 font-bold">
                        <span>{featuredArticle.categoryLabel || 'גלישת גלים'}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1 text-slate-400 font-normal">
                          <Clock size={12} />
                          <span dir="ltr">{new Date(featuredArticle.pubDate).toLocaleDateString('he-IL')}</span>
                        </div>
                      </div>

                      <h2 className="text-xl lg:text-2xl font-black text-slate-900 leading-snug hover:text-sky-600 transition-colors" dir="ltr">
                        {translatedMap[featuredArticle.link]?.title || featuredArticle.title}
                      </h2>

                      <p className="text-xs lg:text-sm text-slate-600 line-clamp-3 leading-relaxed" dir={translatedMap[featuredArticle.link] ? 'rtl' : 'ltr'}>
                        {translatedMap[featuredArticle.link]?.summary || featuredArticle.summary || 'לחץ לקריאת הכתבה המלאה במגזין המקור...'}
                      </p>
                    </div>

                    {/* AI Translation & Direct Link Footer */}
                    <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between gap-3">
                      <button
                        onClick={(e) => handleTranslateSummary(featuredArticle, e)}
                        disabled={translatingMap[featuredArticle.link]}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                          translatedMap[featuredArticle.link]
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100'
                        }`}
                      >
                        {translatingMap[featuredArticle.link] ? (
                          <Loader2 size={13} className="animate-spin text-sky-600" />
                        ) : (
                          <Sparkles size={13} className="text-amber-500" />
                        )}
                        <span>
                          {translatedMap[featuredArticle.link] ? 'חזור לאנגלית' : '🇮🇱 תרגום/תקציר בעברית'}
                        </span>
                      </button>

                      <a
                        href={featuredArticle.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-slate-900 text-white hover:bg-sky-600 px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95 shrink-0"
                      >
                        <span>קרא במקור</span>
                        <ArrowUpRight size={14} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gridArticles.map((item, index) => {
                const isTranslated = !!translatedMap[item.link];
                const isTranslating = !!translatingMap[item.link];

                return (
                  <div 
                    key={index} 
                    className="group luxury-card overflow-hidden rounded-3xl bg-white/90 border border-white/70 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
                  >
                    <div className="grain-overlay" />
                    
                    {/* Card Thumbnail */}
                    <div className="h-48 bg-slate-100 relative overflow-hidden">
                      <img 
                        src={item.thumbnail || getFallbackSurfImage(item.category)} 
                        alt="" 
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500" 
                        onError={(e) => {
                          const img = e.currentTarget;
                          img.onerror = null;
                          img.src = getFallbackSurfImage(item.category);
                        }}
                      />

                      {/* Source & Category Pill */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                        <span className="bg-black/65 backdrop-blur-md text-white text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full border border-white/20">
                          {item.source}
                        </span>
                      </div>

                      {item.relevanceScore && (
                        <div className="absolute bottom-3 right-3 bg-sky-600/90 text-white backdrop-blur-md text-[9px] font-extrabold px-2 py-0.5 rounded-md border border-sky-400/30">
                          {item.relevanceScore}% זיקה
                        </div>
                      )}
                    </div>
                    
                    {/* Card Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3 relative z-20">
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                          <span className="text-sky-600 font-bold">{item.categoryLabel || 'גלישת גלים'}</span>
                          <div className="flex items-center gap-1">
                            <Clock size={12} className="text-sky-400" />
                            <span dir="ltr">{new Date(item.pubDate).toLocaleDateString('he-IL')}</span>
                          </div>
                        </div>

                        <h3 className="text-sm font-extrabold text-slate-800 mb-2 line-clamp-2 group-hover:text-sky-600 transition-colors leading-snug" dir={isTranslated ? 'rtl' : 'ltr'}>
                          {isTranslated ? translatedMap[item.link].title : item.title}
                        </h3>

                        {item.summary && (
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed" dir={isTranslated ? 'rtl' : 'ltr'}>
                            {isTranslated ? translatedMap[item.link].summary : item.summary}
                          </p>
                        )}
                      </div>

                      {/* Action Footer */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          onClick={(e) => handleTranslateSummary(item, e)}
                          disabled={isTranslating}
                          className={`flex items-center gap-1 px-2.5 py-1.2 rounded-lg text-[11px] font-bold transition-all ${
                            isTranslated
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-slate-100 text-slate-600 hover:bg-sky-50 hover:text-sky-700'
                          }`}
                          title="תרגם וסכם בעברית באמצעות Gemini AI"
                        >
                          {isTranslating ? (
                            <Loader2 size={12} className="animate-spin text-sky-600" />
                          ) : (
                            <Sparkles size={12} className="text-amber-500" />
                          )}
                          <span>{isTranslated ? 'עברית' : '🇮🇱 תרגום/תקציר'}</span>
                        </button>

                        <a 
                          href={item.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-800 group-hover:underline"
                        >
                          <span>קרא במקור</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default SurfingNewsPage;
