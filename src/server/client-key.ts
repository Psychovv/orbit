export function clientKeyFromHeaders(headerStore: Headers): string {
  const forwarded = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headerStore.get("x-real-ip") || "local";
}

export function clientKey(req: Request): string {
  return clientKeyFromHeaders(req.headers);
}
