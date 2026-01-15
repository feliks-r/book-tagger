import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// api route for proposing a new tag with name, categoryId and optional description

export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, categoryId, description } = await req.json();

  function validateTagName(name: string) {
    const trimmed = name.trim();

    if (!trimmed) return "Tag name is required.";
    if (trimmed.length < 2) return "Tag name must be at least 2 characters.";
    if (trimmed.length > 40) return "Tag name must be under 40 characters.";
    if (!/^[a-zA-Z0-9\s-]+$/.test(trimmed))
      return "Only letters, numbers, spaces, and hyphens are allowed.";

    return null;
  }

  const validationError = validateTagName(name);
  if (validationError) {
    return NextResponse.json(
      { error: validationError },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("tag_proposals").insert({
    name: name.toLowerCase().trim(),
    category_id: categoryId,
    description,
    user_id: user.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
