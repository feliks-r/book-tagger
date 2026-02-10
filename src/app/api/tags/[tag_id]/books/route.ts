import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseAuthorsJoin } from "@/lib/authors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tag_id: string }> }
) {
  const { tag_id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const url = new URL(request.url);
  const onlyMine = url.searchParams.get("mine") === "true";
  const sort = url.searchParams.get("sort") || "score";
  const dir = url.searchParams.get("dir") || "desc";

  // Get all book_tags rows for this tag
  let btQuery = supabase
    .from("book_tags")
    .select("book_id, user_id, value")
    .eq("tag_id", tag_id);

  if (onlyMine && user) {
    btQuery = btQuery.eq("user_id", user.id);
  }

  const { data: bookTags } = await btQuery;
  if (!bookTags || bookTags.length === 0) {
    return NextResponse.json({ books: [], total: 0 });
  }

  // Aggregate scores per book
  const bookScores: Record<string, number> = {};
  const userTagged = new Set<string>();

  for (const bt of bookTags) {
    bookScores[bt.book_id] = (bookScores[bt.book_id] || 0) + bt.value;
    if (user && bt.user_id === user.id && bt.value !== 0) {
      userTagged.add(bt.book_id);
    }
  }

  const bookIds = Object.keys(bookScores);

  // Fetch books
  const { data: books } = await supabase
    .from("books")
    .select("id, title, description, publication_year, cover_id, book_authors(display_order, authors(id, name))")
    .in("id", bookIds);

  if (!books) {
    return NextResponse.json({ books: [], total: 0 });
  }

  // Enrich with score and flatten authors
  const enriched = books.map((book: any) => ({
    id: book.id,
    title: book.title,
    description: book.description,
    publication_year: book.publication_year,
    cover_id: book.cover_id,
    authors: parseAuthorsJoin(book.book_authors),
    tagScore: bookScores[book.id] || 0,
    userTagged: userTagged.has(book.id),
  }));

  // Sort
  enriched.sort((a, b) => {
    let cmp = 0;
    if (sort === "score") {
      cmp = a.tagScore - b.tagScore;
    } else if (sort === "title") {
      cmp = a.title.localeCompare(b.title);
    } else if (sort === "publication_year") {
      cmp = (a.publication_year || 0) - (b.publication_year || 0);
    }
    return dir === "desc" ? -cmp : cmp;
  });

  return NextResponse.json({ books: enriched, total: enriched.length });
}
