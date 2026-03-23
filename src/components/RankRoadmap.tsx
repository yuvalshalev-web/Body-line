import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RANKS } from "../constants";

const getRank = (s: number) => [...RANKS].reverse().find(r => s >= r.min) || RANKS[0];

/* ── Confetti ── */
function SparkleCanvas({ color, trigger }: { color: string, trigger: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!trigger) return;
    const c = ref.current; if (!c) return;
    const W = c.offsetWidth, H = c.offsetHeight;
    c.width = W * devicePixelRatio; c.height = H * devicePixelRatio;
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    const ps = Array.from({length:40},(_,i) => ({
      x: W*(0.1+Math.random()*0.8), y: H*0.5,
      vx:(Math.random()-0.5)*6, vy:-(Math.random()*7+1.5),
      size:Math.random()*4+1.5, alpha:1,
      rot:Math.random()*Math.PI*2, rotV:(Math.random()-0.5)*0.28,
      shape:["star","circle","rect"][i%3],
      hue:[color,"#FFD700","#fff",color+"bb"][i%4],
    }));
    let raf: number;
    const star=(ctx: CanvasRenderingContext2D, r: number)=>{ctx.beginPath();for(let i=0;i<5;i++){const a=(i*4*Math.PI)/5-Math.PI/2;i===0?ctx.moveTo(r*Math.cos(a),r*Math.sin(a)):ctx.lineTo(r*Math.cos(a),r*Math.sin(a))}ctx.closePath();ctx.fill();};
    const draw=()=>{
      ctx.clearRect(0,0,W,H); let alive=false;
      ps.forEach(p=>{
        p.x+=p.vx;p.y+=p.vy;p.vy+=0.2;p.alpha-=0.017;p.rot+=p.rotV;
        if(p.alpha<=0)return; alive=true;
        ctx.save();ctx.globalAlpha=Math.max(p.alpha,0);ctx.fillStyle=p.hue as string;
        ctx.translate(p.x,p.y);ctx.rotate(p.rot);
        if(p.shape==="star")star(ctx,p.size);
        else if(p.shape==="circle"){ctx.beginPath();ctx.arc(0,0,p.size,0,Math.PI*2);ctx.fill();}
        else ctx.fillRect(-p.size,-p.size*0.4,p.size*2,p.size*0.8);
        ctx.restore();
      });
      if(alive)raf=requestAnimationFrame(draw);
    };
    raf=requestAnimationFrame(draw);
    return ()=>cancelAnimationFrame(raf);
  },[trigger, color]);
  return <canvas ref={ref} style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:20}}/>;
}

/* ── Burning bar ── */
function BurningBar({pct, accent}: {pct: number, accent: string}) {
  const [w,setW]=useState(0), [flame,setFlame]=useState(false), [lbl,setLbl]=useState(false);
  useEffect(()=>{
    const t1=setTimeout(()=>setW(pct),350);
    const t2=setTimeout(()=>setFlame(true),500);
    const t3=setTimeout(()=>setLbl(true),2100);
    return()=>[t1,t2,t3].forEach(clearTimeout);
  },[pct]);
  return (
    <div style={{position:"relative",height:6,background:"rgba(0,0,0,0.07)",borderRadius:99,marginTop:1, direction: "ltr"}}>
      <div style={{position:"absolute",top:0,left:0,height:"100%",width:`${w}%`,background:accent,borderRadius:99,transition:"width 1.7s cubic-bezier(0.22,1,0.36,1)",boxShadow:`0 0 10px ${accent}77`,overflow:"visible"}}>
        {flame && <div style={{position:"absolute",right:-7,top:"50%",transform:"translateY(-50%)",width:14,height:14,borderRadius:"50%",background:"#fff",boxShadow:`0 0 0 3px ${accent},0 0 14px 5px ${accent}cc,0 0 28px 10px ${accent}44`,animation:"flamePulse 0.65s ease-in-out infinite alternate"}}/>}
      </div>
      {lbl && <div style={{position:"absolute",left:`${Math.min(w,92)}%`,top:-20,transform:"translateX(-50%)",fontSize:10,fontWeight:800,color:accent,fontFamily:"'Inter', sans-serif",whiteSpace:"nowrap",animation:"fadeUp 0.3s both"}}>{Math.round(pct)}%</div>}
    </div>
  );
}

