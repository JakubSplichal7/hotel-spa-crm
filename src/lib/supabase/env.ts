/** Normalize Supabase project URL from env (trim quotes, whitespace, trailing slash/path). */
export function getSupabaseUrl() {
  let url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();

  // Remove wrapping quotes from Vercel paste mistakes
  if (
    (url.startsWith('"') && url.endsWith('"')) ||
    (url.startsWith("'") && url.endsWith("'"))
  ) {
    url = url.slice(1, -1).trim();
  }

  // If someone pasted a REST/Auth path, keep only origin
  try {
    const parsed = new URL(url);
    if (parsed.hostname.endsWith(".supabase.co")) {
      return `${parsed.protocol}//${parsed.hostname}`;
    }
  } catch {
    // fall through
  }

  return url.replace(/\/+$/, "");
}

export function getSupabaseAnonKey() {
  let key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim();
  }
  return key;
}
