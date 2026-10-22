/** Marca compacta do Nubank, no lugar do texto "importado do Nubank". */
export function NubankIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label="Nubank">
      <rect width="24" height="24" rx="7" fill="#820AD1" />
      <text
        x="12"
        y="16.5"
        textAnchor="middle"
        fill="white"
        fontSize="11"
        fontWeight="700"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        nu
      </text>
    </svg>
  );
}
