import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET: fetch the current user's preferences for a tag
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tag_id: string }> }
) {
  const { tag_id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ preferences: [] });
  }

  const { data } = await supabase
    .from("user_tag_preferences")
    .select("preference")
    .eq("user_id", user.id)
    .eq("tag_id", tag_id);

  const preferences = data?.map((r) => r.preference) || [];
  return NextResponse.json({ preferences });
}

// POST: toggle a preference for a tag
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tag_id: string }> }
) {
  const { tag_id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { preference } = await request.json();
  if (!["saved", "followed", "hidden"].includes(preference)) {
    return NextResponse.json({ error: "Invalid preference" }, { status: 400 });
  }

  // Check if already exists
  const { data: existing } = await supabase
    .from("user_tag_preferences")
    .select("id")
    .eq("user_id", user.id)
    .eq("tag_id", tag_id)
    .eq("preference", preference)
    .maybeSingle();

  if (existing) {
    // Remove it (toggle off)
    await supabase
      .from("user_tag_preferences")
      .delete()
      .eq("id", existing.id);

    return NextResponse.json({ action: "removed", preference });
  } else {
    // Add it (toggle on)
    const { error } = await supabase
      .from("user_tag_preferences")
      .insert({ user_id: user.id, tag_id, preference });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ action: "added", preference });
  }
}
