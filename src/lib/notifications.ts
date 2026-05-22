import { SupabaseClient } from "@supabase/supabase-js";

export type NotificationType = 
  | "tag_new_book" 
  | "book_proposal_approved" 
  | "book_proposal_rejected" 
  | "tag_proposal_approved" 
  | "tag_proposal_rejected";

type CreateNotificationParams = {
  supabase: SupabaseClient;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
};

export async function createNotification({
  supabase,
  userId,
  type,
  title,
  message,
  link,
  metadata = {},
}: CreateNotificationParams): Promise<void> {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    message,
    link,
    metadata,
  });

  if (error) {
    console.error("Failed to create notification:", error);
  }
}

export async function notifyTagFollowers({
  supabase,
  tagId,
  tagName,
  bookId,
  bookTitle,
  excludeUserId,
}: {
  supabase: SupabaseClient;
  tagId: string;
  tagName: string;
  bookId: string;
  bookTitle: string;
  excludeUserId?: string;
}): Promise<void> {
  // Get all users who follow this tag
  const { data: followers, error } = await supabase
    .from("user_tag_preferences")
    .select("user_id")
    .eq("tag_id", tagId)
    .eq("is_followed", true);

  if (error || !followers || followers.length === 0) {
    return;
  }

  // Filter out the user who added the tag (they don't need to be notified)
  const userIds = followers
    .map((f) => f.user_id)
    .filter((id) => id !== excludeUserId);

  if (userIds.length === 0) {
    return;
  }

  // Create notifications for all followers
  const notifications = userIds.map((userId) => ({
    user_id: userId,
    type: "tag_new_book" as NotificationType,
    title: `New book tagged "${tagName}"`,
    message: `"${bookTitle}" was tagged with "${tagName}"`,
    link: `/books/${bookId}`,
    metadata: { tag_id: tagId, book_id: bookId },
  }));

  const { error: insertError } = await supabase
    .from("notifications")
    .insert(notifications);

  if (insertError) {
    console.error("Failed to create tag follower notifications:", insertError);
  }
}

export async function notifyProposalReviewed({
  supabase,
  userId,
  proposalType,
  proposalName,
  status,
  link,
  proposalId,
}: {
  supabase: SupabaseClient;
  userId: string;
  proposalType: "book" | "tag";
  proposalName: string;
  status: "approved" | "rejected";
  link?: string;
  proposalId: string;
}): Promise<void> {
  const type: NotificationType = 
    proposalType === "book" 
      ? status === "approved" ? "book_proposal_approved" : "book_proposal_rejected"
      : status === "approved" ? "tag_proposal_approved" : "tag_proposal_rejected";

  const statusText = status === "approved" ? "approved" : "rejected";
  
  await createNotification({
    supabase,
    userId,
    type,
    title: `${proposalType === "book" ? "Book" : "Tag"} proposal ${statusText}`,
    message: `Your ${proposalType} proposal "${proposalName}" has been ${statusText}.`,
    link,
    metadata: { proposal_id: proposalId, proposal_type: proposalType },
  });
}
