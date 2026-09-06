/**
 * Turkish-to-ASCII slug generator for clean, SEO-compliant URLs.
 * Converts Turkish characters to ASCII and ensures slug contains only [a-z0-9-].
 */
export function generateAsciiSlug(text: string): string {
  const trMap: Record<string, string> = {
    ç: "c",
    Ç: "c",
    ğ: "g",
    Ğ: "g",
    ı: "i",
    I: "i",
    İ: "i",
    i: "i",
    ö: "o",
    Ö: "o",
    ş: "s",
    Ş: "s",
    ü: "u",
    Ü: "u",
  };
  const normalized = text
    .split("")
    .map((c) => trMap[c] || c)
    .join("");

  const slug = normalized
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `esnaf-${Math.floor(Math.random() * 10000)}`;
}
