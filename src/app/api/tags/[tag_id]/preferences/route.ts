import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type PreferenceField = "is_saved" | "is_followed" | "is_hidden";
const validFields: PreferenceField[] = ["is_saved", "is_followed", "is_hidden"];

// GET: fetch the current user's preferences for a tag
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tag_id: string }> }
) {
  const { tag_id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ is_saved: false, is_followed: false, is_hidden: false });
  }

  const { data } = await supabase
    .from("user_tag_preferences")
    .select("is_saved, is_followed, is_hidden")
    .eq("user_id", user.id)
    .eq("tag_id", tag_id)
    .maybeSingle();

  return NextResponse.json({
    is_saved: data?.is_saved ?? false,
    is_followed: data?.is_followed ?? false,
    is_hidden: data?.is_hidden ?? false,
  });
}

// POST: toggle a single preference for a tag
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

  const { field } = await request.json() as { field: string };
  if (!validFields.includes(field as PreferenceField)) {
    return NextResponse.json({ error: "Invalid field" }, { status: 400 });
  }

  const prefField = field as PreferenceField;

  // Check if row exists
  const { data: existing } = await supabase
    .from("user_tag_preferences")
    .select("id, is_saved, is_followed, is_hidden")
    .eq("user_id", user.id)
    .eq("tag_id", tag_id)
    .maybeSingle();

  const newValue = !(existing?.[prefField] ?? false);

  if (existing) {
    // Update the row
    const { error } = await supabase
      .from("user_tag_preferences")
      .update({ [prefField]: newValue, updated_at: new Date().toISOString() })
      .eq("id", existing.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If all booleans are false, clean up the row
    const updated = { ...existing, [prefField]: newValue };
    if (!updated.is_saved && !updated.is_followed && !updated.is_hidden) {
      await supabase.from("user_tag_preferences").delete().eq("id", existing.id);
    }
  } else {
    // Insert new row with this preference toggled on
    const { error } = await supabase
      .from("user_tag_preferences")
      .insert({
        user_id: user.id,
        tag_id,
        [prefField]: true,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ field: prefField, value: newValue });
}
