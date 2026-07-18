import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Completes invite / magic-link auth and sends user to change-password (or `next`). */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/change-password";
  const safeNext = next.startsWith("/") ? next : "/change-password";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=invite_link`);
}
