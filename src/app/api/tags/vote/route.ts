import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// API route for tag voting used on book pages

export async function POST(req: Request) {
  const supabase = await createClient();
  const { bookId, tagId, value } = await req.json(); // value = 1, -1, or 0

  // ------------------------------------------------------------
  // Validate input
  if (!bookId || !tagId || value === undefined || ![1, -1, 0].includes(value)) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  // ------------------------------------------------------------
  // Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  console.log(user);

  try {
    // ------------------------------------------------------------
    // Apply vote
    if (value === 0) {
      // Remove vote
      const { error } = await supabase
        .from("book_tags")
        .delete()
        .eq("book_id", bookId)
        .eq("tag_id", tagId)
        .eq("user_id", user.id);

      if (error) throw error;
    } else {
      // Insert or update vote
      const { error } = await supabase
        .from("book_tags")
        .upsert(
          {
            book_id: bookId,
            tag_id: tagId,
            user_id: user.id,
            value,
          },
          { onConflict: "book_id,tag_id,user_id" }
        );

      if (error) throw error;
    }


    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("VOTE ROUTE ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
