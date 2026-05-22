import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ shelf_id: string }> };

// POST: Add a book to a bookshelf
export async function POST(request: Request, { params }: RouteContext) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { shelf_id: shelfId } = await params;

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { bookId } = await request.json();

  if (!bookId) {
    return NextResponse.json({ error: "bookId is required" }, { status: 400 });
  }

  // Verify the shelf belongs to the user
  const { data: shelf } = await supabase
    .from("bookshelves")
    .select("id")
    .eq("id", shelfId)
    .eq("user_id", user.id)
    .single();

  if (!shelf) {
    return NextResponse.json({ error: "Shelf not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("bookshelf_books")
    .insert({ bookshelf_id: shelfId, book_id: bookId });

  if (error) {
    // Unique constraint violation = already on shelf
    if (error.code === "23505") {
      return NextResponse.json({ error: "Book already on this shelf" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE: Remove a book from a bookshelf
export async function DELETE(request: Request, { params }: RouteContext) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { shelf_id: shelfId } = await params;

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { bookId } = await request.json();

  if (!bookId) {
    return NextResponse.json({ error: "bookId is required" }, { status: 400 });
  }

  // Verify the shelf belongs to the user
  const { data: shelf } = await supabase
    .from("bookshelves")
    .select("id")
    .eq("id", shelfId)
    .eq("user_id", user.id)
    .single();

  if (!shelf) {
    return NextResponse.json({ error: "Shelf not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("bookshelf_books")
    .delete()
    .eq("bookshelf_id", shelfId)
    .eq("book_id", bookId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
