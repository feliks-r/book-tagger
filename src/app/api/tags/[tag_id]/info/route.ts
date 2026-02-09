import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tag_id: string }> }
) {
  const { tag_id } = await params;
  const supabase = await createClient();

  const { data: tag, error } = await supabase
    .from("tags")
    .select("id, name, description, category_id, tag_categories(name)")
    .eq("id", tag_id)
    .single<{ id: string; name: string; description: string | null; category_id: string | null; tag_categories: { name: string } | null }>();

  if (error || !tag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  const category = tag.tag_categories;

  return NextResponse.json({
    id: tag.id,
    name: tag.name,
    description: tag.description,
    category_name: category?.name ?? "",
  });
}
