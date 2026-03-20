import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Github, CheckCircle2, Loader2, GitCommit, ArrowRight, Activity, GitPullRequest } from 'lucide-react';

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

const GitHubCommandCenter: React.FC = () => {
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

  const isGitHubActive = action?.status === 'in_progress' || action?.status === 'queued';
  const isGitHubSuccess = action?.conclusion === 'success';
  const isGitHubFailure = action?.conclusion === 'failure';

  return (
    <div className="w-full mt-6 rounded-3xl p-6 relative overflow-hidden transition-all duration-500"
      style={{
        background: 'rgba(240, 248, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.8)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.8)',
        borderBottom: '1px solid rgba(0, 66, 106, 0.1)',
        borderRight: '1px solid rgba(0, 66, 106, 0.1)',
        boxShadow: '0 10px 30px rgba(49, 170, 193, 0.15)'
      }}
    >
      {/* Grain Overlay */}
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

      <div className="relative z-10 space-y-6">
        <h2 className="text-[#00426a] text-xl font-black tracking-tight uppercase" style={{ textShadow: '0 0 10px rgba(0, 66, 106, 0.2)' }}>GitHub Command Center</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Deployment Pipeline Visualizer */}
          <div className="grid grid-cols-3 gap-4 relative mb-6" style={{ background: 'rgba(240, 248, 255, 0.2)', padding: '1rem', borderRadius: '1rem', border: '1px solid rgba(255, 255, 255, 0.5)' }}>
            {/* Connector Lines */}
            <div className="absolute top-1/2 left-[15%] right-[15%] h-px bg-gradient-to-r from-[#00426a]/20 via-[#00426a]/20 to-[#00426a]/20 -translate-y-1/2 z-0" />
            
            {/* Step 1: AI Studio */}
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center border-2 bg-[#f0f8ff] border-[#00426a]">
                <Activity size={20} className="text-[#00426a]" />
              </div>
              <div className="text-center">
                <p className="text-[9px] font-black text-[#00426a] uppercase tracking-tighter">AI Studio</p>
              </div>
            </div>

            {/* Step 2: GitHub */}
            <div className="relative z-10 flex flex-col items-center gap-2">
              <motion.div 
                animate={isGitHubActive ? { scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${isGitHubActive ? 'bg-[#00426a]/20 border-[#00426a] shadow-[0_0_20px_rgba(0,66,106,0.3)]' : 'bg-[#f0f8ff] border-[#00426a]'}`}
              >
                <Github size={20} className={isGitHubActive ? 'text-[#00426a]' : 'text-[#0071a1]'} />
              </motion.div>
              <div className="text-center">
                <p className="text-[9px] font-black text-[#00426a] uppercase tracking-tighter">GitHub</p>
              </div>
            </div>

            {/* Step 3: Vercel */}
            <div className="relative z-10 flex flex-col items-center gap-2">
              <motion.div 
                animate={isGitHubSuccess && !isGitHubActive ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 3, repeat: Infinity }}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${isGitHubSuccess ? 'bg-[#00426a]/20 border-[#00426a] shadow-[0_0_20px_rgba(0,66,106,0.3)]' : 'bg-[#f0f8ff] border-[#00426a]'}`}
              >
                <svg width="18" height="18" viewBox="0 0 76 65" fill="currentColor" className={isGitHubSuccess ? 'text-[#00426a]' : 'text-[#0071a1]'}>
                  <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
                </svg>
              </motion.div>
              <div className="text-center">
                <p className="text-[9px] font-black text-[#00426a] uppercase tracking-tighter">Vercel</p>
              </div>
            </div>
          </div>

          {/* 1. The Pulse */}
          <div className="rounded-2xl p-4 flex items-center gap-4" style={{ background: 'rgba(240, 248, 255, 0.2)', border: '1px solid rgba(255, 255, 255, 0.5)' }}>
            <div className={`w-6 h-6 rounded-full ${isGitHubActive ? 'bg-[#2D6A4F] animate-pulse' : isGitHubFailure ? 'bg-[#BC4749] animate-pulse' : 'bg-[#2D6A4F]'}`} />
            <div>
              <p className="text-[10px] font-black text-[#00426a] uppercase tracking-widest">The Pulse</p>
              <p className="text-sm font-bold text-[#00426a]">{isGitHubActive ? 'Deploying...' : isGitHubFailure ? 'Build Failed' : 'System Stable'}</p>
            </div>
          </div>

          {/* 2. Pull Request Tracker */}
          <div className="rounded-2xl p-4 flex items-center justify-between" style={{ background: 'rgba(240, 248, 255, 0.2)', border: '1px solid rgba(255, 255, 255, 0.5)' }}>
            <div>
              <p className="text-[10px] font-black text-[#00426a] uppercase tracking-widest">PR Tracker</p>
              <p className={`text-3xl font-black ${4 > 3 ? 'text-[#BC4749]' : 'text-[#00426a]'}`}>4</p>
            </div>
            <GitPullRequest className="text-[#0071a1]" />
          </div>

          {/* 3. Recent Commits Feed */}
          <div className="rounded-2xl p-4 md:col-span-2" style={{ background: 'rgba(240, 248, 255, 0.2)', border: '1px solid rgba(255, 255, 255, 0.5)' }}>
            <p className="text-[10px] font-black text-[#00426a] uppercase tracking-widest mb-2">Recent Commits</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-[#00426a]/10 pb-2">
                <p className="text-xs text-[#00426a] truncate">Implement real-time quota monitoring</p>
                <p className="text-[10px] text-[#0071a1]">20m ago</p>
              </div>
            </div>
          </div>

          {/* 4. Open Issues & Bugs */}
          <div className="rounded-2xl p-4 md:col-span-2" style={{ background: 'rgba(240, 248, 255, 0.2)', border: '1px solid rgba(255, 255, 255, 0.5)' }}>
            <p className="text-[10px] font-black text-[#00426a] uppercase tracking-widest mb-2">Open Issues & Bugs</p>
            <div className="flex items-end gap-2 h-16">
              <div className="w-8 bg-[#BC4749] h-10 rounded-t" />
              <div className="w-8 bg-[#0071a1] h-6 rounded-t" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GitHubCommandCenter;
