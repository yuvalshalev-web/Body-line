const svgToDataUri = (svg: string): string => {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
};

export const DEFAULT_SITE_ASSETS = {
  // Brand Logos
  habalZugLogo: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <defs>
        <linearGradient id="hzg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00b4d8"/>
          <stop offset="100%" stop-color="#0077b6"/>
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="90" fill="url(#hzg)" stroke="#ffffff" stroke-width="4"/>
      <path d="M40 120 Q70 60 100 120 T160 120" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>
      <path d="M50 140 Q80 90 110 140 T170 140" fill="none" stroke="#ffd166" stroke-width="6" stroke-linecap="round"/>
      <text x="100" y="75" font-family="sans-serif" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle">חבל זוג</text>
      <text x="100" y="175" font-family="sans-serif" font-size="12" font-weight="bold" fill="#e0f2fe" text-anchor="middle">SURF &amp; COMMUNITY</text>
    </svg>
  `),
  
  atalefLogo: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <defs>
        <linearGradient id="atlg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#1e293b"/>
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="90" fill="url(#atlg)" stroke="#38bdf8" stroke-width="4"/>
      <path d="M45 100 C60 70 85 90 100 65 C115 90 140 70 155 100 C135 125 115 110 100 135 C85 110 65 125 45 100 Z" fill="#38bdf8"/>
      <circle cx="100" cy="95" r="7" fill="#ffffff"/>
      <text x="100" y="165" font-family="sans-serif" font-size="15" font-weight="900" fill="#ffffff" text-anchor="middle">עמותת העטלף</text>
    </svg>
  `),
  
  reefLogo: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <defs>
        <linearGradient id="rfg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0284c7"/>
          <stop offset="100%" stop-color="#0369a1"/>
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="90" fill="url(#rfg)" stroke="#38bdf8" stroke-width="4"/>
      <path d="M50 115 C70 80 110 80 150 115 C130 140 90 140 50 115 Z" fill="#ffffff"/>
      <circle cx="100" cy="100" r="14" fill="#38bdf8"/>
      <text x="100" y="65" font-family="sans-serif" font-size="20" font-weight="900" fill="#ffffff" text-anchor="middle">REEF</text>
      <text x="100" y="170" font-family="sans-serif" font-size="13" font-weight="bold" fill="#bae6fd" text-anchor="middle">מרכז ימי</text>
    </svg>
  `),

  // Ocean Animals
  starfish: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polygon points="50,5 64,36 98,36 70,57 81,91 50,70 19,91 30,57 2,36 36,36" fill="#fb923c" stroke="#ea580c" stroke-width="3"/>
    </svg>
  `),
  penguin: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <ellipse cx="50" cy="55" rx="30" ry="40" fill="#1e293b"/>
      <ellipse cx="50" cy="60" rx="20" ry="30" fill="#ffffff"/>
      <circle cx="42" cy="35" r="4" fill="#0f172a"/>
      <circle cx="58" cy="35" r="4" fill="#0f172a"/>
      <polygon points="50,38 45,46 55,46" fill="#f97316"/>
      <ellipse cx="38" cy="92" rx="10" ry="5" fill="#f97316"/>
      <ellipse cx="62" cy="92" rx="10" ry="5" fill="#f97316"/>
    </svg>
  `),
  mantaRay: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path d="M50,15 C75,30 95,50 95,65 C80,60 65,70 50,85 C35,70 20,60 5,65 C5,50 25,30 50,15 Z" fill="#0284c7" stroke="#0369a1" stroke-width="2"/>
      <line x1="50" y1="85" x2="50" y2="98" stroke="#0284c7" stroke-width="3" stroke-linecap="round"/>
    </svg>
  `),
  shark: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path d="M10,50 C30,30 70,30 90,45 C80,42 75,35 70,25 C65,38 50,42 40,40 C30,45 20,48 10,50 Z" fill="#475569" stroke="#334155" stroke-width="2"/>
      <path d="M90,45 C85,60 65,65 40,60 C25,58 15,53 10,50 C18,52 35,55 50,52 Z" fill="#94a3b8"/>
      <polygon points="90,45 98,35 95,55" fill="#475569"/>
    </svg>
  `),
  orca: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <ellipse cx="50" cy="50" rx="42" ry="25" fill="#09090b"/>
      <path d="M45,28 C47,15 53,15 55,28 Z" fill="#09090b"/>
      <ellipse cx="65" cy="45" rx="8" ry="4" fill="#ffffff"/>
      <ellipse cx="50" cy="62" rx="25" ry="10" fill="#ffffff"/>
    </svg>
  `),
  cork: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect x="30" y="25" width="40" height="50" rx="8" fill="#d97706" stroke="#b45309" stroke-width="3"/>
      <line x1="30" y1="40" x2="70" y2="40" stroke="#92400e" stroke-width="2"/>
      <line x1="30" y1="55" x2="70" y2="55" stroke="#92400e" stroke-width="2"/>
    </svg>
  `),

  // Wetsuits
  wetsuit43: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120">
      <path d="M35,10 L65,10 L75,30 L68,60 L68,110 L52,110 L50,75 L48,110 L32,110 L32,60 L25,30 Z" fill="#1e293b" stroke="#0284c7" stroke-width="2"/>
      <text x="50" y="55" font-family="sans-serif" font-size="12" font-weight="900" fill="#38bdf8" text-anchor="middle">4/3</text>
    </svg>
  `),
  wetsuit32: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120">
      <path d="M35,10 L65,10 L75,30 L68,60 L68,110 L52,110 L50,75 L48,110 L32,110 L32,60 L25,30 Z" fill="#334155" stroke="#06b6d4" stroke-width="2"/>
      <text x="50" y="55" font-family="sans-serif" font-size="12" font-weight="900" fill="#67e8f9" text-anchor="middle">3/2</text>
    </svg>
  `),
  wetsuit22: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120">
      <path d="M35,10 L65,10 L75,30 L68,60 L68,85 L52,85 L50,65 L48,85 L32,85 L32,60 L25,30 Z" fill="#0f172a" stroke="#10b981" stroke-width="2"/>
      <text x="50" y="55" font-family="sans-serif" font-size="12" font-weight="900" fill="#34d399" text-anchor="middle">2/2</text>
    </svg>
  `),
  wetsuit22ss: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120">
      <path d="M35,10 L65,10 L72,25 L65,50 L65,80 L52,80 L50,60 L48,80 L35,80 L35,50 L28,25 Z" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
      <text x="50" y="45" font-family="sans-serif" font-size="10" font-weight="900" fill="#fbbf24" text-anchor="middle">2/2 SS</text>
    </svg>
  `),
  sunShirt: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120">
      <path d="M35,10 L65,10 L80,35 L68,40 L65,80 L35,80 L32,40 L20,35 Z" fill="#f8fafc" stroke="#0ea5e9" stroke-width="2"/>
      <text x="50" y="55" font-family="sans-serif" font-size="11" font-weight="900" fill="#0284c7" text-anchor="middle">שמש</text>
    </svg>
  `),

  // Backgrounds & Defaults
  staticHeroImage: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=1920&auto=format&fit=crop',
  loginBg: 'https://images.unsplash.com/photo-1505972186483-70ff335e0d78?q=80&w=1920&auto=format&fit=crop',
  defaultEventImage: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=1920&auto=format&fit=crop'
};
