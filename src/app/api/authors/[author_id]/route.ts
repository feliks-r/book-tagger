import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseAuthorsJoin } from "@/lib/authors";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ author_id: string }> }
) {
  const { author_id } = await params;
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const tab = searchParams.get("tab") || "books";

  // Fetch author info
  const { data: author, error: authorError } = await supabase
    .from("authors")
    .select("id, name")
    .eq("id", author_id)
    .single();

  if (authorError || !author) {
    return NextResponse.json({ error: "Author not found" }, { status: 404 });
  }

  if (tab === "books") {
    // Fetch all book_ids for this author
    const { data: bookAuthorRows } = await supabase
      .from("book_authors")
      .select("book_id")
      .eq("author_id", author_id);

    const bookIds = (bookAuthorRows || []).map((r) => r.book_id);

    if (bookIds.length === 0) {
      return NextResponse.json({ author, books: [], total: 0 });
    }

    const { data: books } = await supabase
      .from("books")
      .select("id, title, description, publication_year, cover_id, series_id, series_index, book_authors(display_order, authors(id, name))")
      .in("id", bookIds)
      .order("publication_year", { ascending: true, nullsFirst: false });

    const formatted = (books || []).map((b: any) => ({
      id: b.id,
      title: b.title,
      description: b.description,
      publication_year: b.publication_year,
      cover_id: b.cover_id,
      series_id: b.series_id,
      series_index: b.series_index,
      authors: parseAuthorsJoin(b.book_authors),
    }));

    return NextResponse.json({ author, books: formatted, total: formatted.length });
  }

  if (tab === "tags") {
    // Fetch all book_ids for this author
    const { data: bookAuthorRows } = await supabase
      .from("book_authors")
      .select("book_id")
      .eq("author_id", author_id);

    const bookIds = (bookAuthorRows || []).map((r) => r.book_id);

    if (bookIds.length === 0) {
      return NextResponse.json({ author, tags: [] });
    }

    // Fetch all book_tags for these books (only positive votes count as "tagged")
    const { data: bookTags } = await supabase
      .from("book_tags")
      .select("tag_id, value")
      .in("book_id", bookIds);

    if (!bookTags || bookTags.length === 0) {
      return NextResponse.json({ author, tags: [] });
    }

    // Count net score per tag across all of this author's books
    const tagScores: Record<string, number> = {};
    for (const bt of bookTags) {
      tagScores[bt.tag_id] = (tagScores[bt.tag_id] || 0) + bt.value;
    }

    // Only include tags with positive net score
    const tagIds = Object.entries(tagScores)
      .filter(([, score]) => score > 0)
      .map(([id]) => id);

    if (tagIds.length === 0) {
      return NextResponse.json({ author, tags: [] });
    }

    type TagRow = {
      id: string;
      name: string;
      description: string | null;
      category_id: string | null;
      tag_categories: { name: string } | null;
    };

    const { data: tags } = await supabase
      .from("tags")
      .select("id, name, description, category_id, tag_categories(name)")
      .in("id", tagIds)
      .returns<TagRow[]>();

    const enriched = (tags || []).map((tag) => ({
      id: tag.id,
      name: tag.name,
      description: tag.description,
      category_name: tag.tag_categories?.name ?? "",
      count: tagScores[tag.id] || 0,
    }));

    enriched.sort((a, b) => b.count - a.count);

    return NextResponse.json({ author, tags: enriched });
  }

  return NextResponse.json({ error: "Invalid tab" }, { status: 400 });
}
