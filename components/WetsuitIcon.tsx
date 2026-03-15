import React from 'react';

type WetsuitType = 'full' | 'shorty' | 'lycra';

interface WetsuitIconProps {
  type: WetsuitType;
  className?: string;
}

export const WetsuitIcon: React.FC<WetsuitIconProps> = ({ type, className = "w-20 h-20" }) => {
  const Seams = () => (
    <>
      {/* Collar */}
      <path d="M 85 20 Q 100 28 115 20" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round"/>
      {/* Chest Seam */}
      <path d="M 34 65 Q 80 45 125 65 L 135 55 Q 150 55 166 70" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Left vertical seam */}
      <path d="M 60 56 Q 55 80 60 105" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round"/>
      {/* Right vertical seam */}
      <path d="M 130 62 Q 135 85 130 105" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round"/>
    </>
  );

  const renderIcon = () => {
    switch (type) {
      case 'full':
        return (
          <>
            <path d="M 85 20 Q 100 24 115 20 Q 140 20 160 40 Q 175 90 170 145 Q 170 155 162.5 155 Q 155 155 155 145 Q 150 110 145 75 Q 140 115 145 160 Q 145 200 135 235 Q 135 245 125 245 Q 115 245 115 235 Q 110 200 105 170 Q 100 155 95 170 Q 90 200 85 235 Q 85 245 75 245 Q 65 245 65 235 Q 55 200 55 160 Q 60 115 55 75 Q 50 110 45 145 Q 45 155 37.5 155 Q 30 155 30 145 Q 25 90 40 40 Q 60 20 85 20 Z" fill="currentColor"/>
            <Seams />
          </>
        );
      case 'shorty':
        return (
          <>
            <path d="M 85 20 Q 100 24 115 20 Q 140 20 160 40 Q 166 60 165 95 Q 165 102 157.5 102 Q 150 102 150 95 Q 148 85 145 75 Q 140 115 145 160 Q 144 168 142 185 Q 142 192 128.5 192 Q 115 192 115 185 Q 112 175 105 170 Q 100 155 95 170 Q 88 175 85 185 Q 85 192 71.5 192 Q 58 192 58 185 Q 56 168 55 160 Q 60 115 55 75 Q 52 85 50 95 Q 50 102 42.5 102 Q 35 102 35 95 Q 34 60 40 40 Q 60 20 85 20 Z" fill="currentColor"/>
            <Seams />
          </>
        );
      case 'lycra':
        return (
          <>
            <path d="M 85 20 Q 100 24 115 20 Q 140 20 160 40 Q 168 70 165 105 Q 165 112 157.5 112 Q 150 112 150 105 Q 147 90 145 75 Q 142 115 140 150 Q 140 158 100 158 Q 60 158 60 150 Q 58 115 55 75 Q 53 90 50 105 Q 50 112 42.5 112 Q 35 112 35 105 Q 32 70 40 40 Q 60 20 85 20 Z" fill="currentColor"/>
            <Seams />
          </>
        );
    }
  };

  return (
    <svg viewBox="15 10 170 245" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {renderIcon()}
    </svg>
  );
};
