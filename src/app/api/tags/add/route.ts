import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notifyTagFollowers } from "@/lib/notifications";
import type { BookTagWithVotes } from "@/types";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { bookId, tagId } = await req.json();

  if (!bookId || !tagId) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  // Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Upsert vote = +1
  // First check if this tag already exists on this book (any user)
  const { data: existingVotes } = await supabase
    .from("book_tags")
    .select("id")
    .eq("book_id", bookId)
    .eq("tag_id", tagId)
    .limit(1);

  const isFirstTagging = !existingVotes || existingVotes.length === 0;

  const { error: upsertError } = await supabase
    .from("book_tags")
    .upsert(
      { book_id: bookId, tag_id: tagId, user_id: user.id, value: 1 },
      { onConflict: "book_id,tag_id,user_id" }
    );

  if (upsertError) {
    console.error(upsertError);
    return NextResponse.json({ error: "Failed to tag book" }, { status: 500 });
  }

  // Fetch the tag and category
  type TagWithCategory = {
    id: string;
    name: string;
    description: string | null;
    category_id: string | null;
    tag_categories: { name: string; display_order: number } | null;
  };

  const { data: tagData, error: tagError } = await supabase
    .from("tags")
    .select(`
      id,
      name,
      description,
      category_id,
      tag_categories(name, display_order)
    `)
    .eq("id", tagId)
    .single<TagWithCategory>();

  if (tagError || !tagData) {
    console.error(tagError);
    return NextResponse.json({ error: "Tag added but failed to fetch tag" }, { status: 500 });
  }

  // Compute score and user_value
  const { data: votes } = await supabase
    .from("book_tags")
    .select("user_id, value")
    .eq("book_id", bookId)
    .eq("tag_id", tagId);

  const score = votes?.reduce((sum, v) => sum + v.value, 0) ?? 0;
  const userVote = votes?.find((v) => v.user_id === user.id)?.value ?? 0;

  const category = tagData.tag_categories;

  const tag: BookTagWithVotes = {
    id: tagData.id,
    name: tagData.name,
    description: tagData.description,
    category_id: tagData.category_id,
    category_name: category?.name ?? "",
    category_display_order: category?.display_order ?? 0,
    score,
    user_value: userVote,
  };

  // Notify tag followers if this is the first time this tag is on this book
  if (isFirstTagging) {
    // Get book title for the notification
    const { data: book } = await supabase
      .from("books")
      .select("title")
      .eq("id", bookId)
      .single();

    if (book) {
      // Fire and forget - don't await to keep response fast
      notifyTagFollowers({
        supabase,
        tagId,
        tagName: tagData.name,
        bookId,
        bookTitle: book.title,
        excludeUserId: user.id,
      });
    }
  }

  return NextResponse.json({ tag });
}
