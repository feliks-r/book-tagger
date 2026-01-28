import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;

  const includeTags = searchParams.get("include")?.split(",").filter(Boolean) || [];
  const excludeTags = searchParams.get("exclude")?.split(",").filter(Boolean) || [];
  const yearFrom = searchParams.get("yearFrom");
  const yearTo = searchParams.get("yearTo");
  const sort = searchParams.get("sort") || "best_match";

  try {
    // Start building the query
    let query = supabase.from("books").select(`
      id,
      title,
      author,
      description,
      publication_year
    `);

    // Filter by publication year range
    if (yearFrom) {
      query = query.gte("publication_year", parseInt(yearFrom));
    }
    if (yearTo) {
      query = query.lte("publication_year", parseInt(yearTo));
    }

    const { data: books, error } = await query;

    if (error) {
      console.error("Error fetching books:", error);
      return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 });
    }

    if (!books || books.length === 0) {
      return NextResponse.json({ books: [], total: 0 });
    }

    // Get tag scores for all books
    const bookIds = books.map((b) => b.id);

    const { data: bookTags } = await supabase
      .from("book_tags")
      .select("book_id, tag_id, value")
      .in("book_id", bookIds);

    // Calculate tag scores per book
    const bookTagScores: Record<string, Record<string, number>> = {};
    for (const bt of bookTags || []) {
      if (!bookTagScores[bt.book_id]) {
        bookTagScores[bt.book_id] = {};
      }
      if (!bookTagScores[bt.book_id][bt.tag_id]) {
        bookTagScores[bt.book_id][bt.tag_id] = 0;
      }
      bookTagScores[bt.book_id][bt.tag_id] += bt.value;
    }

    // Filter books by include/exclude tags
    let filteredBooks = books.filter((book) => {
      const tagScores = bookTagScores[book.id] || {};

      // Must have ALL included tags with positive score
      if (includeTags.length > 0) {
        const hasAllIncluded = includeTags.every(
          (tagId) => tagScores[tagId] !== undefined && tagScores[tagId] > 0
        );
        if (!hasAllIncluded) return false;
      }

      // Must NOT have any excluded tags with positive score
      if (excludeTags.length > 0) {
        const hasAnyExcluded = excludeTags.some(
          (tagId) => tagScores[tagId] !== undefined && tagScores[tagId] > 0
        );
        if (hasAnyExcluded) return false;
      }

      return true;
    });

    // Calculate relevance score for sorting
    const booksWithScores = filteredBooks.map((book) => {
      const tagScores = bookTagScores[book.id] || {};

      // Best match: sum of included tag scores
      const matchScore = includeTags.reduce((sum, tagId) => {
        return sum + (tagScores[tagId] || 0);
      }, 0);

      // Popularity: total positive tag votes
      const popularity = Object.values(tagScores).reduce(
        (sum, score) => sum + Math.max(0, score),
        0
      );

      return { ...book, matchScore, popularity };
    });

    // Sort results
    if (sort === "best_match" && includeTags.length > 0) {
      booksWithScores.sort((a, b) => b.matchScore - a.matchScore);
    } else {
      // Default to popularity
      booksWithScores.sort((a, b) => b.popularity - a.popularity);
    }

    return NextResponse.json({
      books: booksWithScores,
      total: booksWithScores.length,
    });
  } catch (err) {
    console.error("Search error:", err);
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
