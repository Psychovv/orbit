import React from 'react';

interface QuasarLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  animate?: boolean;
}

export const QuasarLogo: React.FC<QuasarLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  animate = true
}) => {
  const pixelSizes = {
    sm: 24,
    md: 32,
    lg: 44,
    xl: 60
  };

  const px = pixelSizes[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div
        className="relative flex items-center justify-center flex-shrink-0"
        style={{ width: px, height: px }}
      >
        <svg
          viewBox="0 0 100 100"
          width={px}
          height={px}
          className={`transition-transform duration-500 ease-out hover:scale-105 ${animate ? 'quasar-svg' : ''}`}
        >
          <defs>
            <linearGradient id="orbitQuasarGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#c084fc" />
              <stop offset="50%" stop-color="#8b5cf6" />
              <stop offset="100%" stop-color="#38bdf8" />
            </linearGradient>

            <linearGradient id="jetBeam" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#38bdf8" stop-opacity="0" />
              <stop offset="25%" stop-color="#c084fc" stop-opacity="0.9" />
              <stop offset="50%" stop-color="#ffffff" stop-opacity="1" />
              <stop offset="75%" stop-color="#c084fc" stop-opacity="0.9" />
              <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0" />
            </linearGradient>

            <radialGradient id="quasarSingularity" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#ffffff" />
              <stop offset="40%" stop-color="#e9d5ff" />
              <stop offset="70%" stop-color="#a855f7" />
              <stop offset="100%" stop-color="#6366f1" stop-opacity="0.2" />
            </radialGradient>

            <filter id="quasarBloom" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Relativistic Jets shooting out perpendicular */}
          <line
            x1="50"
            y1="6"
            x2="50"
            y2="94"
            stroke="url(#jetBeam)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="50" cy="10" r="1.5" fill="#38bdf8" opacity="0.8" />
          <circle cx="50" cy="90" r="1.5" fill="#8b5cf6" opacity="0.8" />

          {/* Outer Orbital Accretion Disk (Tilted 25 deg) */}
          <ellipse
            cx="50"
            cy="50"
            rx="40"
            ry="14"
            fill="none"
            stroke="url(#orbitQuasarGlow)"
            strokeWidth="2.5"
            transform="rotate(-25 50 50)"
            filter="url(#quasarBloom)"
            opacity="0.95"
          />

          {/* Dotted orbital event ring */}
          <ellipse
            cx="50"
            cy="50"
            rx="30"
            ry="10"
            fill="none"
            stroke="#e0e7ff"
            strokeWidth="1.2"
            strokeDasharray="6 6"
            transform="rotate(-25 50 50)"
            opacity="0.8"
            className="quasar-orbital-dash"
          />

          {/* Inner intense accretion boundary */}
          <ellipse
            cx="50"
            cy="50"
            rx="20"
            ry="6.5"
            fill="none"
            stroke="#d8b4fe"
            strokeWidth="1.5"
            transform="rotate(-25 50 50)"
            opacity="0.75"
          />

          {/* Luminous Core / Quasar Singularity */}
          <circle
            cx="50"
            cy="50"
            r="11"
            fill="url(#quasarSingularity)"
            filter="url(#quasarBloom)"
          />
          <circle cx="50" cy="50" r="4.5" fill="#ffffff" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="font-title font-bold tracking-wider uppercase text-lg leading-none quasar-brand-text">
            Orbit
          </span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--text-faint)] leading-tight">
            Personal OS
          </span>
        </div>
      )}
    </div>
  );
};
