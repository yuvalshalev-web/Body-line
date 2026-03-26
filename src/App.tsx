import React, { useState, useCallback, lazy, Suspense, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useData } from './contexts/DataContext';
import { 
  Loader2
} from 'lucide-react';


import ErrorBoundary from './components/ErrorBoundary';
import FloatingMenu from './components/FloatingMenu';
import { FloatingDrawer } from './components/FloatingDock';
import { SurfNewsTracker } from './components/SurfNewsTracker';

// Lazy loaded components
const LoginPage = lazy(() => import('./pages/LoginPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const DirectoryPage = lazy(() => import('./pages/DirectoryPage'));
const GalleryPage = lazy(() => import('./pages/GalleryPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const NewsPage = lazy(() => import('./pages/NewsPage'));
const SurfingNewsPage = lazy(() => import('./pages/SurfingNewsPage'));
const AdminInfoPage = lazy(() => import('./pages/AdminInfoPage'));
const SurferCardPage = lazy(() => import('./pages/SurferCardPage'));
const SurfingSessionAttendance = lazy(() => import('./pages/SurfingSessionAttendance'));
const SessionStatsPage = lazy(() => import('./pages/SessionStatsPage'));
const ShaperPage = lazy(() => import('./pages/ShaperPage'));

const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="animate-spin text-indigo-600" size={40} />
      <span className="font-black text-slate-400 text-xs uppercase tracking-widest">טוען דף...</span>
    </div>
  </div>
);

const App: React.FC = () => {
  const { currentUser, logout, loading } = useAuth();
  const { siteConfig, siteAssets } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const mainRef = useRef<HTMLElement>(null);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Apply global color
  React.useEffect(() => {
    if (siteConfig.globalColor) {
      document.documentElement.style.setProperty('--gt-accent', siteConfig.globalColor);
    }
  }, [siteConfig.globalColor]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/');
  }, [logout, navigate]);

  // Global Progress Bar Function
  React.useEffect(() => {
    (window as any).updateProgressBar = (percent: number) => {
      const bar = document.getElementById('global-progress-bar');
      if (bar) {
        bar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
      }
    };
  }, []);

  // Inject Custom Fonts
  React.useEffect(() => {
    if (siteAssets?.fonts) {
      const styleId = 'custom-fonts-style';
      let styleEl = document.getElementById(styleId) as HTMLStyleElement;
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }

      const generateFontFace = (family: string, fontData: any, weight: string = 'normal') => {
        if (!fontData) return '';
        
        // AdminAssets stores fonts as an array of {url, name, format}
        const fonts = Array.isArray(fontData) ? fontData : [fontData];
        if (fonts.length === 0) return '';
        
        // We'll take the first valid font in the array (usually the most recent or only one)
        const font = fonts[fonts.length - 1]; 
        const url = typeof font === 'string' ? font : font.url;
        if (!url) return '';
        
        // Detect format from URL extension if not provided
        let format = typeof font === 'object' && font.format ? font.format : 'woff';
        if (url.toLowerCase().includes('.ttf')) format = 'truetype';
        if (url.toLowerCase().includes('.otf')) format = 'opentype';
        if (url.toLowerCase().includes('.woff2')) format = 'woff2';

        return `
          @font-face {
            font-family: '${family}';
            src: url('${url}') format('${format}');
            font-weight: ${weight};
            font-style: normal;
            font-display: swap;
          }
        `;
      };

      let css = '';
      // Unify under 'Yehuda CLM' family name
      css += generateFontFace('Yehuda CLM', siteAssets.fonts.yehudaLight, '300');
      css += generateFontFace('Yehuda CLM', siteAssets.fonts.yehudaBold, '700');
      css += generateFontFace('Miriwin', siteAssets.fonts.miriwin);
      css += generateFontFace('Dana Yad Alef Alef', siteAssets.fonts.danaYad);
      
      styleEl.innerHTML = css;
    }
  }, [siteAssets?.fonts]);

  // Apply H1 Global Styles
  React.useEffect(() => {
    if (siteConfig.h1Styles) {
      const { 
        fontSize, color, align, weight, glassBlur, glassOpacity, fontFamily, showGlass,
        letterSpacing, color1, color2, gradAngle, strokeWidth, strokeColor, glowSize, glowColor
      } = siteConfig.h1Styles;
      const root = document.documentElement;
      if (fontSize) root.style.setProperty('--h1-font-size', fontSize);
      if (color) root.style.setProperty('--h1-color', color);
      if (align) root.style.setProperty('--h1-align', align);
      if (weight) root.style.setProperty('--h1-weight', weight);
      if (fontFamily) root.style.setProperty('--h1-font-family', fontFamily);
      if (letterSpacing) root.style.setProperty('--h1-letter-spacing', letterSpacing);
      
      // Gradient & Stroke
      if (color1) root.style.setProperty('--h1-color-1', color1);
      if (color2) root.style.setProperty('--h1-color-2', color2);
      if (gradAngle) {
        const angle = gradAngle.toString().replace('deg', '');
        root.style.setProperty('--h1-grad-angle', `${angle}deg`);
      }
      if (strokeWidth) root.style.setProperty('--h1-stroke-width', `${strokeWidth}px`);
      if (strokeColor) root.style.setProperty('--h1-stroke-color', strokeColor);
      
      // Glow
      if (glowSize) root.style.setProperty('--h1-glow-size', `${glowSize}px`);
      if (glowColor) root.style.setProperty('--h1-glow-color', glowColor);
      
      if (showGlass === false) {
        root.style.setProperty('--h1-glass-blur', '0px');
        root.style.setProperty('--h1-glass-bg', 'transparent');
        root.style.setProperty('--h1-glass-border', 'none');
        root.style.setProperty('--h1-glass-shadow', 'none');
      } else {
        root.style.setProperty('--h1-glass-blur', `${glassBlur || '10'}px`);
        root.style.setProperty('--h1-glass-bg', `rgba(255, 255, 255, ${glassOpacity || '0.2'})`);
        root.style.setProperty('--h1-glass-border', '1px solid rgba(255, 255, 255, 0.2)');
        root.style.setProperty('--h1-glass-shadow', '0 8px 32px rgba(0, 0, 0, 0.2)');
      }
    }
  }, [siteConfig.h1Styles]);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  if (loading) {
    return <PageLoader />;
  }

  if (!currentUser) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-yehuda relative" dir="rtl">
      {/* Global Progress Bar */}
      <div id="global-progress-container">
        <div id="global-progress-bar"></div>
      </div>

      {/* Surf News Ticker */}
      <SurfNewsTracker />

      {/* Modern Minimalist Floating Navigation */}
      <FloatingDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        activeRoute={location.pathname}
      />

      {/* Edge Trigger for Mobile Swipe */}
      <div 
        className="fixed right-0 top-0 bottom-0 w-5 z-[9999] lg:hidden"
        onMouseEnter={() => setIsDrawerOpen(true)}
        onClick={() => setIsDrawerOpen(true)}
      />

      {/* Desktop Hover Trigger */}
      <div 
        className="fixed right-0 top-1/2 -translate-y-1/2 w-20 h-[400px] z-[9998] hidden lg:block"
        onMouseEnter={() => setIsDrawerOpen(true)}
      />

      {/* Main Content Area */}
      <FloatingMenu onLogout={handleLogout} scrollRef={mainRef} onOpenDrawer={() => setIsDrawerOpen(true)} />
      <main 
        ref={mainRef}
        className={`flex-1 overflow-y-auto pb-20 relative z-10 ${
          ['/', '/events', '/gallery', '/directory', '/posts'].includes(location.pathname) ? 'luxury-bg' : ''
        }`}
      >
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/directory" element={<DirectoryPage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/posts" element={<NewsPage />} />
              <Route path="/world-news" element={<SurfingNewsPage />} />
              <Route path="/surfer-card" element={<SurferCardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/shaper" element={<ShaperPage />} />
              {currentUser.role === 'Admin' && (
                <>
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/admin-info" element={<AdminInfoPage />} />
                  <Route path="/attendance" element={<SurfingSessionAttendance />} />
                </>
              )}
              {currentUser.role === 'Instructor' && (
                <Route path="/admin-info" element={<AdminInfoPage />} />
              )}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
};

export default App;
