import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Bot, Github, Cloud, ArrowRight, CheckCircle2, Activity, AlertCircle, RefreshCw } from 'lucide-react';

const WorkflowVisualizer: React.FC = () => {
  const [githubStatus, setGithubStatus] = useState<'synced' | 'building' | 'error'>('synced');
  const [vercelStatus, setVercelStatus] = useState<'ready' | 'building' | 'error'>('ready');
  const [isPolling, setIsPolling] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchStatuses = async () => {
      console.log('Fetching statuses...');
      try {
        // Fetch GitHub Status
        console.log('Fetching GitHub Status from /api/github/actions');
        const ghRes = await fetch(`${window.location.origin}/api/github/actions`);
        console.log('GitHub Status response:', ghRes.status, ghRes.ok);
        if (ghRes.ok) {
          const ghData = await ghRes.json();
          const action = ghData.action;
          if (action) {
            if (action.status === 'in_progress' || action.status === 'queued') {
              setGithubStatus('building');
            } else if (action.conclusion === 'failure') {
              setGithubStatus('error');
            } else {
              setGithubStatus('synced');
            }
          }
        }

        // Fetch Vercel Status
        const vercelRes = await fetch('/api/vercel/status');
        if (vercelRes.ok) {
          const vercelData = await vercelRes.json();
          const deployment = vercelData.latestDeployment;
          if (deployment) {
            if (deployment.readyState === 'READY') {
              setVercelStatus('ready');
            } else if (deployment.readyState === 'ERROR') {
              setVercelStatus('error');
            } else {
              setVercelStatus('building');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching workflow statuses:', error);
      }
    };

    if (isPolling) {
      fetchStatuses();
      interval = setInterval(fetchStatuses, 15000); // Poll every 15 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPolling]);

  return (
    <div className="w-full mt-6 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden transition-all duration-500 bg-[#f0f8ff]/10 backdrop-blur-md shadow-xl border border-white/20">
      <div className="relative z-10 flex flex-col gap-12">
        
        {/* Title */}
        <h2 className="text-[#00426a] text-2xl md:text-[28px] font-black tracking-wide uppercase text-center" style={{ fontFamily: 'Georgia, serif' }}>
          DEPLOYMENT WORKFLOW
        </h2>
        
        {/* Workflow Diagram */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8 relative py-8">
          
          {/* Animated Connection Lines (Desktop) */}
          <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-1 bg-slate-200 -translate-y-1/2 z-0 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-transparent via-[#006699] to-transparent w-1/3"
              animate={{ x: ['-100%', '300%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </div>

          {/* Node 1: AI Studio */}
          <div className="relative z-10 flex flex-col items-center gap-4 w-full md:w-1/3">
            <div className="w-24 h-24 rounded-[2rem] bg-white/20 backdrop-blur-md shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-white/30 flex items-center justify-center relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/20 to-purple-50/20 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity" />
              <Bot size={40} className="text-[#0071a1] relative z-10" strokeWidth={2} />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#10B981]/20 rounded-full border-2 border-white/30 flex items-center justify-center">
                <CheckCircle2 size={12} className="text-[#10B981]" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-[#00426a] font-black text-lg uppercase tracking-widest">AI Studio</h3>
              <p className="text-[11px] font-black text-[#0071a1] uppercase tracking-widest mt-1">Code Generation</p>
              <div className="mt-3 inline-flex items-center gap-1.5 bg-[#10B981]/20 px-2 py-0.5 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                <span className="text-[8px] font-black text-[#10B981] uppercase tracking-widest">Connected</span>
              </div>
            </div>
          </div>

          {/* Arrow (Mobile) */}
          <div className="md:hidden text-slate-300">
            <ArrowRight size={24} className="rotate-90" />
          </div>

          {/* Node 2: GitHub */}
          <div className="relative z-10 flex flex-col items-center gap-4 w-full md:w-1/3">
            <div className="w-24 h-24 rounded-[2rem] bg-white/20 backdrop-blur-md shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-white/30 flex items-center justify-center relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50/20 to-gray-100/20 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity" />
              <Github size={40} className="text-[#00426a] relative z-10" strokeWidth={2} />
              <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 border-white/30 flex items-center justify-center ${
                githubStatus === 'synced' ? 'bg-[#10B981]/20' : 
                githubStatus === 'building' ? 'bg-[#0071a1]/20' : 'bg-[#c94a4a]/20'
              }`}>
                {githubStatus === 'synced' && <CheckCircle2 size={12} className="text-[#10B981]" />}
                {githubStatus === 'building' && <RefreshCw size={12} className="text-[#0071a1] animate-spin" />}
                {githubStatus === 'error' && <AlertCircle size={12} className="text-[#c94a4a]" />}
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-[#00426a] font-black text-lg uppercase tracking-widest">GitHub</h3>
              <p className="text-[11px] font-black text-[#0071a1] uppercase tracking-widest mt-1">Version Control</p>
              <div className={`mt-3 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${
                githubStatus === 'synced' ? 'bg-[#10B981]/20' : 
                githubStatus === 'building' ? 'bg-[#0071a1]/10' : 'bg-[#c94a4a]/10'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                  githubStatus === 'synced' ? 'bg-[#10B981]' : 
                  githubStatus === 'building' ? 'bg-[#0071a1]' : 'bg-[#c94a4a]'
                }`} />
                <span className={`text-[8px] font-black uppercase tracking-widest ${
                  githubStatus === 'synced' ? 'text-[#10B981]' : 
                  githubStatus === 'building' ? 'text-[#0071a1]' : 'text-[#c94a4a]'
                }`}>
                  {githubStatus === 'synced' ? 'Synced' : 
                   githubStatus === 'building' ? 'Building' : 'Failed'}
                </span>
              </div>
            </div>
          </div>

          {/* Arrow (Mobile) */}
          <div className="md:hidden text-slate-300">
            <ArrowRight size={24} className="rotate-90" />
          </div>

          {/* Node 3: Vercel */}
          <div className="relative z-10 flex flex-col items-center gap-4 w-full md:w-1/3">
            <div className="w-24 h-24 rounded-[2rem] bg-white/20 backdrop-blur-md shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-white/30 flex items-center justify-center relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/20 to-black/20 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity" />
              <svg width="40" height="40" viewBox="0 0 76 65" fill="currentColor" className="text-[#00426a] group-hover:text-white transition-colors relative z-10">
                <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
              </svg>
              <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 border-white/30 flex items-center justify-center ${
                vercelStatus === 'ready' ? 'bg-[#10B981]/20' : 
                vercelStatus === 'building' ? 'bg-[#0071a1]/20' : 'bg-[#c94a4a]/20'
              }`}>
                {vercelStatus === 'ready' && <CheckCircle2 size={12} className="text-[#10B981]" />}
                {vercelStatus === 'building' && <Activity size={12} className="text-[#0071a1] animate-pulse" />}
                {vercelStatus === 'error' && <AlertCircle size={12} className="text-[#c94a4a]" />}
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-[#00426a] font-black text-lg uppercase tracking-widest">Vercel</h3>
              <p className="text-[11px] font-black text-[#0071a1] uppercase tracking-widest mt-1">Production Hosting</p>
              <div className={`mt-3 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${
                vercelStatus === 'ready' ? 'bg-[#10B981]/20' : 
                vercelStatus === 'building' ? 'bg-[#0071a1]/10' : 'bg-[#c94a4a]/10'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                  vercelStatus === 'ready' ? 'bg-[#10B981]' : 
                  vercelStatus === 'building' ? 'bg-[#0071a1]' : 'bg-[#c94a4a]'
                }`} />
                <span className={`text-[8px] font-black uppercase tracking-widest ${
                  vercelStatus === 'ready' ? 'text-[#10B981]' : 
                  vercelStatus === 'building' ? 'text-[#0071a1]' : 'text-[#c94a4a]'
                }`}>
                  {vercelStatus === 'ready' ? 'Online' : 
                   vercelStatus === 'building' ? 'Deploying' : 'Failed'}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default WorkflowVisualizer;
