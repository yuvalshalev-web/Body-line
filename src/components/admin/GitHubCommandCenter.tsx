import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Github, Activity, GitPullRequest, Bug } from 'lucide-react';

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
    <div className="w-full mt-6 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden transition-all duration-500 bg-[#f4f6f8] shadow-sm border border-slate-100/50">
      <div className="relative z-10 flex flex-col gap-12">
        
        {/* Title */}
        <h2 className="text-[#003366] text-2xl md:text-[28px] font-black tracking-wide uppercase text-center" style={{ fontFamily: 'Georgia, serif' }}>
          GITHUB COMMAND CENTER
        </h2>
        
        {/* Main Metrics Row */}
        <div className="flex flex-col md:flex-row items-stretch justify-center gap-4 md:gap-6">
          
          {/* Issues Card */}
          <div className="bg-[#fcfcfd] rounded-[2rem] p-6 md:px-8 flex items-center justify-between min-w-[220px] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <Bug size={28} className="text-[#c94a4a]" strokeWidth={2.5} />
            <div className="text-right flex flex-col items-end">
              <span className="text-[11px] font-black text-[#003366] uppercase tracking-widest mb-1">ISSUES</span>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-[#006699]">1</span>
                <span className="text-3xl font-black text-[#c94a4a]">2</span>
              </div>
            </div>
          </div>

          {/* PRs Card */}
          <div className="bg-[#fcfcfd] rounded-[2rem] p-6 md:px-8 flex items-center justify-between min-w-[220px] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <GitPullRequest size={28} className="text-[#006699]" strokeWidth={2.5} />
            <div className="text-right flex flex-col items-end">
              <span className="text-[11px] font-black text-[#003366] uppercase tracking-widest mb-1">PRS</span>
              <span className="text-3xl font-black text-[#003366]">4</span>
            </div>
          </div>

          {/* Pipeline Card */}
          <div className="bg-[#fcfcfd] rounded-[2rem] p-6 md:px-8 flex items-center justify-between flex-1 min-w-[320px] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className={`px-5 py-2 rounded-full text-sm font-bold ${isGitHubActive ? 'bg-[#006699]/10 text-[#006699]' : isGitHubFailure ? 'bg-[#c94a4a]/10 text-[#c94a4a]' : 'bg-[#7cfc00]/20 text-[#7cfc00]'}`}>
              {isGitHubActive ? 'Deploying' : isGitHubFailure ? 'Failed' : 'Stable'}
            </div>
            <div className="flex items-center gap-5">
              <span className="text-[11px] font-black text-[#003366] uppercase tracking-widest">PIPELINE</span>
              <Github size={24} className="text-[#006699]" strokeWidth={2} />
              <Activity size={24} className="text-[#003366]" strokeWidth={2} />
            </div>
          </div>

        </div>

        {/* Bottom Row: Recent Commit */}
        <div className="flex items-center justify-between px-4 pt-2">
          <span className="text-sm font-bold text-[#006699]">
            20m ago
          </span>
          <span className="text-[15px] font-medium text-[#003366]" style={{ fontFamily: 'Georgia, serif' }}>
            Implement real-time quota monitoring
          </span>
        </div>

      </div>
    </div>
  );
};

export default GitHubCommandCenter;
