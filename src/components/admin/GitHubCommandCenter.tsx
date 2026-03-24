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
  updated_at: string;
}

const GitHubCommandCenter: React.FC = () => {
  const [action, setAction] = useState<GitHubAction | null>(null);
  const [loading, setLoading] = useState(true);

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    return `${diffInMinutes}m ago`;
  };

  const fetchAction = async () => {
    try {
      const res = await fetch(`${window.location.origin}/api/github/actions`);
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
    <div className="w-full mt-6 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden transition-all duration-500 bg-[#f0f8ff]/10 backdrop-blur-md shadow-xl border border-white/20">
      <div className="relative z-10 flex flex-col gap-12">
        
        {/* Title */}
        <h2 className="text-[#00426a] text-2xl md:text-[28px] font-black tracking-wide uppercase text-center" style={{ fontFamily: 'Georgia, serif' }}>
          GITHUB COMMAND CENTER
        </h2>
        
        {/* Main Metrics Row */}
        <div className="flex flex-col md:flex-row items-stretch justify-center gap-4 md:gap-6">
          
          {/* Issues Card */}
          <div className="flex flex-col gap-3 min-w-[220px]">
            <span className="text-center text-[10px] font-black text-[#00426a]/60 uppercase tracking-[0.2em]">תקלות / משימות</span>
            <div className="bg-white/20 backdrop-blur-md rounded-[2rem] p-6 md:px-8 flex items-center justify-between h-full shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-white/30">
              <Bug size={28} className="text-[#BC4749]" strokeWidth={2.5} />
              <div className="text-right flex flex-col items-end">
                <span className="text-[11px] font-black text-[#00426a] uppercase tracking-widest mb-1">ISSUES</span>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-[#0071a1]">1</span>
                  <span className="text-3xl font-black text-[#BC4749]">2</span>
                </div>
              </div>
            </div>
          </div>

          {/* PRs Card */}
          <div className="flex flex-col gap-3 min-w-[220px]">
            <span className="text-center text-[10px] font-black text-[#00426a]/60 uppercase tracking-[0.2em]">בקשות למיזוג</span>
            <div className="bg-white/20 backdrop-blur-md rounded-[2rem] p-6 md:px-8 flex items-center justify-between h-full shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-white/30">
              <GitPullRequest size={28} className="text-[#0071a1]" strokeWidth={2.5} />
              <div className="text-right flex flex-col items-end">
                <span className="text-[11px] font-black text-[#00426a] uppercase tracking-widest mb-1">PRS</span>
                <span className="text-3xl font-black text-[#00426a]">4</span>
              </div>
            </div>
          </div>

          {/* Pipeline Card */}
          <div className="flex flex-col gap-3 flex-1 min-w-[320px]">
            <span className="text-center text-[10px] font-black text-[#00426a]/60 uppercase tracking-[0.2em]">צינור העבודה</span>
            <div className="bg-white/20 backdrop-blur-md rounded-[2rem] p-6 md:px-8 flex items-center justify-between h-full shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-white/30">
              <div className={`px-5 py-2 rounded-full text-sm font-bold ${isGitHubActive ? 'bg-[#0071a1]/10 text-[#0071a1]' : isGitHubFailure ? 'bg-[#BC4749]/10 text-[#BC4749]' : 'bg-[#10b981]/10 text-[#10b981]'}`}>
                {isGitHubActive ? 'Deploying' : isGitHubFailure ? 'Failed' : 'Stable'}
              </div>
              <div className="flex items-center gap-5">
                <span className="text-[11px] font-black text-[#00426a] uppercase tracking-widest">PIPELINE</span>
                <div className="flex items-center gap-3">
                  <Github size={24} className="text-[#0071a1]" strokeWidth={2} />
                  <Activity size={24} className="text-[#00426a]" strokeWidth={2} />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Row: Recent Commit */}
        <div className="flex items-center justify-start gap-2 px-4 pt-2">
          <span className="text-[15px] font-medium text-[#0071a1]" style={{ fontFamily: 'Georgia, serif' }}>
            {action ? getTimeAgo(action.updated_at) : '...'}
          </span>
          <span className="text-[15px] font-medium text-[#00426a]" style={{ fontFamily: 'Georgia, serif' }}>
            {action?.head_commit.message || 'Loading...'}
          </span>
        </div>

      </div>
    </div>
  );
};

export default GitHubCommandCenter;
