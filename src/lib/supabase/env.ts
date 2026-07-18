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

/** Strip quotes / Bearer / accidental paste-duplicates from a JWT env value. */
function normalizeJwtEnv(raw: string) {
  let key = raw.trim().replace(/^["']|["']$/g, "").trim();
  if (key.toLowerCase().startsWith("bearer ")) {
    key = key.slice(7).trim();
  }
  // Accidental paste of the same key multiple times (spaces/newlines)
  const parts = key.split(/[\s,;]+/).filter(Boolean);
  const jwt = parts.find((p) => p.split(".").length === 3) || parts[0] || "";
  return jwt;
}

export function getSupabaseAnonKey() {
  return normalizeJwtEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "");
}

export function getSupabaseServiceRoleKey() {
  return normalizeJwtEnv(process.env.SUPABASE_SERVICE_ROLE_KEY || "");
}
