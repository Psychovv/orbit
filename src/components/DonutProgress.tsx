import React from 'react';

interface DonutProgressProps {
  completed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
}

export const DonutProgress: React.FC<DonutProgressProps> = ({
  completed,
  total,
  size = 76,
  strokeWidth = 7
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id="donutProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent-plasma)" />
            <stop offset="60%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>

        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--line)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Animated Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#donutProgressGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          style={{
            transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        />
      </svg>

      {/* Percentage Center Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="font-title font-bold text-sm leading-none text-text">
          {percentage}%
        </span>
      </div>
    </div>
  );
};
