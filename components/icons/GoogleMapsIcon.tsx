import React from 'react';

export const GoogleMapsIcon = ({ className = "w-4 h-4", ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 512 512" className={className} {...props} fill="currentColor">
    <path d="M256 0C156.748 0 76 80.748 76 180c0 33.534 9.289 66.26 26.869 94.652l142.885 230.257A15 15 0 0 0 258.498 512h.005a14.995 14.995 0 0 0 12.743-7.091l142.885-230.257C431.711 246.26 441 213.534 441 180 441 80.748 360.252 0 256 0zm0 270c-49.626 0-90-40.374-90-90s40.374-90 90-90 90 40.374 90 90-40.374 90-90 90z"/>
  </svg>
);
