import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, {
            ...options,
            path: options?.path?.startsWith("/") ? options.path : "/",
          })
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isChangePassword = pathname.startsWith("/change-password");
  const isPublicPath =
    isAuthPage || pathname === "/" || pathname.startsWith("/api/");
  const isServerAction = request.headers.has("next-action");

  // Not logged in → only protect app pages
  if (!user && !isPublicPath && !isChangePassword && !isServerAction) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (!user && isChangePassword && !isServerAction) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, must_change_password")
      .eq("id", user.id)
      .maybeSingle();

    // Logged in but no org/profile yet → keep them on signup (never bounce to dashboard)
    if (!profile) {
      if (!isAuthPage && !pathname.startsWith("/api/") && !isServerAction) {
        const url = request.nextUrl.clone();
        url.pathname = "/signup";
        return NextResponse.redirect(url);
      }
      return supabaseResponse;
    }

    const mustChange = Boolean(profile.must_change_password);

    // Invited users must set a new password before using the CRM
    if (
      mustChange &&
      !isChangePassword &&
      !pathname.startsWith("/api/") &&
      !isServerAction
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/change-password";
      return NextResponse.redirect(url);
    }

    // Fully set up user on login/signup → go to dashboard (GET only)
    // If they still must change password, send them there instead
    if (isAuthPage && !isServerAction && request.method === "GET") {
      const url = request.nextUrl.clone();
      url.pathname = mustChange ? "/change-password" : "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
