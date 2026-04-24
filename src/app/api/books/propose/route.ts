import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const {
    title,
    description,
    publication_year,
    series_id,
    proposed_series_name,
    series_index,
    authors,
    links,
  } = body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  if (!authors || !Array.isArray(authors) || authors.length === 0) {
    return NextResponse.json(
      { error: "At least one author is required" },
      { status: 400 }
    );
  }

  // Insert the proposal
  const { data: proposal, error: proposalError } = await supabase
    .from("book_proposals")
    .insert({
      submitted_by: user.id,
      title: title.trim(),
      description: description?.trim() || null,
      publication_year: publication_year || null,
      series_id: series_id || null,
      proposed_series_name: proposed_series_name?.trim() || null,
      series_index: series_index || null,
      status: "pending",
    })
    .select("id")
    .single<{ id: string }>();

  if (proposalError || !proposal) {
    console.error("Proposal insert error:", proposalError);
    return NextResponse.json(
      { error: "Failed to create proposal" },
      { status: 500 }
    );
  }

  // Insert authors
  const authorRows = authors.map(
    (a: { author_id?: string; proposed_name?: string }, i: number) => ({
      proposal_id: proposal.id,
      author_id: a.author_id || null,
      proposed_name: a.proposed_name?.trim() || null,
      display_order: i,
    })
  );

  const { error: authorsError } = await supabase
    .from("proposal_authors")
    .insert(authorRows);

  if (authorsError) {
    console.error("Proposal authors insert error:", authorsError);
    // Clean up the proposal if authors fail
    await supabase.from("book_proposals").delete().eq("id", proposal.id);
    return NextResponse.json(
      { error: "Failed to save authors" },
      { status: 500 }
    );
  }

  // Insert links (if any)
  if (links && Array.isArray(links) && links.length > 0) {
    const validLinks = links.filter(
      (l: { label: string; url: string }) => l.label?.trim() && l.url?.trim()
    );

    if (validLinks.length > 0) {
      const linkRows = validLinks.map(
        (l: { label: string; url: string }, i: number) => ({
          proposal_id: proposal.id,
          label: l.label.trim(),
          url: l.url.trim(),
          display_order: i,
        })
      );

      const { error: linksError } = await supabase
        .from("proposal_links")
        .insert(linkRows);

      if (linksError) {
        console.error("Proposal links insert error:", linksError);
        // Non-fatal: proposal still saved, just links failed
      }
    }
  }

  return NextResponse.json({ success: true, proposalId: proposal.id });
}
