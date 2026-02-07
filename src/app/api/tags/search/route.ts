import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// api route for searching tags by input text 
// used in inputs on book pages and (TD) on the tag search/browse page

export async function GET(req: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";

  if (!query) {
    return NextResponse.json({ tags: [] });
  }

  const { data, error } = await supabase
    .from("tags")
    .select(`
      id,
      name,
      category:tag_categories (
        id,
        name
      )
    `)
    .ilike("name", `%${query}%`)
    .limit(6);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tags: data });
}
