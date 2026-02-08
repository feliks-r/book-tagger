import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ bookshelf_id: string }> };

// PATCH: Rename a bookshelf
export async function PATCH(request: Request, { params }: RouteContext) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { bookshelf_id: shelfId } = await params;

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { name } = await request.json();

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const { data: shelf, error } = await supabase
    .from("bookshelves")
    .update({ name: name.trim() })
    .eq("id", shelfId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ shelf });
}

// DELETE: Delete a bookshelf (must have at least 1 remaining)
export async function DELETE(_request: Request, { params }: RouteContext) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { bookshelf_id: shelfId } = await params;

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Check shelf count
  const { count } = await supabase
    .from("bookshelves")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) <= 1) {
    return NextResponse.json(
      { error: "You must have at least one bookshelf" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("bookshelves")
    .delete()
    .eq("id", shelfId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
