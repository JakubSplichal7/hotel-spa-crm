import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  const checks = {
    hasUrl: Boolean(url),
    urlLooksValid: /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url),
    urlHost: (() => {
      try {
        return new URL(url).host;
      } catch {
        return "INVALID_URL";
      }
    })(),
    hasAnonKey: anon.length > 20,
    anonKeyStartsWithEyJ: anon.startsWith("eyJ"),
  };

  let authHealth: string = "not_checked";
  if (checks.urlLooksValid) {
    try {
      const res = await fetch(`${url.replace(/\/$/, "")}/auth/v1/health`, {
        headers: { apikey: anon },
        cache: "no-store",
      });
      authHealth = `${res.status}`;
    } catch (e) {
      authHealth = e instanceof Error ? e.message : "fetch_failed";
    }
  }

  return NextResponse.json({ ok: checks.urlLooksValid && checks.hasAnonKey, checks, authHealth });
}
