import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PUT: Bulk update bookshelves (reorder, rename, add, delete)
export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { shelves } = await request.json();

  if (!Array.isArray(shelves) || shelves.length === 0) {
    return NextResponse.json(
      { error: "You must have at least one bookshelf" },
      { status: 400 }
    );
  }

  // Validate all shelves have names
  for (const shelf of shelves) {
    if (!shelf.name || typeof shelf.name !== "string" || shelf.name.trim().length === 0) {
      return NextResponse.json({ error: "All shelves must have a name" }, { status: 400 });
    }
  }

  // Check for duplicate names
  const names = shelves.map((s: { name: string }) => s.name.trim().toLowerCase());
  const uniqueNames = new Set(names);
  if (uniqueNames.size !== names.length) {
    return NextResponse.json({ error: "Shelf names must be unique" }, { status: 400 });
  }

  try {
    // Get current shelves
    const { data: currentShelves } = await supabase
      .from("bookshelves")
      .select("id")
      .eq("user_id", user.id);

    const currentIds = new Set((currentShelves || []).map((s) => s.id));

    // Determine which shelves to delete (exist in DB but not in new list)
    const newIds = new Set(
      shelves.filter((s: { id?: string }) => s.id).map((s: { id: string }) => s.id)
    );
    const toDelete = [...currentIds].filter((id) => !newIds.has(id));

    // Delete removed shelves
    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("bookshelves")
        .delete()
        .in("id", toDelete)
        .eq("user_id", user.id);

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }
    }

    // Upsert remaining and new shelves
    for (let i = 0; i < shelves.length; i++) {
      const shelf = shelves[i];

      if (shelf.id && currentIds.has(shelf.id)) {
        // Update existing
        const { error } = await supabase
          .from("bookshelves")
          .update({ name: shelf.name.trim(), display_order: i })
          .eq("id", shelf.id)
          .eq("user_id", user.id);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      } else {
        // Insert new
        const { error } = await supabase
          .from("bookshelves")
          .insert({
            user_id: user.id,
            name: shelf.name.trim(),
            display_order: i,
          });

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }
    }

    // Fetch the updated list
    const { data: updatedShelves } = await supabase
      .from("bookshelves")
      .select("*")
      .eq("user_id", user.id)
      .order("display_order", { ascending: true });

    return NextResponse.json({ shelves: updatedShelves });
  } catch (err) {
    console.error("Reorder error:", err);
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
