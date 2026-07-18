import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
} from "@/lib/supabase/env";

/**
 * Invite a user without touching the admin browser session.
 * Uses Admin REST API directly (no supabase-js auth client) so nothing
 * can write invitee tokens into cookies.
 */
export async function POST(request: Request) {
  try {
    const url = getSupabaseUrl();
    const anonKey = getSupabaseAnonKey();
    const serviceKey = getSupabaseServiceRoleKey();

    if (!serviceKey) {
      return NextResponse.json(
        {
          error:
            "SUPABASE_SERVICE_ROLE_KEY is missing. Add it in Vercel env / .env.local and redeploy.",
        },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();

    // Read-only auth check — never write Set-Cookie from this route
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // intentionally no-op
        },
      },
    });

    const {
      data: { user: adminUser },
    } = await supabase.auth.getUser();

    if (!adminUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const profileRes = await fetch(
      `${url}/rest/v1/profiles?id=eq.${adminUser.id}&select=org_id,role`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );
    const profiles = (await profileRes.json()) as Array<{
      org_id: string;
      role: string;
    }>;
    const profile = profiles?.[0];

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can invite users" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const fullName = String(body.fullName || "").trim();
    const role = String(body.role || "").trim();
    const password = String(body.password || "");

    if (!email || !fullName || !role || !password) {
      return NextResponse.json(
        { error: "Please fill in name, email, role, and temporary password." },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Temporary password must be at least 6 characters." },
        { status: 400 }
      );
    }

    if (email === (adminUser.email || "").toLowerCase()) {
      return NextResponse.json(
        { error: "You cannot invite your own email address." },
        { status: 400 }
      );
    }

    // Create auth user via Admin REST — never goes through browser/session clients
    const createRes = await fetch(`${url}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      }),
      cache: "no-store",
    });

    const created = (await createRes.json()) as {
      id?: string;
      msg?: string;
      message?: string;
      error_description?: string;
    };

    if (!createRes.ok || !created.id) {
      return NextResponse.json(
        {
          error:
            created.msg ||
            created.message ||
            created.error_description ||
            "Failed to create user",
        },
        { status: 400 }
      );
    }

    const insertRes = await fetch(`${url}/rest/v1/profiles`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        id: created.id,
        org_id: profile.org_id,
        role,
        full_name: fullName,
        email,
        must_change_password: true,
      }),
      cache: "no-store",
    });

    if (!insertRes.ok) {
      const errText = await insertRes.text();
      await fetch(`${url}/auth/v1/admin/users/${created.id}`, {
        method: "DELETE",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
        cache: "no-store",
      });
      return NextResponse.json(
        { error: errText || "Failed to create profile" },
        { status: 400 }
      );
    }

    revalidatePath("/settings");

    // Explicit: no auth cookies on this response
    const response = NextResponse.json({
      success: true,
      userId: created.id,
      email,
      adminId: adminUser.id,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Invite failed",
      },
      { status: 500 }
    );
  }
}
