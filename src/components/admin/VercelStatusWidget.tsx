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
    <div className="w-full mt-6 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden transition-all duration-500 bg-[#f4f6f8] shadow-sm border border-slate-100/50">
      {/* Elite Alabaster Background Elements */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
      <div className="absolute top-0 left-0 w-64 h-64 bg-[#B2EBF2]/10 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#B2EBF2]/10 rounded-full blur-[80px] translate-x-1/2 translate-y-1/2" />
      
      <div className="relative z-10 space-y-8">
        {/* Header - Compact */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex flex-col items-center">
              <div className="w-1.5 h-6 bg-[#003366] rounded-t-full shadow-sm" />
              <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-[#003366] shadow-sm" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[#003366] text-2xl md:text-[28px] font-black tracking-wide uppercase" style={{ fontFamily: 'Georgia, serif' }}>
                  VERCEL COMMAND CENTER
                </h2>
                <svg width="20" height="20" viewBox="0 0 76 65" fill="currentColor" className="text-[#003366]">
                  <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Pulse Summary Integrated - Where the arrow pointed */}
          {systemStats && (
            <div className="flex items-center gap-4 bg-[#fcfcfd] px-5 py-2 rounded-full border border-slate-100/50 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-3">
                <p className="text-[9px] font-black text-[#003366] uppercase tracking-widest">Health</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#7cfc00] animate-pulse" />
                  <p className="text-sm font-black text-[#7cfc00]">STABLE</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button 
              onClick={fetchStatus}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#fcfcfd] border border-slate-100/50 text-[#003366] rounded-xl hover:bg-slate-50 transition-all font-bold text-[11px] shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <a 
              href={status?.latestDeployment?.url ? `https://${status.latestDeployment.url}` : '#'} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-xl hover:bg-[#002244] transition-all font-bold text-[11px] shadow-md"
            >
              <ExternalLink size={14} />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {/* Project Info - Very Compact */}
            <div className="bg-[#fcfcfd] rounded-[2rem] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-[#003366] uppercase tracking-widest">Project</span>
                <div className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${status?.latestDeployment?.readyState === 'READY' ? 'bg-[#7cfc00]/20 text-[#7cfc00]' : 'bg-amber-50 text-amber-600'}`}>
                  {status?.latestDeployment?.readyState || 'UNKNOWN'}
                </div>
              </div>
              <div>
                <h4 className="text-xl font-black text-[#003366] tracking-tighter leading-none truncate">{status?.project?.name || 'Unknown Project'}</h4>
                <p className="text-[10px] text-[#006699] font-bold mt-2 uppercase tracking-wider">{status?.project?.framework || 'Framework'} • Node {status?.project?.nodeVersion || '18.x'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100/50">
                <div>
                  <span className="text-[9px] font-black text-[#006699] uppercase tracking-widest block mb-1">Env</span>
                  <span className="text-sm font-black text-[#003366]">{status?.project?.envCount || 0}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-[#006699] uppercase tracking-widest block mb-1">Build</span>
                  <span className="text-sm font-black text-[#003366]">{status?.latestDeployment?.createdAt ? formatDate(status.latestDeployment.createdAt).split(',')[0] : 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Speed Insights - Compact */}
            <div className="bg-[#fcfcfd] rounded-[2rem] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100/50">
              <span className="text-[11px] font-black text-[#003366] uppercase tracking-widest block mb-4">Performance</span>
              <div className="grid grid-cols-4 gap-2">
                {status?.speedInsights && Object.entries(status.speedInsights).map(([key, val], idx) => (
                  <div key={`${key}-${idx}`} className="text-center">
                    <div className="relative inline-flex items-center justify-center mb-2">
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
            <div className="bg-[#fcfcfd] rounded-[2rem] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100/50 flex flex-col">
              <span className="text-[11px] font-black text-[#003366] uppercase tracking-widest block mb-4">Usage (30d)</span>
              <div className="space-y-2 flex-1 overflow-y-auto max-h-[100px] custom-scrollbar">
                {status?.usage?.topQueries && status.usage.topQueries.length > 0 ? (
                  <div className="space-y-2">
                    {status.usage.topQueries.slice(0, 2).map((q, idx) => (
                      <div key={`${q.query}-${idx}`} className="p-2 bg-[#f4f6f8] rounded-xl border border-slate-100/50">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold text-[#003366] truncate max-w-[100px]">{q.query}</span>
                          <span className="text-[10px] font-black text-[#006699]">{q.count}</span>
                        </div>
                        <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-[#006699]" style={{ width: `${Math.min(100, (q.count / 1000) * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : status?.usage?.metrics && Object.keys(status.usage.metrics).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(status.usage.metrics).map(([key, value], idx) => (
                      <div key={`${key}-${idx}`} className="flex justify-between items-center p-2 bg-[#f4f6f8] rounded-xl border border-slate-100/50">
                        <span className="text-[9px] font-bold text-[#006699] uppercase tracking-widest">{key}</span>
                        <span className="text-[10px] font-black text-[#003366]">{value as string}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] font-bold text-[#006699] text-center py-4 uppercase tracking-widest">No data available</p>
                )}
              </div>
            </div>

            {/* Deployments - Compact */}
            <div className="bg-[#fcfcfd] rounded-[2rem] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100/50 flex flex-col">
              <span className="text-[11px] font-black text-[#003366] uppercase tracking-widest block mb-4">Latest Deployments</span>
              <div className="space-y-2 flex-1 overflow-y-auto max-h-[100px] custom-scrollbar">
                {status?.deployments && status.deployments.slice(0, 3).map((d, idx) => (
                  <div key={d.uid || idx} className="flex items-center justify-between p-2 bg-[#f4f6f8] rounded-xl border border-slate-100/50 transition-all group">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${d.state === 'READY' ? 'bg-[#7cfc00]' : 'bg-amber-500'}`} />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-[#003366] truncate">{d.url}</p>
                        <p className="text-[9px] text-[#006699] font-bold uppercase tracking-widest">{formatDate(d.createdAt).split(',')[0]}</p>
                      </div>
                    </div>
                    <a href={`https://${d.url}`} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white rounded transition-all text-[#006699] hover:text-[#003366]">
                      <ExternalLink size={12} />
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
