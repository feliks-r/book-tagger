import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();

  const url = new URL(req.url);
  const bookId = url.searchParams.get("bookId");
  const tagId = url.searchParams.get("tagId");

  if (!bookId || !tagId) {
    return NextResponse.json({ error: "Missing bookId or tagId" }, { status: 400 });
  }

  // get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("book_tags")
    .select("value")
    .eq("book_id", bookId)
    .eq("tag_id", tagId)
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows found, not an actual error
    console.error("FETCH VOTE ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ value: data?.value ?? 0 });
}

