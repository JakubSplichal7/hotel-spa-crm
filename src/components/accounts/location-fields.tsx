"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  COUNTRIES,
  getCitiesForCountry,
  withExistingOption,
} from "@/lib/locations";

export function LocationFields({
  defaultCountry = "",
  defaultCity = "",
}: {
  defaultCountry?: string | null;
  defaultCity?: string | null;
}) {
  const [country, setCountry] = useState(defaultCountry || "");
  const cities = withExistingOption(getCitiesForCountry(country), defaultCity);
  const countries = withExistingOption([...COUNTRIES], defaultCountry);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="country">Country</Label>
        <NativeSelect
          id="country"
          name="country"
          required
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
      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <NativeSelect
          id="city"
          name="city"
          required
          disabled={!country}
          defaultValue={defaultCity || ""}
          key={country}
        >
          <option value="" disabled>
            {country ? "Select city" : "Select country first"}
          </option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </NativeSelect>
      </div>
    </div>
  );
}
