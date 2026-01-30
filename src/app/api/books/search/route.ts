import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// api route for searching tbooks by input text 
// used in the search bar on top

export async function GET(req: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";

  if (!query) {
    return NextResponse.json({ books: [] });
  }

  const { data, error } = await supabase
    .from("books")
    .select(`
      id,
      title,
      author
    `)
    .ilike("title", `%${query}%`)
    .limit(6);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ books: data });
}
