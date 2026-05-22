import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH - Update username, email, or password
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { username, email, password } = body;

  // Update username in profiles table
  if (username !== undefined) {
    const trimmed = username.trim();
    if (trimmed.length < 2 || trimmed.length > 30) {
      return NextResponse.json(
        { error: "Username must be between 2 and 30 characters" },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("profiles")
      .update({ username: trimmed })
      .eq("id", user.id);

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Username already taken" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Update email via Supabase Auth
  if (email !== undefined) {
    const trimmed = email.trim().toLowerCase();
    const { error } = await supabase.auth.updateUser({ email: trimmed });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  // Update password via Supabase Auth
  if (password !== undefined) {
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  return NextResponse.json({ success: true });
}

// DELETE - Delete account
export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Delete user data (cascading deletes handle related tables)
  const { error: profileError } = await supabase
    .from("profiles")
    .delete()
    .eq("id", user.id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // Sign out
  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}
