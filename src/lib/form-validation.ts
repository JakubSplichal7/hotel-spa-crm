/** Spec for a required form field validated from FormData. */
export type RequiredField = { name: string; label: string };

export function missingRequiredFields(
  formData: FormData,
  fields: RequiredField[]
): RequiredField[] {
  return fields.filter((f) => !String(formData.get(f.name) ?? "").trim());
}

export function formatMissingFieldsMessage(missing: RequiredField[]): string {
  if (missing.length === 0) return "";
  if (missing.length === 1) return `${missing[0].label} is required.`;
  return `Please fill in: ${missing.map((m) => m.label).join(", ")}.`;
}

/** Returns an error message if any required field is empty, otherwise null. */
export function validateRequired(
  formData: FormData,
  fields: RequiredField[]
): string | null {
  const missing = missingRequiredFields(formData, fields);
  return missing.length ? formatMissingFieldsMessage(missing) : null;
}
