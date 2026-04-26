import React, { useState, useCallback, lazy, Suspense, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from './contexts/AuthContext';
import { useData } from './contexts/DataContext';
import { 
  Loader2
} from 'lucide-react';


import ErrorBoundary from './components/ErrorBoundary';
import FloatingMenu from './components/FloatingMenu';
import { FloatingDrawer } from './components/FloatingDock';
import { SurfNewsTracker } from './components/SurfNewsTracker';
import { PWAInstallBanner } from './components/PWAInstallBanner';

// Lazy loaded components
import LoginPage from './pages/LoginPage';
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
const MemberGradingPage = lazy(() => import('./pages/MemberGradingPage'));

const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="animate-spin text-indigo-600" size={40} />
      <span className="font-black text-slate-400 text-xs uppercase tracking-widest">טוען דף...</span>
    </div>
  </div>
);

import { DatabaseStatus } from './components/DatabaseStatus';

const App: React.FC = () => {
  const { currentUser, logout, loading } = useAuth();
  const { siteConfig, siteAssets, isLoading: dataLoading } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const mainRef = useRef<HTMLElement>(null);
  const [isReady, setIsReady] = useState(false);

  // Ensure both auth and initial data are loaded before showing the app
  React.useEffect(() => {
    if (isReady) return;
    
    if (!loading && !dataLoading) {
      let isMounted = true;
      
      // Safety timeout to ensure app loads even if fonts hang
      const fallbackTimer = setTimeout(() => {
        if (isMounted && !isReady) {
          console.warn("App: Font loading timed out, forcing ready state");
          setIsReady(true);
        }
      }, 1500);

      // Wait for fonts to be ready to prevent layout shift and distorted look
      if ('fonts' in document) {
        document.fonts.ready.then(() => {
          if (isMounted) {
            clearTimeout(fallbackTimer);
            setTimeout(() => {
              if (isMounted) {
                setIsReady(true);
                console.log("App: Ready to render (fonts ready). Auth loading:", loading, "Data loading:", dataLoading);
              }
            }, 150);
          }
        }).catch(err => {
          if (isMounted) {
            clearTimeout(fallbackTimer);
            console.warn("App: Font loading error, proceeding anyway:", err);
            setIsReady(true);
          }
        });
      } else {
        // Fallback for browsers that don't support document.fonts
        clearTimeout(fallbackTimer);
        const timer = setTimeout(() => {
          if (isMounted) setIsReady(true);
        }, 300);
      }
      
      return () => {
        isMounted = false;
        clearTimeout(fallbackTimer);
      };
    }
  }, [loading, dataLoading, isReady]);

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
        
        // Normalize fontData to an array of objects
        const fonts = (Array.isArray(fontData) ? fontData : [fontData])
          .map(f => {
            if (typeof f === 'string') return { url: f, format: 'woff' };
            if (f && typeof f === 'object' && f.url) return f;
            return null;
          })
          .filter(Boolean);

        if (fonts.length === 0) return '';
        
        const sources = fonts.map(f => {
          const url = f.url;
          let format = f.format || 'woff';
          const lowerUrl = url.toLowerCase();
          if (lowerUrl.includes('.ttf')) format = 'truetype';
          else if (lowerUrl.includes('.otf')) format = 'opentype';
          else if (lowerUrl.includes('.woff2')) format = 'woff2';
          else if (lowerUrl.includes('.eot')) format = 'embedded-opentype';
          
          return `url("${url}") format("${format}")`;
        }).join(', ');

        return `
          @font-face {
            font-family: "${family}";
            src: ${sources};
            font-weight: ${weight};
            font-style: normal;
            font-display: block;
          }
        `;
      };

      let css = '';
      // Unify under 'Yehuda CLM' family name
      css += generateFontFace('Yehuda CLM', siteAssets.fonts.yehudaLight, '300');
      css += generateFontFace('Yehuda CLM', siteAssets.fonts.yehudaBold, '700');
      css += generateFontFace('Miriwin', siteAssets.fonts.miriwin);
      
      // Dana Yad - Define for multiple weights to ensure it's used regardless of Tailwind classes
      const danaYadData = siteAssets.fonts.danaYad;
      if (danaYadData) {
        // We use 'DanaYad' as the primary name, but also support common variations
        const families = ['DanaYad', 'Dana Yad', 'Dana Yad Alef Alef'];
        const weights = ['normal', '400', '700', 'bold', '900'];
        
        families.forEach(family => {
          weights.forEach(weight => {
            css += generateFontFace(family, danaYadData, weight);
          });
        });
      }
      
      if (css) {
        console.log('Injecting custom fonts CSS');
        styleEl.textContent = css;
      }
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

  if (loading || dataLoading || !isReady) {
    return <PageLoader />;
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen relative" dir="rtl">
        <Routes>
          <Route path="*" element={<LoginPage />} />
        </Routes>
        <DatabaseStatus />
      </div>
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

      {/* Edge Trigger for Mobile Swipe */}

      {/* Main Content Area */}
      <motion.main 
        ref={mainRef}
        animate={{
          scale: isDrawerOpen ? 0.95 : 1,
          x: isDrawerOpen ? -20 : 0,
          borderRadius: isDrawerOpen ? '32px' : '0px',
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`flex-1 overflow-y-auto pb-20 relative z-10 origin-right shadow-[0_50px_100px_rgba(0,0,0,0.3)] ${
          ['/', '/events', '/gallery', '/directory', '/posts', '/admin', '/shaper', '/surfer-card', '/profile', '/world-news', '/admin-info', '/grading', '/attendance'].includes(location.pathname) ? 'luxury-bg' : 'luxury-bg'
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
              {(currentUser.role === 'Admin' || currentUser.role === 'Instructor') && (
                <>
                  <Route path="/admin-info" element={<AdminInfoPage />} />
                  <Route path="/grading" element={<MemberGradingPage />} />
                </>
              )}
              {currentUser.role === 'Admin' && (
                <>
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/attendance" element={<SurfingSessionAttendance />} />
                </>
              )}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </motion.main>
      
      <FloatingMenu onLogout={handleLogout} scrollRef={mainRef} onOpenDrawer={() => {
        console.log("Opening Drawer...");
        setIsDrawerOpen(true);
      }} />
      
      {/* PWA Install Banner */}
      <PWAInstallBanner />
      
      {/* Database Status Alert */}
      <DatabaseStatus />

      {/* Floating Diagnostics Button */}
      <button
        onClick={() => {
          console.log("--- FIREBASE DIAGNOSTICS (APP) ---");
          console.log("Config:", (window as any)._firebase_config);
          console.log("Connected:", (window as any)._db_connected);
          console.log("Last Error:", (window as any)._db_error);
          console.log("Current User:", currentUser?.email);
          alert("Diagnostics logged to console (F12)");
        }}
        className="fixed bottom-4 left-4 z-[9999] bg-black/50 text-white px-3 py-1.5 rounded-full text-xs font-mono hover:bg-black/70 transition-colors backdrop-blur-sm"
      >
        Diag
      </button>

      {/* Modern Minimalist Floating Navigation - Moved to end for proper layering */}
      <FloatingDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        activeRoute={location.pathname}
      />
    </div>
  );
};

export default App;
