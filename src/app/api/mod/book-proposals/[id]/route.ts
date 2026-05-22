import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isModerator, logModerationAction } from "@/lib/moderation";
import { notifyProposalReviewed } from "@/lib/notifications";

// Update a book proposal (save, approve, reject)
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
    title,
    description,
    publication_year,
    series_id,
    proposed_series_name,
    series_index,
    moderator_notes,
    authors, // Array of { author_id?, proposed_name? }
    links,   // Array of { label, url }
  } = body;

  const supabase = await createClient();

  // Build update object
  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (publication_year !== undefined) updates.publication_year = publication_year;
  if (series_id !== undefined) updates.series_id = series_id;
  if (proposed_series_name !== undefined) updates.proposed_series_name = proposed_series_name;
  if (series_index !== undefined) updates.series_index = series_index;
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
      .from("book_proposals")
      .update(updates)
      .eq("id", id);

    if (updateError) {
      console.error("Error updating proposal:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  // Update authors if provided
  if (authors !== undefined) {
    // Delete existing authors
    await supabase.from("proposal_authors").delete().eq("proposal_id", id);
    
    // Insert new authors
    if (authors.length > 0) {
      const authorRows = authors.map((a: any, i: number) => ({
        proposal_id: id,
        author_id: a.author_id || null,
        proposed_name: a.proposed_name || null,
        display_order: i,
      }));
      await supabase.from("proposal_authors").insert(authorRows);
    }
  }

  // Update links if provided
  if (links !== undefined) {
    // Delete existing links
    await supabase.from("proposal_links").delete().eq("proposal_id", id);
    
    // Insert new links
    if (links.length > 0) {
      const linkRows = links.map((l: any, i: number) => ({
        proposal_id: id,
        label: l.label,
        url: l.url,
        display_order: i,
      }));
      await supabase.from("proposal_links").insert(linkRows);
    }
  }

  // Log the action
  await logModerationAction(
    userId,
    action || "save",
    "book_proposal",
    id,
    updates,
    moderator_notes
  );

  // If approved, create the actual book
  if (action === "approve") {
    // Get proposal info for notification
    const { data: proposalInfo } = await supabase
      .from("book_proposals")
      .select("submitted_by, title")
      .eq("id", id)
      .single();

    const result = await createBookFromProposal(supabase, id);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Notify the submitter
    if (proposalInfo?.submitted_by) {
      notifyProposalReviewed({
        supabase,
        userId: proposalInfo.submitted_by,
        proposalType: "book",
        proposalName: proposalInfo.title,
        status: "approved",
        link: `/books/${result.bookId}`,
        proposalId: id,
      });
    }

    return NextResponse.json({ success: true, bookId: result.bookId });
  }

  // If rejected, notify the submitter
  if (action === "reject") {
    const { data: proposalInfo } = await supabase
      .from("book_proposals")
      .select("submitted_by, title")
      .eq("id", id)
      .single();

    if (proposalInfo?.submitted_by) {
      notifyProposalReviewed({
        supabase,
        userId: proposalInfo.submitted_by,
        proposalType: "book",
        proposalName: proposalInfo.title,
        status: "rejected",
        proposalId: id,
      });
    }
  }

  return NextResponse.json({ success: true });
}

async function createBookFromProposal(supabase: any, proposalId: string) {
  // Fetch the proposal with authors and links
  const { data: proposal, error: fetchError } = await supabase
    .from("book_proposals")
    .select(`
      title,
      description,
      publication_year,
      series_id,
      proposed_series_name,
      series_index,
      proposal_authors(author_id, proposed_name, display_order),
      proposal_links(label, url, display_order)
    `)
    .eq("id", proposalId)
    .single();

  if (fetchError || !proposal) {
    return { success: false, error: "Proposal not found" };
  }

  // Handle series - create if proposed_series_name exists and series_id is null
  let seriesId = proposal.series_id;
  if (!seriesId && proposal.proposed_series_name) {
    const { data: newSeries, error: seriesError } = await supabase
      .from("series")
      .insert({ name: proposal.proposed_series_name })
      .select("id")
      .single();
    
    if (seriesError) {
      console.error("Error creating series:", seriesError);
    } else {
      seriesId = newSeries.id;
    }
  }

  // Create the book
  const { data: book, error: bookError } = await supabase
    .from("books")
    .insert({
      title: proposal.title,
      description: proposal.description,
      publication_year: proposal.publication_year,
      series_id: seriesId,
      series_index: proposal.series_index,
    })
    .select("id")
    .single();

  if (bookError || !book) {
    console.error("Error creating book:", bookError);
    return { success: false, error: "Failed to create book" };
  }

  // Handle authors - create new ones if needed
  for (const author of proposal.proposal_authors || []) {
    let authorId = author.author_id;
    
    if (!authorId && author.proposed_name) {
      // Create new author
      const { data: newAuthor, error: authorError } = await supabase
        .from("authors")
        .insert({ name: author.proposed_name })
        .select("id")
        .single();
      
      if (authorError) {
        console.error("Error creating author:", authorError);
        continue;
      }
      authorId = newAuthor.id;
    }

    if (authorId) {
      // Link author to book
      await supabase.from("book_authors").insert({
        book_id: book.id,
        author_id: authorId,
        display_order: author.display_order,
      });
    }
  }

  // Create book links
  for (const link of proposal.proposal_links || []) {
    await supabase.from("book_links").insert({
      book_id: book.id,
      label: link.label,
      url: link.url,
      display_order: link.display_order,
    });
  }

  return { success: true, bookId: book.id };
}
