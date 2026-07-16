"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const fullName = (formData.get("fullName") as string)?.trim();
  const orgName = (formData.get("orgName") as string)?.trim();

  if (!email || !password || !fullName || !orgName) {
    return { error: "Please fill in all fields." };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  if (!supabaseUrl.includes("supabase.co")) {
    return {
      error:
        "Supabase URL is not configured correctly in Vercel. It must look like https://xxxxx.supabase.co (no extra path).",
    };
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: "Failed to create user. Check Supabase Auth settings." };
  }

  if (!authData.session) {
    return {
      error:
        "Account was created, but you are not signed in yet. In Supabase go to Authentication → Configuration (or Providers → Email) and disable email confirmation. Then try signing in, or sign up with a new email.",
    };
  }

  const { error: rpcError } = await supabase.rpc(
    "create_organization_with_admin",
    {
      org_name: orgName,
      admin_full_name: fullName,
      admin_email: email,
    }
  );

  if (rpcError) {
    // Fallback if migration 002 is not applied yet
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({ name: orgName })
      .select("id")
      .single();

    if (orgError) {
      return {
        error: `Could not create organization: ${orgError.message}. Open Supabase SQL Editor and run the file supabase/migrations/002_signup_rpc.sql`,
      };
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      org_id: org.id,
      role: "admin",
      full_name: fullName,
      email,
    });

    if (profileError) {
      return {
        error: `Could not create profile: ${profileError.message}. Run supabase/migrations/002_signup_rpc.sql in Supabase SQL Editor.`,
      };
    }
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function inviteUser(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { error: "Only admins can invite users" };
  }

  const email = formData.get("email") as string;
  const fullName = formData.get("fullName") as string;
  const role = formData.get("role") as string;
  const password = formData.get("password") as string;

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) return { error: authError.message };
  if (!authData.user) return { error: "Failed to create user" };

  const { error: profileError } = await supabase.from("profiles").insert({
    id: authData.user.id,
    org_id: profile.org_id,
    role,
    full_name: fullName,
    email,
  });

  if (profileError) return { error: profileError.message };

  revalidatePath("/settings");
  return { success: true };
}

export async function updateOrgName(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { error: "Only admins can update organization" };
  }

  const name = formData.get("name") as string;

  const { error } = await supabase
    .from("organizations")
    .update({ name })
    .eq("id", profile.org_id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: true };
}

export async function updateUserRole(userId: string, role: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { error: "Only admins can update roles" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId)
    .eq("org_id", profile.org_id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: true };
}
