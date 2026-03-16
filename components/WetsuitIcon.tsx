import React from 'react';

type WetsuitType = 'full' | 'shorty' | 'lycra';

interface WetsuitIconProps {
  type: WetsuitType;
  className?: string;
}

export const WetsuitIcon: React.FC<WetsuitIconProps> = ({ type, className = "w-20 h-20" }) => {
  const Seams = () => {
    let chestY = 65;
    let verticalMaxY = 105;
    
    if (type === 'full') {
      chestY = 65;
      verticalMaxY = 80;
      return (
        <>
          {/* Collar */}
          <path d="M 85 20 Q 100 28 115 20" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round"/>
          {/* Chest Seam */}
          <path d={`M 39 ${chestY} Q 80 ${chestY - 20} 121 ${chestY} L 131 ${chestY - 10} Q 146 ${chestY - 10} 161 ${chestY + 5}`} fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          {/* Left vertical seam */}
          <path d={`M 65 56 Q 60 75 65 ${verticalMaxY}`} fill="none" stroke="white" strokeWidth="4" strokeLinecap="round"/>
          {/* Right vertical seam */}
          <path d={`M 125 62 Q 130 80 125 ${verticalMaxY}`} fill="none" stroke="white" strokeWidth="4" strokeLinecap="round"/>
        </>
      );
    } else if (type === 'shorty') {
      chestY = 60;
      verticalMaxY = 85;
      return (
        <>
          {/* Collar */}
          <path d="M 85 20 Q 100 28 115 20" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round"/>
          {/* Chest Seam */}
          <path d={`M 39 ${chestY} Q 80 ${chestY - 20} 121 ${chestY} L 131 ${chestY - 10} Q 146 ${chestY - 10} 161 ${chestY + 5}`} fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          {/* Left vertical seam */}
          <path d={`M 65 56 Q 60 75 65 ${verticalMaxY}`} fill="none" stroke="white" strokeWidth="4" strokeLinecap="round"/>
          {/* Right vertical seam */}
          <path d={`M 125 62 Q 130 80 125 ${verticalMaxY}`} fill="none" stroke="white" strokeWidth="4" strokeLinecap="round"/>
        </>
      );
    } else if (type === 'lycra') {
      chestY = 55;
      verticalMaxY = 82;
    }

    return (
      <>
        {/* Collar */}
        <path d="M 85 20 Q 100 28 115 20" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round"/>
        {/* Chest Seam */}
        <path d={`M 34 ${chestY} Q 80 ${chestY - 20} 125 ${chestY} L 135 ${chestY - 10} Q 150 ${chestY - 10} 166 ${chestY + 5}`} fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        {/* Left vertical seam */}
        <path d={`M 60 56 Q 55 75 60 ${verticalMaxY}`} fill="none" stroke="white" strokeWidth="4" strokeLinecap="round"/>
        {/* Right vertical seam */}
        <path d={`M 130 62 Q 135 80 130 ${verticalMaxY}`} fill="none" stroke="white" strokeWidth="4" strokeLinecap="round"/>
      </>
    );
  };

  const renderIcon = () => {
    switch (type) {
      case 'full':
        return (
          <>
            <path d="M 85 20 Q 100 24 115 20 Q 135 20 155 40 Q 165 85 160 115 L 148 115 Q 143 100 140 75 Q 135 90 140 120 Q 140 150 130 180 L 110 180 Q 105 150 100 130 Q 100 120 100 130 Q 95 150 90 180 L 70 180 Q 60 150 60 120 Q 65 90 60 75 Q 57 100 52 115 L 40 115 Q 35 85 45 40 Q 65 20 85 20 Z" fill="currentColor"/>
            <Seams />
          </>
        );
      case 'shorty':
        return (
          <>
            <path d="M 85 20 Q 100 24 115 20 Q 135 20 155 40 Q 160 55 160 80 L 145 80 Q 143 70 140 65 Q 135 90 140 115 Q 140 130 130 145 L 110 145 Q 105 130 100 115 Q 100 105 100 115 Q 95 130 90 145 L 70 145 Q 60 130 60 115 Q 65 90 60 65 Q 57 70 55 80 L 40 80 Q 40 55 45 40 Q 65 20 85 20 Z" fill="currentColor"/>
            <Seams />
          </>
        );
      case 'lycra':
        return (
          <>
            <path d="M 85 20 Q 100 24 115 20 Q 140 20 160 40 Q 168 60 165 97 L 150 97 Q 147 80 145 75 Q 142 85 140 97 L 60 97 Q 58 85 55 75 Q 53 80 50 97 L 35 97 Q 32 60 40 40 Q 60 20 85 20 Z" fill="currentColor"/>
            <Seams />
          </>
        );
    }
  };

  const getTransform = () => {
    if (type === 'full') {
      // Shorter body (approx 25% shorter than 1.3 -> 0.975) and narrower (0.65)
      return "translate(100, 20) scale(0.65, 0.95) translate(-100, -20)";
    }
    return "translate(100, 20) scale(0.7, 1.3) translate(-100, -20)";
  };

  return (
    <svg viewBox="45 10 110 320" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <g transform={getTransform()}>
        {renderIcon()}
      </g>
    </svg>
  );
};
