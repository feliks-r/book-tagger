import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET: Fetch all bookshelves for the current user,
//      optionally with hasBook status for a specific book
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get("bookId");

  const { data: shelves, error } = await supabase
    .from("bookshelves")
    .select("*")
    .eq("user_id", user.id)
    .order("position", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!bookId) {
    return NextResponse.json({ shelves });
  }

  // If bookId provided, check which shelves contain this book
  const { data: bookEntries } = await supabase
    .from("bookshelf_books")
    .select("bookshelf_id")
    .eq("book_id", bookId)
    .in("bookshelf_id", shelves.map((s) => s.id));

  const bookShelfIds = new Set((bookEntries || []).map((e) => e.bookshelf_id));

  const shelvesWithStatus = shelves.map((shelf) => ({
    ...shelf,
    hasBook: bookShelfIds.has(shelf.id),
  }));

  return NextResponse.json({ shelves: shelvesWithStatus });
}

// POST: Create a new bookshelf
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { name } = await request.json();

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  // Get the highest position to add the new shelf at the end
  const { data: existing } = await supabase
    .from("bookshelves")
    .select("position")
    .eq("user_id", user.id)
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0;

  const { data: shelf, error } = await supabase
    .from("bookshelves")
    .insert({ user_id: user.id, name: name.trim(), position: nextPosition })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ shelf });
}
