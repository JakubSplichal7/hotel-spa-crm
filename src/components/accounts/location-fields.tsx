"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { addLocation, getLocations } from "@/lib/actions/locations";
import { Plus } from "lucide-react";

type Loc = { id: string; country: string; city: string };

export function LocationFields({
  defaultCountry = "",
  defaultCity = "",
}: {
  defaultCountry?: string | null;
  defaultCity?: string | null;
}) {
  const [locations, setLocations] = useState<Loc[]>([]);
  const [country, setCountry] = useState(defaultCountry || "");
  const [city, setCity] = useState(defaultCity || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function refreshLocations(selectCountry?: string, selectCity?: string) {
    const result = await getLocations();
    if (result.error) {
      setError(result.error);
      return;
    }
    setLocations(result.locations);
    if (selectCountry) setCountry(selectCountry);
    if (selectCity) setCity(selectCity);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const result = await getLocations();
      if (cancelled) return;
      if (result.error) setError(result.error);
      else setLocations(result.locations);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const countries = useMemo(() => {
    const set = new Set(locations.map((l) => l.country));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [locations]);

  const cities = useMemo(() => {
    return locations
      .filter((l) => l.country === country)
      .map((l) => l.city)
      .sort((a, b) => a.localeCompare(b));
  }, [locations, country]);

  // If saved default country/city is no longer in the catalog, clear it
  useEffect(() => {
    if (!loading && country && !countries.includes(country)) {
      setCountry("");
      setCity("");
    }
  }, [loading, countries, country]);

  useEffect(() => {
    if (!loading && city && country && !cities.includes(city)) {
      setCity("");
    }
  }, [loading, cities, city, country]);

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
          {error}
          {error.includes("locations") || error.toLowerCase().includes("relation")
            ? " — run supabase/migrations/004_locations.sql in Supabase SQL Editor."
            : null}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <NativeSelect
            id="country"
            name="country"
            required
            disabled={loading || pending}
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              setCity("");
            }}
          >
            <option value="" disabled>
              {loading ? "Loading..." : "Select country"}
            </option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <NativeSelect
            id="city"
            name="city"
            required
            disabled={loading || pending || !country}
            value={city}
            onChange={(e) => setCity(e.target.value)}
          >
            <option value="" disabled>
              {country ? "Select city" : "Select country first"}
            </option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      <AddLocationDialog
        countries={countries}
        currentCountry={country}
        onAdded={(newCountry, newCity) => {
          startTransition(async () => {
            await refreshLocations(newCountry, newCity);
          });
        }}
      />
    </div>
  );
}

function AddLocationDialog({
  countries,
  currentCountry,
  onAdded,
}: {
  countries: string[];
  currentCountry: string;
  onAdded: (country: string, city: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [country, setCountry] = useState(currentCountry || "");
  const [newCountry, setNewCountry] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setMode(currentCountry ? "existing" : "new");
      setCountry(currentCountry || "");
      setNewCountry("");
      setCity("");
      setError(null);
    }
  }, [open, currentCountry]);

  async function handleAdd() {
    setLoading(true);
    setError(null);
    const countryValue = mode === "new" ? newCountry : country;
    const result = await addLocation(countryValue, city);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onAdded(countryValue.trim(), city.trim());
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add new location
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add location to your list</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label>Country</Label>
            <NativeSelect
              value={mode}
              onChange={(e) => setMode(e.target.value as "existing" | "new")}
            >
              <option value="existing">Use existing country</option>
              <option value="new">Add new country</option>
            </NativeSelect>
          </div>
          {mode === "existing" ? (
            <div className="space-y-2">
              <Label htmlFor="add-country">Country</Label>
              <NativeSelect
                id="add-country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                <option value="" disabled>
                  Select country
                </option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </NativeSelect>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="new-country">New country name</Label>
              <Input
                id="new-country"
                value={newCountry}
                onChange={(e) => setNewCountry(e.target.value)}
                placeholder="e.g. Montenegro"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="new-city">City name</Label>
            <Input
              id="new-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Budva"
            />
          </div>
          <Button
            type="button"
            className="w-full"
            disabled={loading}
            onClick={handleAdd}
          >
            {loading ? "Adding..." : "Add to list"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
