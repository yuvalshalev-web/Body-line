import React, { useEffect, useRef, useState } from 'react';

const RadarChart: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeMonths, setActiveMonths] = useState<Set<string>>(new Set(["October", "November", "December", "January", "February", "March"]));

  const data: Record<string, Record<string, number>> = {
    October: { "Technique": 4, "Power": 5, "Stamina": 4, "Mental": 5, "Flexibility": 4, "Balance": 5 },
    November: { "Technique": 5, "Power": 5, "Stamina": 5, "Mental": 6, "Flexibility": 5, "Balance": 6 },
    December: { "Technique": 7, "Power": 5, "Stamina": 3, "Mental": 4, "Flexibility": 6, "Balance": 8 },
    January: { "Technique": 6, "Power": 7, "Stamina": 4, "Mental": 5, "Flexibility": 4, "Balance": 6 },
    February: { "Technique": 8, "Power": 6, "Stamina": 5, "Mental": 3, "Flexibility": 5, "Balance": 7 },
    March: { "Technique": 9, "Power": 4, "Stamina": 6, "Mental": 6, "Flexibility": 3, "Balance": 5 },
  };

  const colors: Record<string, { stroke: string, fill: string }> = {
    October:  { stroke: "#9b59b6", fill: "rgba(155,89,182,0.2)" },
    November:  { stroke: "#e91e63", fill: "rgba(233,30,99,0.2)" },
    December: { stroke: "#e74c3c", fill: "rgba(231,76,60,0.2)" },
    January:  { stroke: "#3498db", fill: "rgba(52,152,219,0.2)" },
    February: { stroke: "#2ecc71", fill: "rgba(46,204,113,0.2)" },
    March:    { stroke: "#f39c12", fill: "rgba(243,156,18,0.2)" },
  };

  const axes = Object.keys(data.March);
  const MAX = 10, CX = 260, CY = 260, R = 190, LEVELS = 10;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    svg.innerHTML = "";
    const svgNS = "http://www.w3.org/2000/svg";

    function angle(i: number) { return (Math.PI * 2 * i) / axes.length - Math.PI / 2; }
    function polar(a: number, r: number) { return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) }; }

    function el(tag: string, attrs: Record<string, string | number>, parent: SVGElement | null = svg) {
      const e = document.createElementNS(svgNS, tag);
      for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
      if (parent) parent.appendChild(e);
      return e;
    }

    for (let li = 0; li < LEVELS; li++) {
      const frac = (li + 1) / LEVELS;
      const pts = axes.map((_, i) => polar(angle(i), frac * R));
      el("polygon", {
        points: pts.map(p => `${p.x},${p.y}`).join(" "),
        fill: "none",
        stroke: "rgba(0,0,0,0.15)",
        "stroke-width": li === LEVELS - 1 ? 1.5 : 0.8
      });
    }

    axes.forEach((_, i) => {
      const end = polar(angle(i), R);
      el("line", { x1: CX, y1: CY, x2: end.x, y2: end.y, stroke: "rgba(0,0,0,0.2)", "stroke-width": 1 });
    });

    [2, 4, 6, 8, 10].forEach(val => {
      const pos = polar(angle(0), (val / MAX) * R);
      const t = el("text", { x: pos.x + 5, y: pos.y + 4, fill: "rgba(0,0,0,0.4)", "font-size": 9 });
      t.textContent = String(val);
    });

    // Add Glassmorphism Defs
    const defs = el("defs", {}, svg);
    const lens = el("radialGradient", { id: "radar-glass-lens", cx: "50%", cy: "50%", r: "60%", fx: "30%", fy: "30%" }, defs);
    el("stop", { offset: "0%", "stop-color": "white", "stop-opacity": "0.4" }, lens);
    el("stop", { offset: "70%", "stop-color": "white", "stop-opacity": "0.05" }, lens);
    el("stop", { offset: "100%", "stop-color": "white", "stop-opacity": "0.0" }, lens);

    const shine = el("linearGradient", { id: "radar-glass-shine", x1: "0%", y1: "0%", x2: "100%", y2: "100%" }, defs);
    el("stop", { offset: "0%", "stop-color": "white", "stop-opacity": "0.3" }, shine);
    el("stop", { offset: "50%", "stop-color": "white", "stop-opacity": "0.05" }, shine);
    el("stop", { offset: "100%", "stop-color": "white", "stop-opacity": "0.0" }, shine);

    Object.entries(data).forEach(([month, values]) => {
      if (!activeMonths.has(month)) return;
      const pts = axes.map((ax, i) => polar(angle(i), (values[ax] ?? 0) / MAX * R));
      const pathData = pts.map((p, i) => `${i===0?"M":"L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ") + " Z";
      
      const path = el("path", {
        d: pathData,
        fill: colors[month].fill,
        stroke: colors[month].stroke,
        "stroke-width": 1.8,
        "stroke-linejoin": "round",
        style: "cursor:pointer;transition:all 0.2s;"
      });

      pts.forEach(p => {
        el("circle", { cx: p.x, cy: p.y, r: 3.5, fill: colors[month].stroke, stroke: "#1a1a2e", "stroke-width": 1.5 });
      });
    });

    // Add Glassmorphism Overlays
    el("circle", { cx: CX, cy: CY, r: R + 20, fill: "url(#radar-glass-lens)", opacity: 0.8, "pointer-events": "none" });
    el("circle", { cx: CX, cy: CY, r: R + 20, fill: "url(#radar-glass-shine)", opacity: 0.6, "pointer-events": "none" });
    el("circle", { cx: CX, cy: CY, r: R + 20, fill: "none", stroke: "white", "stroke-width": 2, "stroke-opacity": 0.3, "pointer-events": "none" });

    axes.forEach((axis, i) => {
      const a = angle(i);
      const pos = polar(a, R + 14);
      let anchor = "middle";
      if (pos.x < CX - 20) anchor = "end";
      if (pos.x > CX + 20) anchor = "start";
      const t = el("text", {
        x: pos.x, y: pos.y + 4,
        "text-anchor": anchor,
        fill: "#333333",
        "font-size": 12.5
      });
      t.textContent = axis;
    });
  }, [activeMonths]);

  const toggleMonth = (month: string) => {
    setActiveMonths(prev => {
      const next = new Set(prev);
      next.has(month) ? next.delete(month) : next.add(month);
      return next;
    });
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-white">
      <div className="chart-wrap glass-panel !rounded-3xl p-1 transform transition-transform hover:scale-105" style={{ perspective: '1200px', transform: 'rotateX(10deg) rotateY(-2deg)' }}>
        <svg ref={svgRef} id="radar" width="468" height="468" viewBox="0 0 520 520"></svg>
      </div>

      <div className="flex gap-1.5 mt-0 flex-wrap justify-center">
        {Object.keys(data).map(month => (
          <button
            key={month}
            onClick={() => toggleMonth(month)}
            className="px-2.5 py-0.5 rounded-full text-[12px] font-serif transition-all border-2"
            style={{ 
              background: activeMonths.has(month) ? colors[month].fill : 'rgba(255,255,255,0.04)',
              borderColor: activeMonths.has(month) ? colors[month].stroke : 'rgba(255,255,255,0.15)',
              color: activeMonths.has(month) ? colors[month].stroke : '#777'
            }}
          >
            {month}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RadarChart;
