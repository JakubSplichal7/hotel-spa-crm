import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const safeOptions = {
                ...options,
                path: options?.path && options.path.startsWith("/") ? options.path : "/",
              };
              cookieStore.set(name, value, safeOptions);
            });
          } catch {
            // Server Component — ignore
          }
        },
      },
    }
  );
}
