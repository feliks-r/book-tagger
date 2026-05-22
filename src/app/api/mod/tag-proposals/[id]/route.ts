import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isModerator, logModerationAction } from "@/lib/moderation";
import { notifyProposalReviewed } from "@/lib/notifications";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isMod, userId } = await isModerator();
  if (!isMod || !userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const {
    action, // 'save' | 'approve' | 'reject'
    name,
    description,
    category_id,
    moderator_notes,
  } = body;

  const supabase = await createClient();

  // Build update object
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (category_id !== undefined) updates.category_id = category_id;
  if (moderator_notes !== undefined) updates.moderator_notes = moderator_notes;

  // Handle status changes
  if (action === "approve") {
    updates.status = "approved";
    updates.reviewed_by = userId;
    updates.reviewed_at = new Date().toISOString();
  } else if (action === "reject") {
    updates.status = "rejected";
    updates.reviewed_by = userId;
    updates.reviewed_at = new Date().toISOString();
  }

  // Update the proposal
  if (Object.keys(updates).length > 0) {
    const { error: updateError } = await supabase
      .from("tag_proposals")
      .update(updates)
      .eq("id", id);

    if (updateError) {
      console.error("Error updating tag proposal:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  // Log the action
  await logModerationAction(
    userId,
    action || "save",
    "tag_proposal",
    id,
    updates,
    moderator_notes
  );

  // If approved, create the actual tag
  if (action === "approve") {
    // Get proposal info for notification
    const { data: proposalInfo } = await supabase
      .from("tag_proposals")
      .select("user_id, name")
      .eq("id", id)
      .single();

    const result = await createTagFromProposal(supabase, id);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Notify the submitter
    if (proposalInfo?.user_id) {
      notifyProposalReviewed({
        supabase,
        userId: proposalInfo.user_id,
        proposalType: "tag",
        proposalName: proposalInfo.name,
        status: "approved",
        link: `/tags/${result.tagId}`,
        proposalId: id,
      });
    }

    return NextResponse.json({ success: true, tagId: result.tagId });
  }

  // If rejected, notify the submitter
  if (action === "reject") {
    const { data: proposalInfo } = await supabase
      .from("tag_proposals")
      .select("user_id, name")
      .eq("id", id)
      .single();

    if (proposalInfo?.user_id) {
      notifyProposalReviewed({
        supabase,
        userId: proposalInfo.user_id,
        proposalType: "tag",
        proposalName: proposalInfo.name,
        status: "rejected",
        proposalId: id,
      });
    }
  }

  return NextResponse.json({ success: true });
}

async function createTagFromProposal(supabase: any, proposalId: string) {
  // Fetch the proposal
  const { data: proposal, error: fetchError } = await supabase
    .from("tag_proposals")
    .select("name, description, category_id")
    .eq("id", proposalId)
    .single();

  if (fetchError || !proposal) {
    return { success: false, error: "Proposal not found" };
  }

  // Check if tag with this name already exists
  const { data: existing } = await supabase
    .from("tags")
    .select("id")
    .eq("name", proposal.name)
    .single();

  if (existing) {
    return { success: false, error: "Tag with this name already exists" };
  }

  // Create the tag
  const { data: tag, error: tagError } = await supabase
    .from("tags")
    .insert({
      name: proposal.name,
      description: proposal.description,
      category_id: proposal.category_id,
    })
    .select("id")
    .single();

  if (tagError || !tag) {
    console.error("Error creating tag:", tagError);
    return { success: false, error: "Failed to create tag" };
  }

  return { success: true, tagId: tag.id };
}
