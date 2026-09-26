import React from 'react';

interface BiometricFingerprintProps {
  className?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}

/**
 * Authentic oval biometric loop-arch fingerprint texture based on the reference artwork.
 * Rendered as clean, delicate vector paths with authentic ridge breaks and rounded caps.
 */
export const BiometricFingerprint: React.FC<BiometricFingerprintProps> = ({
  className = '',
  strokeWidth = 2.5,
  style = {}
}) => {
  return (
    <svg
      viewBox="0 0 200 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Innermost Core Loop 1 */}
      <path
        d="M94 200 V122 C94 116 106 116 106 122 V155 M106 166 V200"
        strokeWidth={strokeWidth}
      />
      {/* Central ridge within core */}
      <path
        d="M100 132 V198"
        strokeWidth={strokeWidth}
      />

      {/* Loop 2 */}
      <path
        d="M87 205 V116 C87 106 113 106 113 116 V145 M113 158 V205"
        strokeWidth={strokeWidth}
      />

      {/* Loop 3 */}
      <path
        d="M80 210 V140 M80 130 V110 C80 96 120 96 120 110 V172 M120 185 V210"
        strokeWidth={strokeWidth}
      />

      {/* Loop 4 */}
      <path
        d="M73 213 V168 M73 156 V104 C73 87 127 87 127 104 V138 M127 150 V213"
        strokeWidth={strokeWidth}
      />

      {/* Loop 5 */}
      <path
        d="M66 215 V128 M66 115 V98 C66 78 134 78 134 98 V162 M134 175 V215"
        strokeWidth={strokeWidth}
      />

      {/* Loop 6 */}
      <path
        d="M59 215 V178 M59 164 V92 C59 69 141 69 141 92 V122 M141 135 V215"
        strokeWidth={strokeWidth}
      />

      {/* Loop 7 */}
      <path
        d="M52 212 V148 M52 135 V86 C52 60 148 60 148 86 V152 M148 165 V212"
        strokeWidth={strokeWidth}
      />

      {/* Loop 8 */}
      <path
        d="M45 208 V118 M45 105 V80 C45 51 155 51 155 80 V132 M155 145 V208"
        strokeWidth={strokeWidth}
      />

      {/* Loop 9 */}
      <path
        d="M39 200 V160 M39 148 V74 C39 42 161 42 161 74 V115 M161 128 V200"
        strokeWidth={strokeWidth}
      />

      {/* Loop 10 */}
      <path
        d="M34 188 V132 M34 118 V68 C34 34 166 34 166 68 V142 M166 155 V188"
        strokeWidth={strokeWidth}
      />

      {/* Loop 11 - Outer Arch */}
      <path
        d="M29 175 V144 M29 130 V64 C29 26 171 26 171 64 V98 M171 112 V175"
        strokeWidth={strokeWidth}
      />

      {/* Outermost Arch Top Crown */}
      <path
        d="M26 150 V105 M26 90 C26 50 48 20 100 20 C152 20 174 50 174 90 V120 M174 135 V160"
        strokeWidth={strokeWidth}
      />

      {/* Extra Top Arc Accent */}
      <path
        d="M45 32 C62 14 138 14 155 32"
        strokeWidth={strokeWidth}
      />

      {/* Peripheral flank ridges at left */}
      <path
        d="M23 138 V112 M23 100 C23 78 35 52 56 36"
        strokeWidth={strokeWidth}
      />
      {/* Peripheral flank ridges at right */}
      <path
        d="M177 138 V115 M177 98 C177 75 165 50 144 36"
        strokeWidth={strokeWidth}
      />

      {/* Base contour bridges */}
      <path
        d="M62 216 C78 221 122 221 138 216"
        strokeWidth={strokeWidth}
      />
      <path
        d="M78 224 C90 227 110 227 122 224"
        strokeWidth={strokeWidth}
      />
    </svg>
  );
};

export default BiometricFingerprint;
