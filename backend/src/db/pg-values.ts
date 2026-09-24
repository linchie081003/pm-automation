/** Postgres rejects "" for DATE/TIMESTAMPTZ — coerce blank strings to null. */
export function pgDate(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s === "" ? null : s;
}

export function pgTimestamptz(value: unknown): string | null {
  return pgDate(value);
}
