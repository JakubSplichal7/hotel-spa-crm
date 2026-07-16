import { NextResponse } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

export async function GET() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const normalized = getSupabaseUrl();
  const anon = getSupabaseAnonKey();

  let pathname = "";
  try {
    pathname = new URL(raw.trim().replace(/^["']|["']$/g, "")).pathname;
  } catch {
    pathname = "PARSE_ERROR";
  }

  const checks = {
    hasUrl: Boolean(raw),
    rawLength: raw.length,
    normalized,
    pathname,
    urlLooksValid: /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(normalized),
    hasAnonKey: anon.length > 20,
    anonKeyStartsWithEyJ: anon.startsWith("eyJ"),
  };

  let authHealth: string = "not_checked";
  if (checks.urlLooksValid) {
    try {
      const res = await fetch(`${normalized}/auth/v1/health`, {
        headers: { apikey: anon },
        cache: "no-store",
      });
      authHealth = `${res.status}`;
    } catch (e) {
      authHealth = e instanceof Error ? e.message : "fetch_failed";
    }
  }

  return NextResponse.json({
    ok: checks.urlLooksValid && checks.hasAnonKey,
    checks,
    authHealth,
  });
}
