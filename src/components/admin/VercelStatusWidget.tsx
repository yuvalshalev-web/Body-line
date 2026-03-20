import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ExternalLink, RefreshCw, AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react';

interface VercelStatus {
  project: {
    id: string;
    name: string;
    framework: string;
    nodeVersion: string;
    envCount: number;
    updatedAt: number;
  };
  latestDeployment: {
    readyState: 'READY' | 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'CANCELED';
    url: string;
    createdAt: number;
  };
  deployments: Array<{
    uid: string;
    name: string;
    url: string;
    state: string;
    creator: string;
    createdAt: number;
  }>;
  usage: {
    metrics: any;
    topQueries: Array<{
      query: string;
      count: number;
      avgDuration: number;
    }>;
  };
  speedInsights: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
}

interface VercelStatusWidgetProps {
  systemStats?: {
    membersCount: number;
    eventsCount: number;
  }
}

const VercelStatusWidget: React.FC<VercelStatusWidgetProps> = ({ systemStats }) => {
  const [status, setStatus] = useState<VercelStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/vercel/status');
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'שגיאה בחיבור ל-Vercel');
      }
      const data = await response.json();
      setStatus(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 300000); // Poll every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    });
  };

  if (loading && !status) {
    return (
      <div className="w-full bg-[#fdfdfd] border border-white/80 rounded-3xl p-5 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] animate-pulse flex flex-col gap-4">
        <div className="h-6 w-40 bg-slate-100 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-50 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#fdfdfd] border border-white/80 rounded-3xl p-4 md:p-5 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] relative overflow-hidden transition-all duration-700">
      {/* Elite Alabaster Background Elements */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
      <div className="absolute top-0 left-0 w-64 h-64 bg-[#B2EBF2]/10 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#B2EBF2]/10 rounded-full blur-[80px] translate-x-1/2 translate-y-1/2" />
      
      <div className="relative z-10 space-y-4">
        {/* Header - Compact */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex flex-col items-center">
              <div className="w-1.5 h-6 bg-slate-900 rounded-t-full shadow-sm" />
              <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-slate-900 shadow-sm" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-slate-900 text-lg font-black tracking-tighter uppercase">Vercel Command Center</h3>
                <svg width="14" height="14" viewBox="0 0 76 65" fill="currentColor" className="text-slate-900">
                  <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
                </svg>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Live Intelligence</span>
              </div>
            </div>
          </div>

          {/* Pulse Summary Integrated - Where the arrow pointed */}
          {systemStats && (
            <div className="flex items-center gap-4 bg-white/40 backdrop-blur-sm px-4 py-1.5 rounded-2xl border border-white/60 shadow-sm">
              <div className="text-center px-3">
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Health</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-xs font-black text-emerald-600">STABLE</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button 
              onClick={fetchStatus}
              disabled={loading}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-all font-bold text-[9px] shadow-sm"
            >
              <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <a 
              href={status?.latestDeployment?.url ? `https://${status.latestDeployment.url}` : '#'} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all font-bold text-[9px] shadow-md"
            >
              <ExternalLink size={10} />
              Live
            </a>
          </div>
        </div>

        {error && (
          <div className="p-2 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 flex items-center gap-2">
            <AlertCircle size={14} />
            <span className="text-[10px] font-bold">{error}</span>
          </div>
        )}

        {status && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Project Info - Very Compact */}
            <div className="p-4 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Project</span>
                <div className={`px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest ${status?.latestDeployment?.readyState === 'READY' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {status?.latestDeployment?.readyState || 'UNKNOWN'}
                </div>
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900 tracking-tighter leading-none truncate">{status?.project?.name || 'Unknown Project'}</h4>
                <p className="text-[8px] text-slate-500 font-bold mt-1 uppercase tracking-wider">{status?.project?.framework || 'Framework'} • Node {status?.project?.nodeVersion || '18.x'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100/50">
                <div>
                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block">Env</span>
                  <span className="text-xs font-black text-slate-900">{status?.project?.envCount || 0}</span>
                </div>
                <div>
                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block">Build</span>
                  <span className="text-xs font-black text-slate-900">{status?.latestDeployment?.createdAt ? formatDate(status.latestDeployment.createdAt).split(',')[0] : 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Speed Insights - Compact */}
            <div className="p-4 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Performance</span>
              <div className="grid grid-cols-4 gap-1">
                {status?.speedInsights && Object.entries(status.speedInsights).map(([key, val], idx) => (
                  <div key={`${key}-${idx}`} className="text-center">
                    <div className="relative inline-flex items-center justify-center mb-1">
                      <svg className="w-8 h-8 transform -rotate-90">
                        <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-slate-100" />
                        <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" fill="transparent" strokeDasharray={87.9} strokeDashoffset={87.9 * (1 - (val as number) / 100)} className="text-emerald-500" />
                      </svg>
                      <span className="absolute text-[8px] font-black text-slate-900">{val as number}</span>
                    </div>
                    <span className="text-[6px] font-black text-slate-400 uppercase tracking-tight block truncate">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Usage - Compact */}
            <div className="p-4 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm flex flex-col">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Usage (30d)</span>
              <div className="space-y-2 flex-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                {status?.usage?.topQueries && status.usage.topQueries.length > 0 ? (
                  <div className="space-y-2">
                    {status.usage.topQueries.slice(0, 2).map((q, idx) => (
                      <div key={`${q.query}-${idx}`} className="p-1.5 bg-slate-50/50 rounded-lg border border-slate-100">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-[8px] font-bold text-slate-900 truncate max-w-[80px]">{q.query}</span>
                          <span className="text-[8px] font-black text-slate-600">{q.count}</span>
                        </div>
                        <div className="w-full h-0.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-900" style={{ width: `${Math.min(100, (q.count / 1000) * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : status?.usage?.metrics && Object.keys(status.usage.metrics).length > 0 ? (
                  <div className="space-y-1.5">
                    {Object.entries(status.usage.metrics).map(([key, value], idx) => (
                      <div key={`${key}-${idx}`} className="flex justify-between items-center p-1.5 bg-slate-50/50 rounded-lg border border-slate-100">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{key}</span>
                        <span className="text-[8px] font-black text-slate-900">{value as string}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[8px] font-bold text-slate-400 text-center py-2 uppercase tracking-widest">No data available</p>
                )}
              </div>
            </div>

            {/* Deployments - Compact */}
            <div className="p-4 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm flex flex-col">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Latest Deployments</span>
              <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                {status?.deployments && status.deployments.slice(0, 3).map((d, idx) => (
                  <div key={d.uid || idx} className="flex items-center justify-between p-1.5 bg-slate-50/50 rounded-lg border border-transparent hover:border-slate-200 transition-all group">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <div className={`w-1 h-1 rounded-full flex-shrink-0 ${d.state === 'READY' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <div className="min-w-0">
                        <p className="text-[8px] font-bold text-slate-900 truncate">{d.url}</p>
                        <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">{formatDate(d.createdAt).split(',')[0]}</p>
                      </div>
                    </div>
                    <a href={`https://${d.url}`} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white rounded transition-all text-slate-400 hover:text-slate-900">
                      <ExternalLink size={8} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VercelStatusWidget;
