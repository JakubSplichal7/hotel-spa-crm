import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            const safeOptions = {
              ...options,
              path:
                options?.path && options.path.startsWith("/")
                  ? options.path
                  : "/",
            };
            cookieStore.set(name, value, safeOptions);
          });
        } catch {
          // Server Component — ignore
        }
      },
    },
  });
}
