import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ shelf_id: string }> };

// GET: Fetch books on a shelf with optional title search, tag filters, year range, and sorting
export async function GET(request: NextRequest, { params }: RouteContext) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { shelf_id: shelfId } = await params;

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Verify shelf belongs to user
  const { data: shelf } = await supabase
    .from("bookshelves")
    .select("id")
    .eq("id", shelfId)
    .eq("user_id", user.id)
    .single();

  if (!shelf) {
    return NextResponse.json({ error: "Shelf not found" }, { status: 404 });
  }

  const searchParams = request.nextUrl.searchParams;
  const titleQuery = searchParams.get("q") || "";
  const includeTags = searchParams.get("include")?.split(",").filter(Boolean) || [];
  const excludeTags = searchParams.get("exclude")?.split(",").filter(Boolean) || [];
  const yearFrom = searchParams.get("yearFrom");
  const yearTo = searchParams.get("yearTo");
  const sortBy = searchParams.get("sort") || "added_at";
  const sortDir = searchParams.get("dir") || "desc";

  try {
    // Fetch book IDs on this shelf with added_at
    const { data: shelfBooks, error: shelfError } = await supabase
      .from("bookshelf_books")
      .select("book_id, added_at")
      .eq("bookshelf_id", shelfId);

    if (shelfError) {
      return NextResponse.json({ error: shelfError.message }, { status: 500 });
    }

    if (!shelfBooks || shelfBooks.length === 0) {
      return NextResponse.json({ books: [], total: 0 });
    }

    const bookIds = shelfBooks.map((sb) => sb.book_id);
    const addedAtMap: Record<string, string> = {};
    for (const sb of shelfBooks) {
      addedAtMap[sb.book_id] = sb.added_at;
    }

    // Fetch book details
    let query = supabase
      .from("books")
      .select("id, title, author, description, publication_year")
      .in("id", bookIds);

    if (titleQuery) {
      query = query.ilike("title", `%${titleQuery}%`);
    }
    if (yearFrom) {
      query = query.gte("publication_year", parseInt(yearFrom));
    }
    if (yearTo) {
      query = query.lte("publication_year", parseInt(yearTo));
    }

    const { data: books, error: booksError } = await query;

    if (booksError) {
      return NextResponse.json({ error: booksError.message }, { status: 500 });
    }

    if (!books || books.length === 0) {
      return NextResponse.json({ books: [], total: 0 });
    }

    // Apply tag filters if needed
    let filteredBooks = books;

    if (includeTags.length > 0 || excludeTags.length > 0) {
      const filteredBookIds = books.map((b) => b.id);

      const { data: bookTags } = await supabase
        .from("book_tags")
        .select("book_id, tag_id, value")
        .in("book_id", filteredBookIds);

      const bookTagScores: Record<string, Record<string, number>> = {};
      for (const bt of bookTags || []) {
        if (!bookTagScores[bt.book_id]) bookTagScores[bt.book_id] = {};
        if (!bookTagScores[bt.book_id][bt.tag_id]) bookTagScores[bt.book_id][bt.tag_id] = 0;
        bookTagScores[bt.book_id][bt.tag_id] += bt.value;
      }

      filteredBooks = books.filter((book) => {
        const tagScores = bookTagScores[book.id] || {};

        if (includeTags.length > 0) {
          const hasAll = includeTags.every(
            (tagId) => tagScores[tagId] !== undefined && tagScores[tagId] > 0
          );
          if (!hasAll) return false;
        }

        if (excludeTags.length > 0) {
          const hasAny = excludeTags.some(
            (tagId) => tagScores[tagId] !== undefined && tagScores[tagId] > 0
          );
          if (hasAny) return false;
        }

        return true;
      });
    }

    // Add added_at to each book
    const booksWithDate = filteredBooks.map((book) => ({
      ...book,
      added_at: addedAtMap[book.id] || null,
    }));

    // Sort
    booksWithDate.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "added_at") {
        cmp = (a.added_at || "").localeCompare(b.added_at || "");
      } else if (sortBy === "title") {
        cmp = a.title.localeCompare(b.title);
      } else if (sortBy === "publication_year") {
        cmp = (a.publication_year || 0) - (b.publication_year || 0);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return NextResponse.json({ books: booksWithDate, total: booksWithDate.length });
  } catch (err) {
    console.error("Shelf books list error:", err);
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
