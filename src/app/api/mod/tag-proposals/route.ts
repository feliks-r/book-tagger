import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isModerator } from "@/lib/moderation";

export async function GET(req: NextRequest) {
  const { isMod } = await isModerator();
  if (!isMod) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "pending";

  const { data: proposals, error } = await supabase
    .from("tag_proposals")
    .select(`
      id,
      name,
      description,
      category_id,
      status,
      moderator_notes,
      created_at,
      reviewed_at,
      user_id,
      reviewed_by,
      profiles:user_id(username),
      tag_categories:category_id(id, name)
    `)
    .eq("status", status)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching tag proposals:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const transformed = (proposals || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    category_id: p.category_id,
    category_name: p.tag_categories?.name || "Unknown",
    status: p.status,
    moderator_notes: p.moderator_notes,
    created_at: p.created_at,
    reviewed_at: p.reviewed_at,
    submitted_by: p.user_id,
    submitted_by_username: p.profiles?.username || "Unknown",
  }));

  return NextResponse.json({ proposals: transformed });
}
