/**
 * Sanitizes and derives the public display name from the full private name.
 * Rule: Show only the approved public display name (normally the first name).
 * The public display name is strictly validated and derived server-side.
 */
export function derivePublicDisplayName(
  fullName: string,
  confirmedDisplayName?: string
): string {
  const cleanedFull = fullName.trim().replace(/[\u0000-\u001F\u007F-\u009F<>]/g, '');
  const nameParts = cleanedFull.split(/\s+/).filter(Boolean);

  if (nameParts.length === 0) {
    return 'Visitor';
  }

  const defaultFirstName = nameParts[0];

  if (!confirmedDisplayName) {
    return defaultFirstName.slice(0, 60);
  }

  const cleanedConfirmed = confirmedDisplayName
    .trim()
    .replace(/[\u0000-\u001F\u007F-\u009F<>]/g, '');

  if (!cleanedConfirmed) {
    return defaultFirstName.slice(0, 60);
  }

  // Validate that the confirmed name is related to the full name:
  // e.g. matches first name, first name + initial, or is one of the name parts
  const lowerConfirmed = cleanedConfirmed.toLowerCase();
  const lowerFull = cleanedFull.toLowerCase();

  const isSubstring = lowerFull.includes(lowerConfirmed);
  const matchesPart = nameParts.some(
    (p) => p.toLowerCase() === lowerConfirmed || lowerConfirmed.startsWith(p.toLowerCase())
  );

  if (isSubstring || matchesPart) {
    return cleanedConfirmed.slice(0, 60);
  }

  // If client confirmed name is unrelated or suspicious, fallback safely to first name
  return defaultFirstName.slice(0, 60);
}
