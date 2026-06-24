// Shared input validation/sanitisation for names and Ghana phone numbers.

// ── Full name ──────────────────────────────────────────────────────────────
// Allow letters (incl. accented), spaces, hyphens, apostrophes and periods.
const NAME_ALLOWED = /[^\p{L}\s'.-]/gu;

/** Strip characters that can never appear in a name (digits, symbols) as the user types. */
export function sanitizeNameInput(value: string): string {
  return value.replace(NAME_ALLOWED, "").replace(/\s{2,}/g, " ");
}

/** A valid full name: letters only, at least two name parts (first + last). */
export function isValidName(value: string): boolean {
  const cleaned = value.trim();
  if (cleaned.length < 2 || cleaned.length > 60) return false;
  if (NAME_ALLOWED.test(cleaned)) return false;           // contains a disallowed char
  if (!/\p{L}/u.test(cleaned)) return false;              // must contain a letter
  const parts = cleaned.split(/\s+/).filter((p) => p.replace(/['.-]/g, "").length >= 1);
  return parts.length >= 2;                               // first + last name
}

export function nameError(value: string): string | null {
  const cleaned = value.trim();
  if (!cleaned) return "Please enter your full name.";
  if (/\d/.test(cleaned)) return "Name cannot contain numbers.";
  if (NAME_ALLOWED.test(cleaned)) return "Name can only contain letters.";
  if (!isValidName(cleaned)) return "Please enter your first and last name.";
  return null;
}

// ── Ghana phone ──────────────────────────────────────────────────────────────
/** Keep only digits, a leading +, and spaces as the user types. */
export function sanitizePhoneInput(value: string): string {
  let v = value.replace(/[^\d+\s]/g, "");
  // only one leading +
  v = v.replace(/(?!^)\+/g, "");
  return v;
}

/** Valid Ghana mobile: 0XXXXXXXXX (10 digits) or +233XXXXXXXXX / 233XXXXXXXXX. */
export function isValidGhanaPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (/^0\d{9}$/.test(digits)) return true;          // 0244123456
  if (/^233\d{9}$/.test(digits)) return true;        // 233244123456 (+233…)
  return false;
}

export function phoneError(value: string, label = "phone number"): string | null {
  const cleaned = value.trim();
  if (!cleaned) return `Please enter a ${label}.`;
  if (/[a-zA-Z]/.test(cleaned)) return `A ${label} cannot contain letters.`;
  if (!isValidGhanaPhone(cleaned)) return `Please enter a valid Ghana ${label} (e.g. 0244 123 456).`;
  return null;
}
