/** Public app origin for auth redirects and invite links */
export function getAppUrl() {
  const explicit = (process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/+$/, "");
  if (explicit) return explicit;

  const vercel = (process.env.VERCEL_URL || "").trim().replace(/\/+$/, "");
  if (vercel) {
    return vercel.startsWith("http") ? vercel : `https://${vercel}`;
  }

  return "http://localhost:3000";
}
