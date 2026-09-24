export function OrbitMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#844DFE" />
      <g transform="rotate(-28 16 16)" stroke="#fff" strokeWidth="1.7" strokeLinecap="round">
        <ellipse cx="16" cy="16" rx="11" ry="4" />
        <circle cx="16" cy="16" r="5.3" fill="#fff" stroke="none" />
        <path d="M5 16a11 4 0 0 0 22 0" />
      </g>
    </svg>
  );
}
