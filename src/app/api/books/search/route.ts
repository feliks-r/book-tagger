import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseAuthorsJoin } from "@/lib/authors";

// api route for searching books by input text 
// used in the search bar on top

export async function GET(req: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";

  if (!query) {
    return NextResponse.json({ books: [] });
  }

  const { data, error } = await supabase
    .from("books")
    .select(`
      id,
      title,
      cover_id,
      book_authors(display_order, authors(id, name))
    `)
    .ilike("title", `%${query}%`)
    .limit(6);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const books = (data || []).map((book) => ({
    id: book.id,
    title: book.title,
    cover_id: book.cover_id,
    authors: parseAuthorsJoin(book.book_authors as any),
  }));

  return NextResponse.json({ books });
}
