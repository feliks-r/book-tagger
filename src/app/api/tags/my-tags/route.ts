import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const url = new URL(request.url);
  const tab = url.searchParams.get("tab") || "upvoted";

  if (tab === "upvoted" || tab === "downvoted") {
    // Get tags the user voted on (via book_tags)
    const voteValue = tab === "upvoted" ? 1 : -1;

    const { data: votes } = await supabase
      .from("book_tags")
      .select("tag_id, value")
      .eq("user_id", user.id)
      .eq("value", voteValue);

    if (!votes || votes.length === 0) {
      return NextResponse.json({ tags: [] });
    }

    // Count how many books each tag was voted on
    const tagCounts: Record<string, number> = {};
    for (const v of votes) {
      tagCounts[v.tag_id] = (tagCounts[v.tag_id] || 0) + 1;
    }

    const tagIds = Object.keys(tagCounts);

    type TagRow = { id: string; name: string; description: string | null; category_id: string | null; tag_categories: { name: string } | null };

    const { data: tags } = await supabase
      .from("tags")
      .select("id, name, description, category_id, tag_categories(name)")
      .in("id", tagIds)
      .returns<TagRow[]>();

    if (!tags) {
      return NextResponse.json({ tags: [] });
    }

    const enriched = tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      description: tag.description,
      category_name: tag.tag_categories?.name ?? "",
      book_count: tagCounts[tag.id] || 0,
    }));

    enriched.sort((a, b) => b.book_count - a.book_count);

    return NextResponse.json({ tags: enriched });
  }

  // saved / followed / hidden
  if (["saved", "followed", "hidden"].includes(tab)) {
    const { data: prefs } = await supabase
      .from("user_tag_preferences")
      .select("tag_id, created_at")
      .eq("user_id", user.id)
      .eq("preference", tab);

    if (!prefs || prefs.length === 0) {
      return NextResponse.json({ tags: [] });
    }

    const tagIds = prefs.map((p) => p.tag_id);
    const addedMap: Record<string, string> = {};
    for (const p of prefs) {
      addedMap[p.tag_id] = p.created_at;
    }

    type TagRow = { id: string; name: string; description: string | null; category_id: string | null; tag_categories: { name: string } | null };

    const { data: tags } = await supabase
      .from("tags")
      .select("id, name, description, category_id, tag_categories(name)")
      .in("id", tagIds)
      .returns<TagRow[]>();

    if (!tags) {
      return NextResponse.json({ tags: [] });
    }

    const enriched = tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      description: tag.description,
      category_name: tag.tag_categories?.name ?? "",
      added_at: addedMap[tag.id] || "",
    }));

    enriched.sort((a, b) => b.added_at.localeCompare(a.added_at));

    return NextResponse.json({ tags: enriched });
  }

  return NextResponse.json({ error: "Invalid tab" }, { status: 400 });
}
