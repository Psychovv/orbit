import type { NextConfig } from "next";

/**
 * CSP pragmática para Next.js App Router:
 * - 'unsafe-inline' em script/style: necessário para runtime/hydration do Next e next-themes
 * - 'unsafe-eval': só em desenvolvimento (Turbopack/React Refresh)
 */
const isDev = process.env.NODE_ENV === "development";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  // O filtro XSS antigo dos navegadores é obsoleto e pode ser explorado; o recomendado é desligá-lo e confiar na CSP.
  { key: "X-XSS-Protection", value: "0" },
  // Força HTTPS por 2 anos (só tem efeito em respostas HTTPS).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
];

const nextConfig: NextConfig = {
  headers: async () => [
    { source: "/(.*)", headers: securityHeaders },
  ],
};

export default nextConfig;
