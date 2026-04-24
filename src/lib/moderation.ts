import { createClient } from "@/lib/supabase/server";

export async function isModerator(): Promise<{ isMod: boolean; userId: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { isMod: false, userId: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();

  const isMod = profile?.role === "moderator" || profile?.role === "admin";
  return { isMod, userId: user.id };
}

export async function logModerationAction(
  moderatorId: string,
  action: "view" | "edit" | "approve" | "reject" | "save",
  targetType: "book_proposal" | "tag_proposal" | "report",
  targetId: string,
  changes?: Record<string, unknown>,
  note?: string
) {
  const supabase = await createClient();
  
  await supabase.from("moderation_log").insert({
    moderator_id: moderatorId,
    action,
    target_type: targetType,
    target_id: targetId,
    changes: changes || null,
    note: note || null,
  });
}
