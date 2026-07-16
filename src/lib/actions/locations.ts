"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { DEFAULT_LOCATIONS } from "@/lib/locations";

export async function ensureDefaultLocations() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { count } = await supabase
    .from("locations")
    .select("*", { count: "exact", head: true })
    .eq("org_id", profile.org_id);

  if (count && count > 0) return { seeded: false };

  const rows = DEFAULT_LOCATIONS.map((loc) => ({
    org_id: profile.org_id,
    country: loc.country,
    city: loc.city,
  }));

  // Insert in chunks to avoid payload limits
  const chunkSize = 200;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from("locations").insert(chunk);
    if (error) return { error: error.message };
  }

  return { seeded: true };
}

export async function getLocations() {
  const profile = await requireProfile();
  const supabase = await createClient();

  await ensureDefaultLocations();

  const { data, error } = await supabase
    .from("locations")
    .select("id, country, city")
    .eq("org_id", profile.org_id)
    .order("country")
    .order("city");

  if (error) return { error: error.message, locations: [] as { id: string; country: string; city: string }[] };
  return { locations: data || [] };
}

export async function addLocation(country: string, city: string) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const cleanCountry = country.trim();
  const cleanCity = city.trim();

  if (!cleanCountry || !cleanCity) {
    return { error: "Country and city are required." };
  }

  const { data, error } = await supabase
    .from("locations")
    .insert({
      org_id: profile.org_id,
      country: cleanCountry,
      city: cleanCity,
    })
    .select("id, country, city")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "This location already exists." };
    }
    return { error: error.message };
  }

  revalidatePath("/accounts");
  return { location: data };
}