/* ── Trophy ── */
function TrophyIcon({size,color,opacity=1,glow,animDelay=0}: {size: number, color: string, opacity?: number, glow: boolean, animDelay?: number}) {
  return (
    <div style={{opacity,display:"flex",filter:glow?`drop-shadow(0 0 7px ${color}ee)`:"none",animation:glow?`trophyPop 0.55s ${animDelay}s cubic-bezier(0.34,1.7,0.64,1) both`:"none"}}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M6 3H4a1 1 0 00-1 1v2a4 4 0 004 4h.5M18 3h2a1 1 0 011 1v2a4 4 0 01-4 4h-.5" stroke={color} strokeWidth="1.7" strokeLinecap="round"/>
        <path d="M7.5 3h9a.5.5 0 01.5.5V10a5 5 0 01-10 0V3.5a.5.5 0 01.5-.5z" fill={color} fillOpacity="0.18" stroke={color} strokeWidth="1.7"/>
        <line x1="12" y1="15" x2="12" y2="19" stroke={color} strokeWidth="1.7" strokeLinecap="round"/>
        <line x1="9" y1="21" x2="15" y2="21" stroke={color} strokeWidth="1.9" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

function TrophyCluster({count,accent,earned,glow}: {count: number, accent: string, earned: boolean, glow: boolean}) {
  const sz=[0,30,23,19,17,16][count]||16;
  const rows={1:[[0]],2:[[0,1]],3:[[0,1,2]],4:[[0,1],[2,3]],5:[[0,1],[2,3,4]]}[count]||[[0]];
  return (
    <div style={{flexShrink:0,width:50,display:"flex",flexDirection:"column",gap:3,alignItems:"flex-start"}}>
      {rows.map((row,ri)=>(
        <div key={ri} style={{display:"flex",gap:3}}>
          {row.map((i: number)=><TrophyIcon key={i} size={sz} color={earned?accent:"#cacaca"} opacity={earned?1:0.4} glow={glow} animDelay={i*0.09}/>)}
        </div>
      ))}
    </div>
  );
}

/* ── Row ── */
function RankRow({rank, sessions, index}: {rank: any, sessions: number, index: number}) {
  const isDone  = sessions>=(rank.max??Infinity);
  const isActive= sessions>=rank.min && !isDone;
  const isLocked= sessions<rank.min;
  const pct     = rank.max ? Math.min((sessions-rank.min)/(rank.max-rank.min),1)*100 : 100;
  const toUnlock= rank.min-sessions;
  const nextName= RANKS.find(r=>r.level===rank.level+1)?.he;

  const [open,setOpen]=useState(false);
  const [sparked,setSparked]=useState(false);

  useEffect(()=>{
    if(isActive){
      setOpen(true);
      const t=setTimeout(()=>setSparked(true),900+index*100);
      return()=>clearTimeout(t);
    }
  },[isActive, index]);

  return (
    <div onClick={()=>setOpen(o=>!o)} style={{
        borderBottom:"1px solid rgba(0,0,0,0.05)",
        background:isActive?`#e0f2fe`:"#FFFFFF",
        opacity:isLocked?0.6:1,
        cursor:"pointer",
        transition:"background 0.3s, box-shadow 0.3s",
        position:"relative",
        overflow:"visible",
        direction: "rtl",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        borderRadius: "16px",
        marginBottom: "16px"
    }}>
      {isActive && <div style={{position:"absolute",top:0,right:0,bottom:0,width:4,background:`#f59e0b`, borderRadius: "16px 0 0 16px"}}/>}
      {isActive && <SparkleCanvas color={rank.accent} trigger={sparked}/>}

      <div style={{display:"flex",alignItems:"center",gap:16,padding:"16px", direction: "rtl"}}>
        <TrophyCluster count={rank.level} accent={rank.accent} earned={!isLocked} glow={isActive||isDone}/>

        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:isActive?8:0}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:isActive?18:16,fontWeight:isActive?700:isDone?600:500,color:"#0c4a6e",fontFamily:"'Inter', sans-serif",transition:"all 0.3s"}}>
                {rank.he}
              </span>
              {isActive && <span style={{fontSize:10,letterSpacing:1,textTransform:"uppercase",color:"#FFFFFF",background:`#f59e0b`,padding:"4px 8px",borderRadius:8,fontWeight:700,fontFamily:"'Inter', sans-serif"}}>עכשיו</span>}
            </div>
            <span style={{fontSize:12,color:"#0c4a6e",fontFamily:"'Inter', sans-serif", fontWeight: 600}}>
              {rank.min}{rank.max?`–${rank.max}`:"+"} סשנים
            </span>
          </div>
          {isActive && <BurningBar pct={pct} accent={rank.accent}/>}
          {isLocked && <div style={{fontSize:12,color:"#0c4a6e",fontFamily:"'Inter', sans-serif",marginTop:4, fontWeight: 500}}>🔒 עוד {toUnlock} סשנים</div>}
        </div>

        <div style={{fontSize:12,color:"#0c4a6e",transform:open?"rotate(180deg)":"none",transition:"transform 0.25s",flexShrink:0}}>▾</div>
      </div>

      <div style={{maxHeight:open?320:0,overflow:"hidden",transition:"max-height 0.45s cubic-bezier(0.22,1,0.36,1)"}}>
        <div style={{padding:"0 16px 16px 16px"}}>
          <p style={{fontSize:14,color:"rgba(0,0,0,0.7)",lineHeight:1.5,marginBottom:16,fontFamily:"'Inter', sans-serif",fontWeight:400}}>{rank.desc}</p>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {rank.perks.map((p: string,i: number)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:6,height:6,borderRadius:"50%",flexShrink:0,background:isDone||isActive?rank.accent:"rgba(0,0,0,0.2)"}}/>
                <span style={{fontSize:14,fontFamily:"'Inter', sans-serif",color:isDone||isActive?"rgba(0,0,0,0.9)":"rgba(0,0,0,0.5)",fontWeight:isDone||isActive?500:400}}>{p}</span>
                {isDone && <span style={{fontSize:12,color:rank.accent,marginRight:"auto",opacity:0.8}}>✓</span>}
              </div>
            ))}
          </div>
          {isActive && nextName && (
            <div style={{marginTop:16,padding:"12px",background:`rgba(45, 212, 191, 0.1)`,border:`1px solid rgba(45, 212, 191, 0.3)`,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:13,color:"rgba(0,0,0,0.7)",fontFamily:"'Inter', sans-serif"}}>{Math.round(pct)}% מהדרך ל{nextName}</span>
              <span style={{fontSize:14,fontWeight:700,color:rank.accent,fontFamily:"'Inter', sans-serif"}}>{rank.max?rank.max-sessions:0} סשנים נותרו</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const RankRoadmap: React.FC<{ name: string, sessions: number, overallProgressPercent: number }> = ({ name, sessions, overallProgressPercent }) => {
  const rank = getRank(sessions);
  const [count,setCount]=useState(0);

  useEffect(()=>{
    let t0: number | null = null; const dur=1100; const target=sessions;
    const tick = (ts: number) => {
      if(!t0)t0=ts;
      const p=Math.min((ts-t0)/dur,1);
      const e=p===1?1:1-Math.pow(2,-10*p)*Math.cos((p*10-0.75)*(2*Math.PI)/3);
      setCount(Math.round(target*Math.max(e,0)));
      if(p<1)requestAnimationFrame(tick);
    };
    const id=setTimeout(()=>requestAnimationFrame(tick),250);
    return()=>clearTimeout(id);
  },[sessions]);

  return (
        <div style={{
        width: "100%",
        maxWidth: 430,
        padding: "32px 16px",
        background: "#F0F9FF", // Light blue background
        position: "relative",
        borderRadius: "24px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.05)"
      }}>
        {/* Micro-grain Texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,300;0,400;0,500;0,600;0,700;0,900;1,300&family=Instrument+Serif:ital@1&display=swap');
        @keyframes fadeUp    {from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes trophyPop {0%{opacity:0;transform:scale(0.25) translateY(8px) rotate(-18deg)}70%{transform:scale(1.22) translateY(-3px) rotate(5deg)}100%{opacity:1;transform:scale(1) translateY(0) rotate(0)}}
        @keyframes badgePop  {from{opacity:0;transform:scale(0.5)}to{opacity:1;transform:scale(1)}}
        @keyframes flamePulse{from{transform:translateY(-50%) scale(0.82);opacity:0.75}to{transform:translateY(-50%) scale(1.18);opacity:1}}
        @keyframes countBounce{0%{transform:scale(1)}35%{transform:scale(1.25)}60%{transform:scale(0.93)}80%{transform:scale(1.07)}100%{transform:scale(1)}}
      `}</style>


          {/* Header */}
          <div style={{padding:"0 8px",marginBottom:32,animation:"fadeUp 0.5s both", direction: "rtl"}}>
            <div style={{fontSize:12,letterSpacing:1,color:"#0369a1",textTransform:"uppercase",marginBottom:8, display: "flex", justifyContent: "space-between", fontFamily: "'Inter', sans-serif"}}>
              <span>{name}</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:16}}>
              <div style={{fontFamily:"'Inter', sans-serif",fontSize:20,fontWeight:700,color:"#0c4a6e", whiteSpace: 'nowrap'}}>הגעת – ניצחת. כל השאר בונוס</div>
              <div style={{display:"flex",alignItems:"baseline",gap:4,animation:"countBounce 0.75s 1.4s cubic-bezier(0.34,1.56,0.64,1) both"}}>
                <span style={{fontSize:24,fontWeight:800,color:"#f59e0b",lineHeight:1,letterSpacing:"-1px"}}>{count}</span>
                <span style={{fontSize:12,color:"#0369a1",letterSpacing:1,textTransform:"uppercase", fontFamily: "'Inter', sans-serif"}}>סשנים</span>
              </div>
            </div>
            <div style={{marginTop:12,position:"relative", direction: "ltr"}}>
              <div style={{height:8,background:"rgba(0,0,0,0.05)",borderRadius:99,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${overallProgressPercent}%`,background:"#2dd4bf",borderRadius:99,transition:"width 1.9s cubic-bezier(0.22,1,0.36,1)"}}/>
              </div>
              {[...RANKS.map(r => r.min)].filter(m => m > 0 && m < 35).map(s => (
                <div key={s} style={{position:"absolute",top:-2,left:`${(s/35)*100}%`,transform:"translateX(-50%)",width:2,height:12,background:"rgba(0,0,0,0.1)"}}/>
              ))}
            </div>
          </div>

          {/* Card */}
            {/* Grit Overlay */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
            {/* Background Accent */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#0ea5e9]/10 rounded-full blur-3xl -z-10" />
            
            <div className="w-full">
              {RANKS.map((r,i)=><RankRow key={r.id} rank={r} sessions={sessions} index={i}/>)}
            </div>

          {/* Footer */}
          <div style={{marginTop:32,textAlign:"center",fontSize:14,color:"rgba(0,0,0,0.6)",letterSpacing:0.2,animation:"fadeUp 0.5s 0.4s both", direction: "rtl", fontFamily: "'Inter', sans-serif"}}>
            {rank.max ? `עוד ${rank.max-sessions} סשנים לדרגה הבאה` : "הגעת לדרגת האלוף 👑"}
          </div>
      </div>
  );
}
