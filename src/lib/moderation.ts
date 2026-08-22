/**
 * Content Moderation utility to validate listing title and description.
 * Blocks explicit/18+ content and inappropriate sexual solicitation.
 */

// List of explicit sexual terms, adult solicitation, and inappropriate 18+ keywords.
// Word boundaries (\b) are used to prevent false positives on legitimate educational/skill words.
const EXPLICIT_PATTERNS: RegExp[] = [
  /\b(porn|porno|pornography|nsfw|erotic|erotica|hentai|striptease|stripper|strippers)\b/i,
  /\b(escort|escorts|escort\s+service|sex|sexual|sexually|hookup|hookups|onlyfans|camgirl|sugar\s+daddy|sugar\s+baby)\b/i,
  /\b(explicit\s+content|18\+|adult\s+service|sexual\s+favor|sexual\s+service|nude|nudes|nudity|xxx)\b/i,
  /\b(cunnilingus|fellatio|blowjob|cumshot|milf|dildo|anal|group\s+sex|threesome|orgy|orgasm)\b/i,
  /\b(bdsm|bondage|erotic\s+massage|fuck|cock|dick|pussy|vagina|boobs|penis)\b/i,
];

/**
 * Validates text for inappropriate explicit/18+ content.
 * Returns null if valid, or a user-friendly error message if invalid.
 */
export function validateListingContent(title: string, description: string): { isValid: boolean; error: string | null } {
  const combinedText = `${title || ""} ${description || ""}`.toLowerCase();

  // Normalize common leetspeak substitutions
  const normalizedText = combinedText
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/!/g, "i")
    .replace(/3/g, "e")
    .replace(/@/g, "a")
    .replace(/\$/g, "s");

  for (const pattern of EXPLICIT_PATTERNS) {
    if (pattern.test(combinedText) || pattern.test(normalizedText)) {
      return {
        isValid: false,
        error: "Please use an appropriate title and description.",
      };
    }
  }

  return { isValid: true, error: null };
}
