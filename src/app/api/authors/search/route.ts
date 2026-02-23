import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";

  if (!query || query.length < 2) {
    return NextResponse.json({ authors: [] });
  }

  const { data, error } = await supabase
    .from("authors")
    .select("id, name")
    .ilike("name", `%${query}%`)
    .order("name")
    .limit(8);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ authors: data || [] });
}
