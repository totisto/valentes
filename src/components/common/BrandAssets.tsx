import React from 'react';

/**
 * Geometric, modern athletic Lion icon for "Valentes"
 */
export const LionBadge: React.FC<{ className?: string; size?: number }> = ({ className = "w-8 h-8", size }) => {
  const sizeStyle = size ? { width: size, height: size } : undefined;
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={sizeStyle}
    >
      <defs>
        <linearGradient id="lionGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="50%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#CA8A04" />
        </linearGradient>
        <linearGradient id="blueGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>

      {/* Mane / Sunburst geometric cuts */}
      <polygon points="50,4 62,20 78,14 80,32 94,36 86,52 96,62 82,72 84,90 68,84 58,98 50,88 42,98 32,84 16,90 18,72 4,62 14,52 6,36 20,32 22,14 38,20" fill="url(#lionGold)" />
      
      {/* Inner shadow/accent */}
      <polygon points="50,14 59,26 73,22 74,36 85,40 78,52 86,60 75,68 76,80 64,76 56,86 50,78 44,86 36,76 24,80 25,68 14,60 22,52 15,40 26,36 27,22 41,26" fill="#0B192C" />

      {/* Lion Face Geometry */}
      <polygon points="50,22 68,36 62,60 50,78 38,60 32,36" fill="url(#lionGold)" />
      
      {/* Crown forehead accent */}
      <polygon points="50,22 55,32 50,30 45,32" fill="#0B192C" />

      {/* Eyes */}
      <polygon points="42,42 46,45 42,47 38,44" fill="#060D17" />
      <polygon points="58,42 62,44 58,47 54,45" fill="#060D17" />
      <circle cx="43" cy="44.5" r="1.2" fill="#FDE047" />
      <circle cx="57" cy="44.5" r="1.2" fill="#FDE047" />

      {/* Nose & Snout */}
      <polygon points="50,50 54,58 46,58" fill="#060D17" />
      <line x1="50" y1="58" x2="50" y2="65" stroke="#060D17" strokeWidth="2" strokeLinecap="round" />
      
      {/* Whiskers / Cheek lines */}
      <path d="M42 60 L32 61 M42 63 L34 66" stroke="#060D17" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M58 60 L68 61 M58 63 L66 66" stroke="#060D17" strokeWidth="1.5" strokeLinecap="round" />

      {/* Chin point */}
      <polygon points="50,66 54,72 46,72" fill="#CA8A04" />
    </svg>
  );
};

/**
 * Regal Champion Crown
 */
export const ChampionCrown: React.FC<{ className?: string; size?: number }> = ({ className = "w-6 h-6", size }) => {
  const sizeStyle = size ? { width: size, height: size } : undefined;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={sizeStyle}
    >
      <defs>
        <linearGradient id="crownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="50%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
      </defs>
      <path
        d="M2.5 19H21.5V20.5H2.5V19Z"
        fill="url(#crownGrad)"
      />
      <path
        d="M3 18L5 7L9.5 13L12 4L14.5 13L19 7L21 18H3Z"
        fill="url(#crownGrad)"
        stroke="#92400E"
        strokeWidth="0.75"
        strokeLinejoin="round"
      />
      {/* Jewels */}
      <circle cx="12" cy="4" r="1.5" fill="#FEF08A" stroke="#78350F" strokeWidth="0.5" />
      <circle cx="5" cy="7" r="1.2" fill="#FEF08A" stroke="#78350F" strokeWidth="0.5" />
      <circle cx="19" cy="7" r="1.2" fill="#FEF08A" stroke="#78350F" strokeWidth="0.5" />
      <circle cx="12" cy="14" r="1" fill="#3B82F6" />
      <circle cx="8" cy="15.5" r="0.9" fill="#EAB308" />
      <circle cx="16" cy="15.5" r="0.9" fill="#EAB308" />
    </svg>
  );
};

/**
 * Dynamic Paint Brush Accent SVG
 */
export const BrushStroke: React.FC<{ className?: string; color?: string }> = ({
  className = "w-24 h-4",
  color = "#EAB308"
}) => {
  return (
    <svg
      viewBox="0 0 200 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="none"
    >
      <path
        d="M2 14.5C24 9.5 60 7 100 8C140 9 178 5.5 198 12C175 16 135 17.5 96 16.5C57 15.5 22 18.5 2 14.5Z"
        fill={color}
        opacity="0.85"
      />
      <path
        d="M12 17C42 13 85 14 135 15C170 15.7 185 13.5 192 16"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );
};
