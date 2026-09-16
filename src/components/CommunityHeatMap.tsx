import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { 
  MapPin, 
  Activity, 
  Navigation, 
  Layers, 
  BarChart2, 
  Map, 
  ShieldAlert,
  Compass,
  Building2,
  Users
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { isAppShaperUser } from '../constants';
import { getCoordinates } from '../utils/geocoding';
import { calculateDistance } from '../utils/distanceCalculator';
import { loadLeafletWithHeat } from '../utils/leafletHeat';

interface BinData {
  label: string;
  count: number;
  min: number;
  max: number;
  color: string;
  category: 'infantry' | 'armor' | 'airforce';
}

type ViewMode = 'split' | 'map' | 'chart';

const CommunityHeatMap: React.FC = () => {
  const { members, siteConfig } = useData();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const heatmapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);
  
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [selectedRange, setSelectedRange] = useState<'all' | 'infantry' | 'armor' | 'airforce'>('all');
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Pre-calculate all distance data, bins, cities and operational KPIs
  const geoStats = useMemo(() => {
    const communityMembers = members.filter(m => m.role !== 'Staff' && !isAppShaperUser(m));
    const activeMembers = communityMembers.filter(m => m.isActive);

    const homeLat = siteConfig?.home_break?.lat || 32.1624;
    const homeLng = siteConfig?.home_break?.lng || 34.8447;

    const binDefinitions: BinData[] = [
      { label: '0-10', min: 0, max: 10, count: 0, color: '#10b981', category: 'infantry' },
      { label: '11-20', min: 10, max: 20, count: 0, color: '#10b981', category: 'infantry' },
      { label: '21-30', min: 20, max: 30, count: 0, color: '#f59e0b', category: 'armor' },
      { label: '31-40', min: 30, max: 40, count: 0, color: '#f59e0b', category: 'armor' },
      { label: '41-50', min: 40, max: 50, count: 0, color: '#f59e0b', category: 'armor' },
      { label: '51-60', min: 50, max: 60, count: 0, color: '#f59e0b', category: 'armor' },
      { label: '61-70', min: 60, max: 70, count: 0, color: '#f59e0b', category: 'armor' },
      { label: '71-80', min: 70, max: 80, count: 0, color: '#f59e0b', category: 'armor' },
      { label: '81-90', min: 80, max: 90, count: 0, color: '#f59e0b', category: 'armor' },
      { label: '91-100+', min: 90, max: Infinity, count: 0, color: '#ef4444', category: 'airforce' },
    ];

    let nearCount = 0; // מקומיים 0-20 ק״מ
    let mediumCount = 0; // סמוכים 21-100 ק״מ
    let farCount = 0; // מרוחקים 100+ ק״מ
    let totalDistanceSum = 0;
    let mappedMembersCount = 0;

    const heatPoints: [number, number, number][] = [];
    const cityCountMap: { [city: string]: number } = {};

    activeMembers.forEach(member => {
      let coords = getCoordinates(member.city, member.lat, member.lng);
      
      if (coords && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        const distanceKm = calculateDistance(homeLat, homeLng, coords[0], coords[1]);
        
        mappedMembersCount++;
        totalDistanceSum += distanceKm;

        // Group counts
        if (distanceKm <= 20) {
          nearCount++;
        } else if (distanceKm <= 100) {
          mediumCount++;
        } else {
          farCount++;
        }

        // Bins
        const binIndex = binDefinitions.findIndex(b => distanceKm >= b.min && distanceKm < b.max);
        if (binIndex !== -1) {
          binDefinitions[binIndex].count++;
        } else if (distanceKm >= 90) {
          binDefinitions[9].count++;
        }

        // Heat points for Leaflet [lat, lng, intensity]
        heatPoints.push([coords[0], coords[1], 0.85]);

        // City tracking
        const cityName = member.city?.trim() || 'לא צוינה עיר';
        cityCountMap[cityName] = (cityCountMap[cityName] || 0) + 1;
      }
    });

    const avgDistance = mappedMembersCount > 0 ? (totalDistanceSum / mappedMembersCount).toFixed(1) : '0';

    // Top cities sorted descending
    const topCities = Object.entries(cityCountMap)
      .map(([city, count]) => ({
        city,
        count,
        percentage: mappedMembersCount > 0 ? Math.round((count / mappedMembersCount) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalActive: activeMembers.length,
      mappedCount: mappedMembersCount,
      near: nearCount,
      medium: mediumCount,
      far: farCount,
      avgDistance,
      bins: binDefinitions,
      heatPoints,
      topCities,
      homeLat,
      homeLng
    };
  }, [members, siteConfig]);

  // Filtered chart data based on active range selection
  const filteredBins = useMemo(() => {
    if (selectedRange === 'all') return geoStats.bins;
    return geoStats.bins.filter(b => b.category === selectedRange);
  }, [geoStats.bins, selectedRange]);

  const heatLayerRef = useRef<any>(null);

  // Leaflet Map Initialization & Updates
  useEffect(() => {
    isMounted.current = true;
    return () => { 
      isMounted.current = false; 
      if (heatmapTimeoutRef.current) {
        clearTimeout(heatmapTimeoutRef.current);
      }
      if (heatLayerRef.current && mapInstance.current) {
        try {
          mapInstance.current.removeLayer(heatLayerRef.current);
        } catch (_) {}
        heatLayerRef.current = null;
      }
      if (mapInstance.current) {
        try {
          mapInstance.current.remove();
        } catch (_) {}
        mapInstance.current = null;
      }
    };
  }, []);

  const initHeatMap = async () => {
    if (!isMounted.current || !mapRef.current) return;

    try {
      const container = mapRef.current;
      const rect = container.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 10 || container.clientWidth < 10 || container.clientHeight < 10) {
        setTimeout(() => {
          if (isMounted.current) initHeatMap();
        }, 150);
        return;
      }

      const L = await loadLeafletWithHeat();
      if (!isMounted.current || !mapRef.current) return;

      const { homeLat, homeLng, heatPoints } = geoStats;

      if (!mapInstance.current) {
        // Clear any lingering leaflet id on container
        if ((container as any)._leaflet_id) {
          delete (container as any)._leaflet_id;
        }

        mapInstance.current = L.map(container, {
          center: [homeLat, homeLng],
          zoom: 11,
          zoomControl: true,
          scrollWheelZoom: true
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap'
        }).addTo(mapInstance.current);

        setTimeout(() => {
          if (isMounted.current && mapInstance.current) {
            mapInstance.current.invalidateSize();
          }
        }, 100);
      }

      const map = mapInstance.current;
      if (!map || !isMounted.current || !map.getContainer()) return;

      map.invalidateSize();
      const mapSize = map.getSize();
      if (!mapSize || mapSize.x <= 0 || mapSize.y <= 0) {
        setTimeout(() => {
          if (isMounted.current) initHeatMap();
        }, 150);
        return;
      }

      // Clear layers except tiles
      map.eachLayer((layer: any) => {
        if (!(layer instanceof L.TileLayer)) {
          map.removeLayer(layer);
        }
      });
      heatLayerRef.current = null;

      // Add home break icon marker
      const homeIcon = L.divIcon({
        className: 'home-break-marker',
        html: `
          <div style="
            width: 38px;
            height: 38px;
            background: linear-gradient(135deg, #0284c7, #0369a1);
            border: 3px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 4px 12px rgba(2, 132, 199, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 18px;
          ">
            🏄
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19]
      });

      L.marker([homeLat, homeLng], { icon: homeIcon })
        .addTo(map)
        .bindPopup(`
          <div style="text-align: right; font-family: sans-serif; direction: rtl; padding: 4px;">
            <b style="color: #0369a1; font-size: 14px;">🏖️ חוף הבית (נקודת הייחוס)</b>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">מרכז הפעילות של הקהילה</div>
          </div>
        `);

      // Concentric distance radar circles (10km intervals)
      for (let i = 1; i <= 10; i++) {
        const radius = i * 10000;
        const distanceKm = i * 10;
        
        const ringColor = distanceKm <= 20 ? '#10b981' : (distanceKm <= 60 ? '#f59e0b' : '#ef4444');
        
        L.circle([homeLat, homeLng], {
          radius: radius,
          color: ringColor,
          fill: false,
          weight: 1.5,
          dashArray: i % 2 === 0 ? undefined : '6, 6',
          opacity: Math.max(0.15, 0.45 - (i * 0.03)),
          interactive: false
        }).addTo(map);
      }

      // Heatmap layer or fallback
      let heatLayerAdded = false;
      if (typeof (L as any).heatLayer === 'function' && heatPoints.length > 0) {
        try {
          const layer = (L as any).heatLayer(heatPoints, {
            radius: 42,
            blur: 22,
            maxZoom: 11,
            max: 1.0,
            gradient: {
              0.3: '#3b82f6', // blue (low)
              0.55: '#10b981', // green (medium)
              0.75: '#f59e0b', // yellow/orange (high)
              1.0: '#ef4444'  // red (very high)
            }
          });

          layer.addTo(map);
          heatLayerRef.current = layer;
          heatLayerAdded = true;
        } catch (e: any) {
          console.warn("Heatmap layer warning (using fallback markers):", e.message || e);
        }
      }

      // If heat layer wasn't added or points exist, also add pulsing circle markers as fallback/reinforcement
      if (!heatLayerAdded && heatPoints.length > 0) {
        heatPoints.forEach(p => {
          L.circleMarker([p[0], p[1]], {
            radius: 9,
            fillColor: '#0ea5e9',
            color: '#ffffff',
            weight: 2,
            opacity: 0.9,
            fillOpacity: 0.6
          }).addTo(map);
        });
      }

      // Fit bounds to show all members + home break
      if (heatPoints.length > 0) {
        const bounds = L.latLngBounds(heatPoints.map(p => [p[0], p[1]]));
        bounds.extend([homeLat, homeLng]);
        map.fitBounds(bounds.pad(0.15));
      } else {
        const focusCircle = L.circle([homeLat, homeLng], { radius: 25000 });
        map.fitBounds(focusCircle.getBounds(), { padding: [20, 20] });
      }

      setMapReady(true);
      setMapError(null);
    } catch (error: any) {
      console.error("Error initializing heatmap:", error.message || error);
      setMapError('שגיאה באתחול מפת החום');
    }
  };

  useEffect(() => {
    if (viewMode !== 'chart') {
      const timer = setTimeout(() => {
        initHeatMap();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [geoStats, viewMode]);

  // Set up ResizeObserver for map container
  useEffect(() => {
    if (!mapRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0 && mapInstance.current) {
          mapInstance.current.invalidateSize();
        }
      }
    });

    observer.observe(mapRef.current);
    return () => observer.disconnect();
  }, [viewMode]);

  // Invalidate map size when view mode changes
  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode !== 'chart') {
      setTimeout(() => {
        if (mapInstance.current) {
          mapInstance.current.invalidateSize();
        }
      }, 200);
    }
  };

  const hasNoPoints = geoStats.totalActive > 0 && geoStats.mappedCount === 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="admin-info-card p-6 md:p-8 rounded-[3rem] relative overflow-hidden group flex flex-col gap-6"
      dir="rtl"
    >
      {/* Background Ambience Glow */}
      <div className="absolute inset-0 overflow-hidden rounded-[3rem] pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--surfer-cyan)]/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[var(--surfer-pink)]/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl glass-effect flex items-center justify-center text-[#004D40] shadow-inner border border-white/20">
            <Compass size={28} className="animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-2xl md:text-3xl font-black text-[#7A1555] tracking-tight">
                פיזור גיאוגרפי ומפת חום
              </h3>
              <span className="hidden sm:inline-block px-3 py-1 rounded-full text-xs font-black bg-[#004D40]/10 text-[#004D40] border border-[#004D40]/20">
                {geoStats.mappedCount} מתוך {geoStats.totalActive} חברים מופו
              </span>
            </div>
            <p className="text-[#000000] text-[10px] font-bold uppercase tracking-[0.25em] opacity-75 mt-0.5">
              Geographic Intelligence • Density Heatmap & Distance Distribution
            </p>
          </div>
        </div>

        {/* View Mode Controls */}
        <div className="flex items-center gap-1.5 p-1.5 bg-black/5 rounded-2xl border border-white/30 backdrop-blur-md self-start md:self-auto">
          <button
            onClick={() => handleViewChange('split')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              viewMode === 'split' 
                ? 'bg-white text-[#7A1555] shadow-md border border-white/50' 
                : 'text-gray-700 hover:text-black hover:bg-white/40'
            }`}
          >
            <Layers size={16} />
            <span>משולב (מפה + נתונים)</span>
          </button>

          <button
            onClick={() => handleViewChange('map')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              viewMode === 'map' 
                ? 'bg-white text-[#7A1555] shadow-md border border-white/50' 
                : 'text-gray-700 hover:text-black hover:bg-white/40'
            }`}
          >
            <Map size={16} />
            <span>מפת חום</span>
          </button>

          <button
            onClick={() => handleViewChange('chart')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              viewMode === 'chart' 
                ? 'bg-white text-[#7A1555] shadow-md border border-white/50' 
                : 'text-gray-700 hover:text-black hover:bg-white/40'
            }`}
          >
            <BarChart2 size={16} />
            <span>גרף פיזור מספרי</span>
          </button>
        </div>
      </div>

      {/* Top Operational Metrics (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 z-10">
        {/* Infantry (0-20km) */}
        <div 
          onClick={() => setSelectedRange(selectedRange === 'infantry' ? 'all' : 'infantry')}
          className={`p-4 md:p-5 rounded-2xl border transition-all cursor-pointer shadow-sm ${
            selectedRange === 'infantry'
              ? 'bg-emerald-500/20 border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
              : 'glass-effect border-white/30 hover:bg-white/40'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              מקומיים (0-20 ק״מ)
            </span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
              {geoStats.mappedCount > 0 ? Math.round((geoStats.near / geoStats.mappedCount) * 100) : 0}%
            </span>
          </div>
          <p className="text-2xl md:text-3xl font-black text-emerald-950 flex items-baseline gap-1.5">
            {geoStats.near}
            <span className="text-xs font-bold text-emerald-700 opacity-80">חברים מקומיים</span>
          </p>
        </div>

        {/* Armor (21-100km) */}
        <div 
          onClick={() => setSelectedRange(selectedRange === 'armor' ? 'all' : 'armor')}
          className={`p-4 md:p-5 rounded-2xl border transition-all cursor-pointer shadow-sm ${
            selectedRange === 'armor'
              ? 'bg-amber-500/20 border-amber-500 shadow-md ring-2 ring-amber-500/30'
              : 'glass-effect border-white/30 hover:bg-white/40'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              סמוכים (21-100 ק״מ)
            </span>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
              {geoStats.mappedCount > 0 ? Math.round((geoStats.medium / geoStats.mappedCount) * 100) : 0}%
            </span>
          </div>
          <p className="text-2xl md:text-3xl font-black text-amber-950 flex items-baseline gap-1.5">
            {geoStats.medium}
            <span className="text-xs font-bold text-amber-700 opacity-80">חברים סמוכים</span>
          </p>
        </div>

        {/* Airforce (100+ km) */}
        <div 
          onClick={() => setSelectedRange(selectedRange === 'airforce' ? 'all' : 'airforce')}
          className={`p-4 md:p-5 rounded-2xl border transition-all cursor-pointer shadow-sm ${
            selectedRange === 'airforce'
              ? 'bg-red-500/20 border-red-500 shadow-md ring-2 ring-red-500/30'
              : 'glass-effect border-white/30 hover:bg-white/40'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-red-800 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              מרוחקים (100+ ק״מ)
            </span>
            <span className="text-[11px] font-bold text-red-700 bg-red-100/80 px-2 py-0.5 rounded-full">
              {geoStats.mappedCount > 0 ? Math.round((geoStats.far / geoStats.mappedCount) * 100) : 0}%
            </span>
          </div>
          <p className="text-2xl md:text-3xl font-black text-red-950 flex items-baseline gap-1.5">
            {geoStats.far}
            <span className="text-xs font-bold text-red-700 opacity-80">חברים מרוחקים</span>
          </p>
        </div>

        {/* Average Distance */}
        <div className="p-4 md:p-5 rounded-2xl glass-effect border border-white/30 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-[#004D40] uppercase tracking-wider flex items-center gap-1.5">
              <Navigation size={14} className="text-[#004D40]" />
              מרחק ממוצע מהחוף
            </span>
            <span className="text-[10px] font-bold text-gray-500">קו אווירי</span>
          </div>
          <p className="text-2xl md:text-3xl font-black text-[#004D40] flex items-baseline gap-1.5">
            {geoStats.avgDistance}
            <span className="text-xs font-bold text-gray-700 opacity-80">ק״מ בממוצע</span>
          </p>
        </div>
      </div>

      {/* Main Unified Interactive Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 z-10">
        {/* Map Column */}
        {(viewMode === 'split' || viewMode === 'map') && (
          <div className={`${viewMode === 'split' ? 'lg:col-span-7' : 'lg:col-span-12'} flex flex-col gap-4`}>
            <div className="rounded-[2.5rem] overflow-hidden border border-white/40 shadow-[0_10px_30px_rgba(0,0,0,0.08)] relative h-[520px] bg-slate-100">
              <div 
                ref={mapRef} 
                className="w-full h-full z-0"
                style={{ minHeight: '520px' }}
              />

              {!mapReady && !hasNoPoints && (
                <div className="absolute inset-0 z-[10] flex flex-col items-center justify-center bg-slate-100/90 backdrop-blur-xs">
                  <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mb-2" />
                  <span className="text-xs font-bold text-slate-700">טוען מפת חום ופיזור...</span>
                </div>
              )}

              {mapError && (
                <div className="absolute top-4 right-4 z-[1000] bg-red-50 text-red-700 px-3.5 py-2 rounded-xl text-xs font-bold border border-red-200 shadow-sm">
                  {mapError}
                </div>
              )}

              {hasNoPoints && (
                <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                  <div className="admin-info-card p-6 text-center max-w-xs rounded-2xl">
                    <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                    <h4 className="text-lg font-black text-[#7A1555] mb-2">לא נמצאו נתוני מיקום</h4>
                    <p className="text-xs text-[#000000] leading-relaxed">
                      כדי להציג את מפת החום, יש לוודא שלמשתתפי הקהילה מוגדרת עיר מגורים תקינה.
                    </p>
                  </div>
                </div>
              )}

              {/* Floating Map Legend */}
              <div className="absolute bottom-4 right-4 z-[1000] max-w-[200px]">
                <div className="glass-effect p-3.5 rounded-2xl border border-white/30 shadow-xl backdrop-blur-xl">
                  <p className="text-[11px] font-black text-[#7A1555] uppercase tracking-wider mb-2">צפיפות משתמשים</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#ef4444] shadow-sm" />
                      <span className="text-[11px] font-bold text-gray-800">גבוהה מאוד</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#f59e0b] shadow-sm" />
                      <span className="text-[11px] font-bold text-gray-800">גבוהה</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#10b981] shadow-sm" />
                      <span className="text-[11px] font-bold text-gray-800">בינונית</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#3b82f6] shadow-sm" />
                      <span className="text-[11px] font-bold text-gray-800">נמוכה</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Range Legend */}
              <div className="absolute top-4 left-4 z-[1000]">
                <div className="glass-effect px-3.5 py-2 rounded-xl border border-white/30 shadow-md backdrop-blur-md flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-gray-800">0-20 ק״מ</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-[10px] font-bold text-gray-800">21-100 ק״מ</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-[10px] font-bold text-gray-800">100+ ק״מ</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Numeric Distribution Column (Bar Chart & City Breakdown) */}
        {(viewMode === 'split' || viewMode === 'chart') && (
          <div className={`${viewMode === 'split' ? 'lg:col-span-5' : 'lg:col-span-12'} flex flex-col gap-6`}>
            {/* Numeric Bar Chart Card */}
            <div className="admin-info-card p-6 rounded-[2.5rem] flex flex-col justify-between border border-white/30 shadow-sm flex-1">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl glass-effect flex items-center justify-center text-[#004D40] border border-white/20">
                    <BarChart2 size={20} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-[#7A1555] tracking-tight">פיזור מרחקים מספרי</h4>
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">כמות חברים לפי מרחקי ק"מ</p>
                  </div>
                </div>

                {selectedRange !== 'all' && (
                  <button 
                    onClick={() => setSelectedRange('all')}
                    className="text-[11px] font-black text-[#004D40] hover:underline bg-[#004D40]/10 px-2.5 py-1 rounded-full"
                  >
                    הצג הכל
                  </button>
                )}
              </div>

              {/* Bar Chart */}
              <div className="w-full h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredBins} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="label" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#1f2937', fontSize: 11, fontWeight: 800 }}
                      dy={8}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#1f2937', fontSize: 10, fontWeight: 700 }}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as BinData;
                          return (
                            <div className="glass-effect p-3 rounded-xl border border-white/30 shadow-xl backdrop-blur-md text-right" dir="rtl">
                              <p className="text-xs font-black text-[#7A1555] mb-1">טווח מרחק: {data.label} ק״מ</p>
                              <p className="text-base font-black text-[#004D40] flex items-center gap-1.5">
                                {data.count} <span className="text-xs font-normal text-gray-700">חברי קהילה</span>
                              </p>
                              <p className="text-[10px] font-bold text-gray-500 mt-1">
                                {geoStats.mappedCount > 0 ? ((data.count / geoStats.mappedCount) * 100).toFixed(1) : 0}% מכלל החברים הממופים
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={viewMode === 'chart' ? 44 : 26}>
                      {filteredBins.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color} 
                          fillOpacity={0.85}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Bottom Top Cities Distribution */}
              <div className="mt-4 pt-4 border-t border-black/5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-[#7A1555] flex items-center gap-1.5">
                    <Building2 size={14} className="text-[#004D40]" />
                    5 הערים המובילות בקהילה
                  </span>
                  <span className="text-[10px] font-bold text-gray-500">לפי מקום מגורים</span>
                </div>

                <div className="space-y-2">
                  {geoStats.topCities.map((item, idx) => (
                    <div key={item.city} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="w-4 text-center font-black text-gray-400">{idx + 1}.</span>
                        <span className="font-black text-gray-800 min-w-[70px]">{item.city}</span>
                        <div className="flex-1 bg-black/5 h-2 rounded-full overflow-hidden max-w-[120px] mx-2">
                          <div 
                            className="bg-[#004D40] h-full rounded-full transition-all duration-500" 
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                      <span className="font-black text-[#004D40]">{item.count} חברים ({item.percentage}%)</span>
                    </div>
                  ))}
                  {geoStats.topCities.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-2">אין נתוני ערים זמינים</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CommunityHeatMap;
