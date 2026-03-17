
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
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
import { ShieldAlert } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { getCoordinates } from '../utils/geocoding';
import { getBodyLineStats } from '../utils/bodyLineStats';

declare const L: any;

interface BinData {
  label: string;
  count: number;
  color: string;
}

interface Stats {
  near: number;
  medium: number;
  far: number;
  bins: BinData[];
}

const CommunityHeatMap: React.FC = () => {
  const { members, siteConfig } = useData();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const heatmapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);
  const [stats, setStats] = useState<Stats>({ 
    near: 0, 
    medium: 0, 
    far: 0,
    bins: [] 
  });

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const initHeatMap = () => {
    const L = (window as any).L;
    if (!isMounted.current || !mapRef.current || typeof L === 'undefined') return;

    try {
      // Center on "חוף הבית" (Home Beach)
      const homeLat = siteConfig?.home_break?.lat || 32.1624;
      const homeLng = siteConfig?.home_break?.lng || 34.8447;
      const homeLatLng = L.latLng(homeLat, homeLng);

      if (!mapInstance.current) {
        const rect = mapRef.current.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          // If container has no size, retry later
          setTimeout(initHeatMap, 200);
          return;
        }

        // Initialize map
        mapInstance.current = L.map(mapRef.current, {
          center: [homeLat, homeLng],
          zoom: 11,
          zoomControl: true,
          scrollWheelZoom: true
        });

        // Add tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapInstance.current);

        // Force a resize check
        setTimeout(() => {
          if (isMounted.current && mapInstance.current) {
            mapInstance.current.invalidateSize();
          }
        }, 100);
      }

      const map = mapInstance.current;
      console.log("Map before whenReady: map exists");
      if (map) {
        console.log("Map has layerPointToLatLng:", typeof map.layerPointToLatLng === 'function');
      }
      if (!map || !isMounted.current || !map.getContainer()) return;

      // Clear existing layers except tiles
      map.eachLayer((layer: any) => {
        // Only remove layers that are NOT tile layers
        if (!(layer instanceof L.TileLayer)) {
          map.removeLayer(layer);
        }
      });

      // Prepare data for heatmap and stats
      const activeMembers = getBodyLineStats(members).activeMembers;
      const heatPoints: [number, number, number][] = [];
      
      let nearCount = 0;
      let mediumCount = 0;
      let farCount = 0;

      // Initialize 10 bins with continuous ranges
      const binDefinitions = [
        { label: '0-10', min: 0, max: 10, color: '#10b981' },
        { label: '10-20', min: 10, max: 20, color: '#10b981' },
        { label: '20-30', min: 20, max: 30, color: '#f59e0b' },
        { label: '30-40', min: 30, max: 40, color: '#f59e0b' },
        { label: '40-50', min: 40, max: 50, color: '#f59e0b' },
        { label: '50-60', min: 50, max: 60, color: '#f59e0b' },
        { label: '60-70', min: 60, max: 70, color: '#f59e0b' },
        { label: '70-80', min: 70, max: 80, color: '#f59e0b' },
        { label: '80-90', min: 80, max: 90, color: '#f59e0b' },
        { label: '90+', min: 90, max: Infinity, color: '#ef4444' },
      ];

      const binCounts = binDefinitions.map(b => ({ ...b, count: 0 }));
      let mappedCount = 0;

      activeMembers.forEach(member => {
        if (!isMounted.current) return;
        const coords = getCoordinates(member.city, member.lat, member.lng);
        if (coords) {
          mappedCount++;
          const memberLatLng = L.latLng(coords[0], coords[1]);
          const distanceKm = homeLatLng.distanceTo(memberLatLng) / 1000;

          // Operational stats calculation
          if (distanceKm <= 20) nearCount++;
          else if (distanceKm <= 100) mediumCount++;
          else farCount++;

          // Bin calculation for chart - using continuous ranges
          const binIndex = binDefinitions.findIndex(b => distanceKm >= b.min && distanceKm < b.max);
          if (binIndex !== -1) {
            binCounts[binIndex].count++;
          } else if (distanceKm >= 90) {
            binCounts[9].count++; 
          }

          // [lat, lng, intensity]
          heatPoints.push([coords[0], coords[1], 0.8]); 
        }
      });

      if (isMounted.current) {
        setStats({ 
          near: nearCount, 
          medium: mediumCount, 
          far: farCount,
          bins: binCounts.map(b => ({ label: b.label, count: b.count, color: b.color }))
        });
      }

      // Add home marker
      L.marker([homeLat, homeLng]).addTo(map).bindPopup('חוף הבית');

      // Add distance circles every 10km up to 100km
      for (let i = 1; i <= 10; i++) {
        const radius = i * 10000; // 10km, 20km, ...
        const distanceKm = i * 10;
        
        L.circle([homeLat, homeLng], {
          radius: radius,
          color: distanceKm <= 20 ? '#10b981' : (distanceKm <= 60 ? '#f59e0b' : '#ef4444'),
          fill: false,
          weight: 1,
          dashArray: i % 2 === 0 ? null : '5, 5',
          opacity: 0.4 - (i * 0.03), // Outer rings are more subtle
          interactive: false
        }).addTo(map);
      }

      // Add heatmap layer
      if (typeof L.heatLayer === 'function' && heatPoints.length > 0) {
        map.whenReady(() => {
          if (heatmapTimeoutRef.current) {
            clearTimeout(heatmapTimeoutRef.current);
          }
              heatmapTimeoutRef.current = setTimeout(() => {
            try {
              if (!isMounted.current) return;
              
              const currentMap = mapInstance.current;
              
              if (!currentMap) {
                console.log("Map instance is null, skipping heatmap layer addition");
                return;
              }
              
              // Check if map is still valid and has required methods
              if (typeof currentMap.getContainer !== 'function' || !currentMap.getContainer()) {
                console.log("Map container not ready or destroyed, skipping heatmap layer addition");
                return;
              }
              
              if (typeof currentMap.layerPointToLatLng !== 'function') {
                console.log("Map is missing layerPointToLatLng, skipping heatmap layer");
                return;
              }
              
              console.log("Adding heatmap layer with points:", heatPoints.length);
              
              const layer = L.heatLayer(heatPoints, {
                radius: 45, // Increased radius
                blur: 20,
                maxZoom: 10,
                max: 1.0,
                gradient: {
                  0.4: '#3b82f6', // blue
                  0.6: '#10b981', // green
                  0.8: '#f59e0b', // yellow/orange
                  1.0: '#ef4444'  // red
                }
              });
              
              // Final check before adding
              if (isMounted.current && mapInstance.current === currentMap) {
                layer.addTo(currentMap);
              }
            } catch (e: any) {
              console.error("Error adding heatmap layer:", e.message || e);
            }
          }, 1000);
          
          // Store timeout ID to clear it if needed (though we check isMounted)
        });
      } else if (heatPoints.length > 0) {
        // Fallback: Add glowing pulses for each point if heatmap fails
        heatPoints.forEach(p => {
          L.circleMarker([p[0], p[1]], {
            radius: 12,
            fillColor: '#3b82f6',
            color: '#fff',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.4,
            className: 'pulse-marker'
          }).addTo(map);
        });
      }

      // Adjust view to fit data or default radius
      if (heatPoints.length > 0) {
        const bounds = L.latLngBounds(heatPoints.map(p => [p[0], p[1]]));
        map.fitBounds(bounds.pad(0.1));
      } else {
        const focusCircle = L.circle([homeLat, homeLng], { radius: 25000 });
        map.fitBounds(focusCircle.getBounds(), { padding: [20, 20] });
      }
    } catch (error: any) {
      console.error("Error initializing heatmap:", error.message || error);
    }
  };

  const hasNoPoints = members.length > 0 && stats.bins.reduce((a, b) => a + b.count, 0) === 0;

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 10;

    const tryInit = () => {
      if (typeof L !== 'undefined') {
        initHeatMap();
      } else if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(tryInit, 500);
      }
    };

    tryInit();

    return () => {
      if (heatmapTimeoutRef.current) {
        clearTimeout(heatmapTimeoutRef.current);
      }
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [members, siteConfig]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="admin-info-card p-8 relative overflow-hidden group min-h-[700px] flex flex-col gap-8"
    >
      {/* Header Overlay */}
      <div className="flex items-center justify-between z-[1000]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-slate-900 shadow-lg border border-white/20">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-black text-[#7A1555] tracking-tight">מפת חום וסטטיסטיקת מרחק</h3>
            <p className="text-[#000000] text-[8px] font-bold uppercase tracking-[0.3em]">Geographic Density • Operational Ranges</p>
          </div>
        </div>
        
        {/* Operational Legend */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-[12px] font-bold text-[#000000]">חי"ר (0-20)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-[12px] font-bold text-[#000000]">שיריון (21-100)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-[12px] font-bold text-[#000000]">חיל אויר (100+)</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8 flex-1">
        {/* Map Container - Full Width */}
        <div className="rounded-[2rem] overflow-hidden border border-white/10 shadow-inner relative h-[600px]">
          <div 
            ref={mapRef} 
            className="w-full h-full z-0"
            style={{ background: '#f0f0f0', minHeight: '600px' }}
          />
          
          {hasNoPoints && (
            <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
              <div className="admin-info-card p-6 text-center max-w-xs">
                <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <h4 className="text-lg font-black text-[#7A1555] mb-2">לא נמצאו נתוני מיקום</h4>
                <p className="text-xs text-[#000000] leading-relaxed">
                  כדי להציג את מפת החום, יש לוודא שלחברי הקהילה מוגדרת עיר מגורים תקינה בטבלת החברים.
                </p>
              </div>
            </div>
          )}
          
          {/* Stats Overlay on Map */}
          <div className="absolute bottom-4 left-4 z-[1000]">
            <div className="glass-effect p-4 rounded-2xl border border-white/20 shadow-xl backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[12px] font-black text-[#7A1555] uppercase tracking-widest">חי"ר</span>
              </div>
              <p className="text-xl font-black text-[#7A1555]">{stats.near} <span className="text-xs font-normal opacity-50">חברים</span></p>
              {/* Debug Info */}
              <div className="mt-2 pt-2 border-t border-white/10">
                <p className="text-[8px] font-bold text-[#000000] uppercase tracking-tighter">
                  Mapped: {stats.near + stats.medium + stats.far} Members • Points: {stats.bins.reduce((a, b) => a + b.count, 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Heatmap Color Legend */}
          <div className="absolute bottom-4 right-4 z-[1000]">
            <div className="glass-effect p-4 rounded-2xl border border-white/20 shadow-xl backdrop-blur-xl flex flex-col gap-3">
              <span className="text-[12px] font-black text-[#7A1555] uppercase tracking-widest mb-1">צפיפות חברים</span>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-[#ef4444] shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                  <span className="text-[12px] font-bold text-[#000000]">גבוהה מאוד</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-[#f59e0b] shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                  <span className="text-[12px] font-bold text-[#000000]">גבוהה</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-[#10b981] shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  <span className="text-[12px] font-bold text-[#000000]">בינונית</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-[#3b82f6] shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                  <span className="text-[12px] font-bold text-[#000000]">נמוכה</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CommunityHeatMap;
