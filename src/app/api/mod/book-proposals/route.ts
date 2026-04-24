import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isModerator } from "@/lib/moderation";

export async function GET(req: NextRequest) {
  const { isMod } = await isModerator();
  if (!isMod) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "pending";

  const { data: proposals, error } = await supabase
    .from("book_proposals")
    .select(`
      id,
      title,
      description,
      publication_year,
      series_id,
      proposed_series_name,
      series_index,
      status,
      moderator_notes,
      created_at,
      reviewed_at,
      submitted_by,
      reviewed_by,
      profiles:submitted_by(username),
      series:series_id(name),
      proposal_authors(id, author_id, proposed_name, display_order, authors:author_id(id, name)),
      proposal_links(id, label, url, display_order)
    `)
    .eq("status", status)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching book proposals:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Transform the data for easier consumption
  const transformed = (proposals || []).map((p: any) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    publication_year: p.publication_year,
    series_id: p.series_id,
    series_name: p.series?.name || null,
    proposed_series_name: p.proposed_series_name,
    series_index: p.series_index,
    status: p.status,
    moderator_notes: p.moderator_notes,
    created_at: p.created_at,
    reviewed_at: p.reviewed_at,
    submitted_by: p.submitted_by,
    submitted_by_username: p.profiles?.username || "Unknown",
    authors: (p.proposal_authors || [])
      .sort((a: any, b: any) => a.display_order - b.display_order)
      .map((a: any) => ({
        id: a.id,
        author_id: a.author_id,
        author_name: a.authors?.name || null,
        proposed_name: a.proposed_name,
      })),
    links: (p.proposal_links || [])
      .sort((a: any, b: any) => a.display_order - b.display_order)
      .map((l: any) => ({
        id: l.id,
        label: l.label,
        url: l.url,
      })),
  }));

  return NextResponse.json({ proposals: transformed });
}
