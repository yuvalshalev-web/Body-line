import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Github, CheckCircle2, Loader2, GitCommit, ArrowRight, Activity } from 'lucide-react';

interface GitHubAction {
  id: number;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'cancelled' | null;
  head_commit: {
    message: string;
    id: string;
    author: { name: string };
  };
  html_url: string;
}

const GitHubEngine: React.FC = () => {
  const [action, setAction] = useState<GitHubAction | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAction = async () => {
    try {
      const res = await fetch('/api/github/actions');
      const data = await res.json();
      if (data.action) setAction(data.action);
    } catch (err) {
      console.error("Failed to fetch GitHub actions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAction();
    const interval = setInterval(fetchAction, 60000);
    return () => clearInterval(interval);
  }, []);

  // Pipeline status determination
  const isGitHubActive = action?.status === 'in_progress' || action?.status === 'queued';
  const isGitHubSuccess = action?.conclusion === 'success';

  if (loading && !action) {
    return (
      <div className="w-full mt-6 bg-[#0d1117] border border-[#30363d] rounded-3xl p-6 shadow-2xl animate-pulse">
        <div className="h-10 w-40 bg-[#30363d]/50 rounded-xl mb-6" />
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-[#30363d]/30 rounded-2xl" />)}
        </div>
        <div className="h-20 bg-[#30363d]/20 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="w-full mt-6 bg-[#0d1117] border border-[#30363d] rounded-3xl p-6 shadow-2xl relative overflow-hidden group transition-all duration-500 hover:border-[#484f58]">
      {/* GitHub Style Grid Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`, backgroundSize: '20px 20px' }} />
      
      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#30363d] rounded-xl flex items-center justify-center text-white border border-[#484f58] shadow-inner">
              <Github size={22} />
            </div>
            <div>
              <h3 className="text-white text-lg font-black tracking-tight uppercase">GitHub Engine</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Automated CI/CD Pipeline</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isGitHubActive ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                <Loader2 size={12} className="text-blue-400 animate-spin" />
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Building</span>
              </div>
            ) : isGitHubSuccess ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <CheckCircle2 size={12} className="text-emerald-400" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Build Passed</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-500/10 border border-slate-500/20 rounded-full">
                <Activity size={12} className="text-slate-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Idle</span>
              </div>
            )}
          </div>
        </div>

        {/* Deployment Pipeline Visualizer */}
        <div className="grid grid-cols-3 gap-4 relative">
          {/* Connector Lines */}
          <div className="absolute top-1/2 left-[15%] right-[15%] h-px bg-gradient-to-r from-[#30363d] via-[#30363d] to-[#30363d] -translate-y-1/2 z-0" />
          
          {/* Step 1: GitHub */}
          <div className="relative z-10 flex flex-col items-center gap-2">
            <motion.div 
              animate={isGitHubActive ? { scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${isGitHubActive ? 'bg-blue-500/20 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'bg-[#161b22] border-[#30363d]'}`}
            >
              <Github size={20} className={isGitHubActive ? 'text-blue-400' : 'text-slate-500'} />
            </motion.div>
            <div className="text-center">
              <p className="text-[9px] font-black text-white uppercase tracking-tighter">GitHub</p>
              <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">Testing & Building</p>
            </div>
          </div>

          {/* Step 2: Vercel */}
          <div className="relative z-10 flex flex-col items-center gap-2">
            <motion.div 
              animate={isGitHubSuccess && !isGitHubActive ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 3, repeat: Infinity }}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${isGitHubSuccess ? 'bg-white/10 border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'bg-[#161b22] border-[#30363d]'}`}
            >
              <svg width="18" height="18" viewBox="0 0 76 65" fill="currentColor" className={isGitHubSuccess ? 'text-white' : 'text-slate-500'}>
                <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
              </svg>
            </motion.div>
            <div className="text-center">
              <p className="text-[9px] font-black text-white uppercase tracking-tighter">Vercel</p>
              <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">Deploying to Edge</p>
            </div>
          </div>

          {/* Step 3: Live */}
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${isGitHubSuccess ? 'bg-emerald-500/20 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-[#161b22] border-[#30363d]'}`}>
              <Activity size={20} className={isGitHubSuccess ? 'text-emerald-400' : 'text-slate-500'} />
            </div>
            <div className="text-center">
              <p className="text-[9px] font-black text-white uppercase tracking-tighter">Live</p>
              <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">System Healthy</p>
            </div>
          </div>
        </div>

        {/* Latest Commit Info */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 flex items-start gap-4 hover:border-[#484f58] transition-all">
          <div className="mt-1">
            <GitCommit size={18} className="text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Latest Commit</span>
              <span className="text-[8px] font-mono text-slate-600">{action?.head_commit?.id?.substring(0, 7) || 'N/A'}</span>
            </div>
            <p className="text-xs font-bold text-slate-300 truncate leading-tight">
              {action?.head_commit?.message || 'No commit message available'}
            </p>
            <p className="text-[9px] text-slate-500 mt-1">
              by <span className="text-slate-400">{action?.head_commit?.author?.name || 'Unknown'}</span>
            </p>
          </div>
          <a 
            href={action?.html_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 hover:bg-[#30363d] rounded-lg transition-colors text-slate-500 hover:text-white"
          >
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default GitHubEngine;
