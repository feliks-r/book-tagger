import type { Author } from "@/types";

/**
 * Format an array of authors into a readable string.
 * e.g. "Author A", "Author A and Author B", "Author A, Author B, and Author C"
 */
export function formatAuthors(authors: Author[]): string {
  if (!authors || authors.length === 0) return "Unknown";
  if (authors.length === 1) return authors[0].name;
  if (authors.length === 2) return `${authors[0].name} and ${authors[1].name}`;
  return authors.slice(0, -1).map((a) => a.name).join(", ") + ", and " + authors[authors.length - 1].name;
}

/**
 * Transform the raw Supabase joined result (book_authors(authors(id, name))) into
 * a flat Author[] array sorted by display_order.
 */
type RawBookAuthorJoin = {
  display_order: number;
  authors: { id: string; name: string } | null;
};

export function parseAuthorsJoin(raw: RawBookAuthorJoin[] | null | undefined): Author[] {
  if (!raw) return [];
  return raw
    .sort((a, b) => a.display_order - b.display_order)
    .filter((ba) => ba.authors != null)
    .map((ba) => ba.authors as Author);
}
