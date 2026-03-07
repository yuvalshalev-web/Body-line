
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
import { useData } from '../contexts/DataContext';
import { getCoordinates } from '../src/utils/geocoding';

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
  const [stats, setStats] = useState<Stats>({ 
    near: 0, 
    medium: 0, 
    far: 0,
    bins: [] 
  });

  const initHeatMap = () => {
    if (!mapRef.current) return;

    // Center on "חוף הבית" (Home Beach)
    const homeLat = siteConfig.home_break?.lat || 32.1624;
    const homeLng = siteConfig.home_break?.lng || 34.8447;
    const homeLatLng = L.latLng(homeLat, homeLng);

    if (!mapInstance.current) {
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
        if (mapInstance.current) {
          mapInstance.current.invalidateSize();
        }
      }, 100);
    }

    // Clear existing layers except tiles
    mapInstance.current.eachLayer((layer: any) => {
      if (layer instanceof L.Circle || (L.HeatLayer && layer instanceof L.HeatLayer)) {
        mapInstance.current.removeLayer(layer);
      }
    });

    // Prepare data for heatmap and stats
    const activeMembers = members.filter(m => m.isActive !== false);
    const heatPoints: [number, number, number][] = [];
    
    let nearCount = 0;
    let mediumCount = 0;
    let farCount = 0;

    // Initialize 10 bins
    const binDefinitions = [
      { label: '0-10', min: 0, max: 10, color: '#10b981' },
      { label: '11-20', min: 11, max: 20, color: '#10b981' },
      { label: '21-30', min: 21, max: 30, color: '#f59e0b' },
      { label: '31-40', min: 31, max: 40, color: '#f59e0b' },
      { label: '41-50', min: 41, max: 50, color: '#f59e0b' },
      { label: '51-60', min: 51, max: 60, color: '#f59e0b' },
      { label: '61-70', min: 61, max: 70, color: '#f59e0b' },
      { label: '71-80', min: 71, max: 80, color: '#f59e0b' },
      { label: '81-90', min: 81, max: 90, color: '#f59e0b' },
      { label: '91-100+', min: 91, max: Infinity, color: '#ef4444' },
    ];

    const binCounts = binDefinitions.map(b => ({ ...b, count: 0 }));

    activeMembers.forEach(member => {
      const coords = getCoordinates(member.city, member.lat, member.lng);
      if (coords) {
        const memberLatLng = L.latLng(coords[0], coords[1]);
        const distanceKm = homeLatLng.distanceTo(memberLatLng) / 1000;

        // Operational stats calculation
        if (distanceKm <= 20) nearCount++;
        else if (distanceKm <= 100) mediumCount++;
        else farCount++;

        // Bin calculation for chart
        const binIndex = binDefinitions.findIndex(b => distanceKm >= b.min && distanceKm <= b.max);
        if (binIndex !== -1) {
          binCounts[binIndex].count++;
        } else if (distanceKm > 100) {
          binCounts[9].count++; // Add to the last bin if it's > 100
        }

        // [lat, lng, intensity]
        heatPoints.push([coords[0], coords[1], 0.5]);
      }
    });

    setStats({ 
      near: nearCount, 
      medium: mediumCount, 
      far: farCount,
      bins: binCounts.map(b => ({ label: b.label, count: b.count, color: b.color }))
    });

    // Add home marker
    console.log('L object:', L);
    L.marker([homeLat, homeLng]).addTo(mapInstance.current).bindPopup('חוף הבית');

    // Add distance circles
    const circles = [
      { radius: 25000, color: '#10b981', dashArray: null }, // 25km - Green
      { radius: 100000, color: '#f59e0b', dashArray: '10, 10' } // 100km - Orange
    ];

    circles.forEach(c => {
      L.circle([homeLat, homeLng], {
        radius: c.radius,
        color: c.color,
        fill: false,
        weight: 2,
        dashArray: c.dashArray,
        interactive: false
      }).addTo(mapInstance.current);
    });

    // Add heatmap layer
    console.log('Heatmap points:', heatPoints);
    console.log('Number of heat points:', heatPoints.length);
    console.log('L.heatLayer available:', !!L.heatLayer);
    if (L.heatLayer && heatPoints.length > 0) {
      L.heatLayer(heatPoints, {
        radius: 40,
        blur: 20,
        maxZoom: 17,
        gradient: {
          0.2: 'blue',
          0.4: 'green',
          0.6: 'yellow',
          1.0: 'red'
        }
      }).addTo(mapInstance.current);
    } else {
      console.warn('Heatmap layer not added: L.heatLayer is', L.heatLayer, 'heatPoints length is', heatPoints.length);
    }

    // Adjust view to fit data or default radius
    if (heatPoints.length > 0) {
      const bounds = L.latLngBounds(heatPoints.map(p => [p[0], p[1]]));
      mapInstance.current.fitBounds(bounds.pad(0.1));
    } else {
      const focusCircle = L.circle([homeLat, homeLng], { radius: 25000 });
      mapInstance.current.fitBounds(focusCircle.getBounds(), { padding: [20, 20] });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof L !== 'undefined') {
        initHeatMap();
      }
    }, 500);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
      clearTimeout(timer);
    };
  }, [members, siteConfig]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel p-8 relative overflow-hidden group min-h-[700px] flex flex-col gap-8"
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
            <h3 className="text-xl font-black glass-text-primary tracking-tight">מפת חום וסטטיסטיקת מרחק</h3>
            <p className="glass-text-secondary text-[8px] font-bold uppercase tracking-[0.3em]">Geographic Density • Operational Ranges</p>
          </div>
        </div>
        
        {/* Operational Legend */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold glass-text-secondary">זמינות מיידית (0-20)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-[10px] font-bold glass-text-secondary">דורש התראה (21-100)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-[10px] font-bold glass-text-secondary">מרוחקים (100+)</span>
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
          
          {/* Stats Overlay on Map */}
          <div className="absolute bottom-4 left-4 z-[1000]">
            <div className="glass-effect p-4 rounded-2xl border border-white/20 shadow-xl backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black glass-text-primary uppercase tracking-widest">זמינות מיידית</span>
              </div>
              <p className="text-xl font-black glass-text-primary">{stats.near} <span className="text-xs font-normal opacity-50">חברים</span></p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CommunityHeatMap;
