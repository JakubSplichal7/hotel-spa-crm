import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orgName = String(body.orgName || "").trim();
    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim();

    if (!orgName || !fullName || !email) {
      return NextResponse.json(
        { error: "Please fill in all fields." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error:
            "You are not signed in after signup. Disable email confirmation in Supabase, then try again with a new email.",
        },
        { status: 401 }
      );
    }

    const { error: rpcError } = await supabase.rpc(
      "create_organization_with_admin",
      {
        org_name: orgName,
        admin_full_name: fullName,
        admin_email: email,
      }
    );

    if (!rpcError) {
      return NextResponse.json({ success: true });
    }

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({ name: orgName })
      .select("id")
      .single();

    if (orgError) {
      return NextResponse.json(
        {
          error: `Could not create organization (${orgError.message}). Run 002_signup_rpc.sql in Supabase. RPC: ${rpcError.message}`,
        },
        { status: 400 }
      );
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,
      org_id: org.id,
      role: "admin",
      full_name: fullName,
      email,
    });

    if (profileError) {
      return NextResponse.json(
        { error: `Could not create profile: ${profileError.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error ? `Server error: ${e.message}` : "Server error",
      },
      { status: 500 }
    );
  }
}
