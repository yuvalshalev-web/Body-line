/**
 * TODO: REFACTOR
 * The "Whiteboard" aesthetic of this component (RankRoadmap) is "Tangible" 
 * but does not strongly align with the "Surfer" (wood, horizontal signs) 
 * or "Elite Alabaster" (luxury white, glassmorphism) theme. 
 * Consider replacing the whiteboard surface with a weathered wood sign or a premium glass panel.
 */
import React, { useState, useEffect } from "react";
import { RANKS } from "../constants";
import { motion } from "motion/react";

export const RankRoadmap: React.FC<{ name: string, sessions: number, overallProgressPercent: number, noFrame?: boolean }> = ({ name, sessions, overallProgressPercent, noFrame = false }) => {
  const content = (
    <div className="relative w-full h-full rounded-sm whiteboard-surface overflow-hidden flex flex-col"
         style={{ minHeight: '500px' }}>
      
      {/* Glossy Reflection & Smudges */}
      <div className="absolute inset-0 pointer-events-none opacity-40 whiteboard-smudge z-0" />

      {/* Content */}
      <div className="relative z-10 p-6 md:p-10 flex flex-col gap-8 text-right font-dana-yad" dir="rtl" style={{ color: '#164E63', fontFamily: "'Dana Yad Alef Alef', 'DanaYad', 'DanaYadBackup', 'Amatic SC', cursive" }}>
        <h2 className="text-4xl md:text-5xl font-normal mb-2 text-center font-dana-yad" style={{ transform: 'rotate(-2deg)', fontFamily: "'Dana Yad Alef Alef', 'DanaYad', 'DanaYadBackup', 'Amatic SC', cursive" }}>
          מה הוויב שלך בליין-אפ?
        </h2>
        
        <div className="flex flex-col gap-6">
          {RANKS.map((rank, i) => {
            const isCurrent = sessions >= rank.min && (rank.max === null || sessions < rank.max);
            const textColor = isCurrent ? '#d52518' : '#9CA3AF';
            const rotation = (i % 2 === 0 ? -1 : 1) * (Math.random() * 1.5 + 0.5);
            
            return (
              <div key={rank.id} 
                   className={`flex flex-col gap-2 transition-all duration-500 ${isCurrent ? 'font-black scale-105 origin-right' : ''}`}
                   style={{ 
                     color: textColor, 
                     transform: `rotate(${rotation}deg)`,
                     opacity: isCurrent ? 1 : 0.7,
                     textShadow: isCurrent ? '0 0 1px currentColor, 0 0 2px currentColor, 0 0 3px rgba(213,37,24,0.3)' : 'none'
                   }}>
                <div className="flex items-center gap-3 justify-start">
                  {isCurrent && (
                    <motion.span 
                      className="text-2xl font-black ml-2" 
                      animate={{ 
                        color: ["#00f2fe", "#ff009f", "#00ff00", "#ffde45", "#00f2fe"],
                        textShadow: [
                          "0 0 7px #00f2fe, 0 0 10px #00f2fe, 0 0 21px #00f2fe",
                          "0 0 7px #ff009f, 0 0 10px #ff009f, 0 0 21px #ff009f",
                          "0 0 7px #00ff00, 0 0 10px #00ff00, 0 0 21px #00ff00",
                          "0 0 7px #ffde45, 0 0 10px #ffde45, 0 0 21px #ffde45",
                          "0 0 7px #00f2fe, 0 0 10px #00f2fe, 0 0 21px #00f2fe",
                        ],
                        opacity: [1, 0.6, 1, 0.8, 1]
                      }}
                      transition={{ 
                        duration: 4, 
                        repeat: Infinity, 
                        ease: "linear" 
                      }}
                      style={{ transform: 'rotate(5deg)', display: 'inline-block' }}
                    >
                      👈 אתה כאן!
                    </motion.span>
                  )}
                  <span className="text-3xl font-bold">{rank.he}</span>
                  <span className="text-xl opacity-80">({rank.min}{rank.max ? `-${rank.max}` : '+'} סשנים)</span>
                </div>
                <p className="text-xl leading-relaxed pl-4">{rank.desc}</p>
                <ul className="list-disc list-inside pr-6 text-lg opacity-90">
                  {rank.perks.map((perk, idx) => (
                    <li key={idx} style={{ transform: `rotate(${Math.random() * 1 - 0.5}deg)` }}>{perk}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (noFrame) {
    return (
      <>
        <style>{`
          .whiteboard-surface {
            background-color: #F8F9FA;
            box-shadow: inset 0 2px 10px rgba(0,0,0,0.1), inset 0 -2px 5px rgba(255,255,255,0.5);
          }
          .whiteboard-smudge {
            background-image: 
              linear-gradient(105deg, rgba(255,255,255,0) 20%, rgba(255,255,255,0.6) 35%, rgba(255,255,255,0) 50%),
              url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.02' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E");
          }
        `}</style>
        {content}
      </>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 md:p-12 relative rounded-[2.5rem] shadow-2xl bg-gradient-to-br from-[#083344] to-[#164E63]">
      <style>{`
        .whiteboard-surface {
          background-color: #F8F9FA;
          box-shadow: inset 0 2px 10px rgba(0,0,0,0.1), inset 0 -2px 5px rgba(255,255,255,0.5);
        }
        .whiteboard-smudge {
          background-image: 
            linear-gradient(105deg, rgba(255,255,255,0) 20%, rgba(255,255,255,0.6) 35%, rgba(255,255,255,0) 50%),
            url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.02' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E");
        }
        .marker-shadow {
          box-shadow: 2px 4px 6px rgba(0,0,0,0.6);
        }
        .eraser-shadow {
          box-shadow: 2px 4px 6px rgba(0,0,0,0.6);
        }
        .tray-shadow {
          box-shadow: 0 10px 15px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.8);
        }
        .frame-shadow {
          box-shadow: 
            0 25px 50px -12px rgba(0,0,0,0.7),
            inset 4px 4px 6px rgba(255,255,255,0.9),
            inset -4px -4px 8px rgba(0,0,0,0.4),
            inset 1px 1px 0px rgba(255,255,255,1),
            0 0 0 1px rgba(150,150,150,0.5);
        }
      `}</style>
      
      {/* Pulsating Alabaster Glow */}
      <div className="absolute inset-0 z-0 animate-pulse bg-[#E0F2FE] opacity-20 blur-3xl rounded-[2.5rem]" style={{ animationDuration: '4s' }} />

      {/* Whiteboard Frame */}
      <div className="relative z-10 w-full rounded-2xl frame-shadow"
           style={{
             background: '#A8A9AD',
             padding: '16px',
             backgroundImage: 'linear-gradient(145deg, #e2e3e5 0%, #c5c6c9 20%, #A8A9AD 50%, #d0d1d4 80%, #828387 100%)'
           }}>
        
        {/* Whiteboard Surface */}
        {content}

        {/* Lower Tray */}
        <div className="absolute bottom-0 left-8 right-8 h-8 bg-gradient-to-b from-[#e5e7eb] to-[#9ca3af] rounded-b-lg tray-shadow flex items-end px-12 pb-2 gap-8 z-20 transform translate-y-full">
          {/* Black Marker */}
          <div className="w-24 h-4 bg-gradient-to-b from-gray-700 via-black to-gray-900 rounded-full marker-shadow relative transform -rotate-2 translate-y-1">
            <div className="absolute right-0 top-0 bottom-0 w-4 bg-gray-600 rounded-r-full" />
            <div className="absolute left-2 top-0 bottom-0 w-1 bg-gray-500 rounded-full" />
          </div>
          {/* Blue Eraser */}
          <div className="w-20 h-6 bg-gradient-to-b from-blue-500 to-blue-800 rounded-sm eraser-shadow relative transform rotate-3">
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-800 rounded-b-sm" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-400 rounded-t-sm opacity-50" />
          </div>
        </div>
      </div>
    </div>
  );
}
