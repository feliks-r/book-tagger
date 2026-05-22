"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X, Save, ChevronDown, ChevronUp, ExternalLink, Plus, Trash2 } from "lucide-react";

type BookProposal = {
  id: string;
  title: string;
  description: string | null;
  publication_year: number | null;
  series_id: string | null;
  series_name: string | null;
  proposed_series_name: string | null;
  series_index: number | null;
  status: string;
  moderator_notes: string | null;
  created_at: string;
  submitted_by_username: string;
  authors: {
    id: string;
    author_id: string | null;
    author_name: string | null;
    proposed_name: string | null;
  }[];
  links: {
    id: string;
    label: string;
    url: string;
  }[];
};

type TagProposal = {
  id: string;
  name: string;
  description: string | null;
  category_id: string;
  category_name: string;
  status: string;
  moderator_notes: string | null;
  created_at: string;
  submitted_by_username: string;
};

export default function ModPage() {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("books");
  const [statusFilter, setStatusFilter] = useState("pending");

  // Check access
  useEffect(() => {
    if (!loading && (!profile || (profile.role !== "moderator" && profile.role !== "admin"))) {
      router.push("/");
    }
  }, [profile, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-foreground mb-6">Moderation Panel</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="books">Book Proposals</TabsTrigger>
            <TabsTrigger value="tags">Tag Proposals</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm bg-background border border-input rounded-md px-2 py-1"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <TabsContent value="books">
          <BookProposalsList status={statusFilter} />
        </TabsContent>

        <TabsContent value="tags">
          <TagProposalsList status={statusFilter} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BookProposalsList({ status }: { status: string }) {
  const [proposals, setProposals] = useState<BookProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/mod/book-proposals?status=${status}`);
    if (res.ok) {
      const data = await res.json();
      setProposals(data.proposals || []);
    }
    setLoading(false);
  }, [status]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  if (loading) {
    return <div className="text-muted-foreground py-8 text-center">Loading proposals...</div>;
  }

  if (proposals.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center border border-dashed rounded-lg">
        No {status} book proposals found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {proposals.map((proposal) => (
        <BookProposalCard
          key={proposal.id}
          proposal={proposal}
          expanded={expandedId === proposal.id}
          onToggle={() => setExpandedId(expandedId === proposal.id ? null : proposal.id)}
          onUpdate={fetchProposals}
        />
      ))}
    </div>
  );
}

function BookProposalCard({
  proposal,
  expanded,
  onToggle,
  onUpdate,
}: {
  proposal: BookProposal;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(proposal.title);
  const [description, setDescription] = useState(proposal.description || "");
  const [publicationYear, setPublicationYear] = useState(proposal.publication_year?.toString() || "");
  const [seriesName, setSeriesName] = useState(proposal.series_name || proposal.proposed_series_name || "");
  const [seriesIndex, setSeriesIndex] = useState(proposal.series_index?.toString() || "");
  const [moderatorNotes, setModeratorNotes] = useState(proposal.moderator_notes || "");
  const [authors, setAuthors] = useState(
    proposal.authors.map((a) => ({
      author_id: a.author_id,
      name: a.author_name || a.proposed_name || "",
    }))
  );
  const [links, setLinks] = useState(
    proposal.links.map((l) => ({ label: l.label, url: l.url }))
  );

  const handleAction = async (action: "save" | "approve" | "reject") => {
    setSaving(true);

    const body: Record<string, unknown> = {
      action,
      moderator_notes: moderatorNotes || null,
    };

    if (editing || action !== "reject") {
      body.title = title;
      body.description = description || null;
      body.publication_year = publicationYear ? parseInt(publicationYear) : null;
      body.series_index = seriesIndex ? parseFloat(seriesIndex) : null;
      // For series, we keep proposed_series_name if no series_id
      if (!proposal.series_id && seriesName) {
        body.proposed_series_name = seriesName;
      }
      body.authors = authors.map((a) =>
        a.author_id ? { author_id: a.author_id } : { proposed_name: a.name }
      );
      body.links = links.filter((l) => l.label && l.url);
    }

    const res = await fetch(`/api/mod/book-proposals/${proposal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);

    if (res.ok) {
      setEditing(false);
      onUpdate();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to update proposal");
    }
  };

  const addAuthor = () => setAuthors([...authors, { author_id: null, name: "" }]);
  const removeAuthor = (i: number) => setAuthors(authors.filter((_, idx) => idx !== i));
  const updateAuthor = (i: number, name: string) => {
    const updated = [...authors];
    updated[i] = { author_id: null, name };
    setAuthors(updated);
  };

  const addLink = () => setLinks([...links, { label: "", url: "" }]);
  const removeLink = (i: number) => setLinks(links.filter((_, idx) => idx !== i));
  const updateLink = (i: number, field: "label" | "url", value: string) => {
    const updated = [...links];
    updated[i] = { ...updated[i], [field]: value };
    setLinks(updated);
  };

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{proposal.title}</h3>
          <p className="text-sm text-muted-foreground">
            by {proposal.authors.map((a) => a.author_name || a.proposed_name).join(", ")} &middot;
            submitted by {proposal.submitted_by_username} &middot;
            {new Date(proposal.created_at).toLocaleDateString()}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="size-5 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="size-5 text-muted-foreground flex-shrink-0" />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
          {editing ? (
            <>
              {/* Editable fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground">Title</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Publication Year</label>
                  <Input
                    type="number"
                    value={publicationYear}
                    onChange={(e) => setPublicationYear(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Series</label>
                  <Input
                    value={seriesName}
                    onChange={(e) => setSeriesName(e.target.value)}
                    placeholder="Series name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Series Index</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={seriesIndex}
                    onChange={(e) => setSeriesIndex(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
                />
              </div>

              {/* Authors */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">Authors</label>
                  <Button type="button" variant="ghost" size="sm" onClick={addAuthor}>
                    <Plus className="size-4 mr-1" /> Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {authors.map((author, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={author.name}
                        onChange={(e) => updateAuthor(i, e.target.value)}
                        placeholder="Author name"
                        className="flex-1"
                      />
                      {authors.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAuthor(i)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Links */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">Links</label>
                  <Button type="button" variant="ghost" size="sm" onClick={addLink}>
                    <Plus className="size-4 mr-1" /> Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {links.map((link, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={link.label}
                        onChange={(e) => updateLink(i, "label", e.target.value)}
                        placeholder="Label"
                        className="w-32"
                      />
                      <Input
                        value={link.url}
                        onChange={(e) => updateLink(i, "url", e.target.value)}
                        placeholder="URL"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLink(i)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Read-only view */}
              <div className="grid gap-3 sm:grid-cols-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Authors:</span>{" "}
                  {proposal.authors.map((a) => a.author_name || a.proposed_name).join(", ")}
                </div>
                {proposal.publication_year && (
                  <div>
                    <span className="text-muted-foreground">Year:</span> {proposal.publication_year}
                  </div>
                )}
                {(proposal.series_name || proposal.proposed_series_name) && (
                  <div>
                    <span className="text-muted-foreground">Series:</span>{" "}
                    {proposal.series_name || proposal.proposed_series_name}
                    {proposal.series_index != null && ` #${proposal.series_index}`}
                  </div>
                )}
              </div>

              {proposal.description && (
                <div>
                  <span className="text-sm text-muted-foreground">Description:</span>
                  <p className="text-sm text-foreground mt-1">{proposal.description}</p>
                </div>
              )}

              {proposal.links.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">Links:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {proposal.links.map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                      >
                        {link.label} <ExternalLink className="size-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Moderator notes */}
          <div>
            <label className="text-sm font-medium text-foreground">Moderator Notes</label>
            <textarea
              value={moderatorNotes}
              onChange={(e) => setModeratorNotes(e.target.value)}
              rows={2}
              placeholder="Add a note (optional)..."
              className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 flex-wrap">
            {proposal.status === "pending" && (
              <>
                <Button
                  onClick={() => handleAction("approve")}
                  disabled={saving}
                  className="bg-positive text-positive-foreground hover:bg-positive/90"
                >
                  <Check className="size-4 mr-1" /> Approve
                </Button>
                <Button
                  onClick={() => handleAction("reject")}
                  disabled={saving}
                  variant="destructive"
                >
                  <X className="size-4 mr-1" /> Reject
                </Button>
              </>
            )}
            <Button
              onClick={() => handleAction("save")}
              disabled={saving}
              variant="secondary"
            >
              <Save className="size-4 mr-1" /> Save
            </Button>
            {!editing && proposal.status === "pending" && (
              <Button
                onClick={() => setEditing(true)}
                variant="outline"
              >
                Edit
              </Button>
            )}
            {editing && (
              <Button
                onClick={() => setEditing(false)}
                variant="ghost"
              >
                Cancel Edit
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TagProposalsList({ status }: { status: string }) {
  const [proposals, setProposals] = useState<TagProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/mod/tag-proposals?status=${status}`);
    if (res.ok) {
      const data = await res.json();
      setProposals(data.proposals || []);
    }
    setLoading(false);
  }, [status]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  if (loading) {
    return <div className="text-muted-foreground py-8 text-center">Loading proposals...</div>;
  }

  if (proposals.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center border border-dashed rounded-lg">
        No {status} tag proposals found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {proposals.map((proposal) => (
        <TagProposalCard
          key={proposal.id}
          proposal={proposal}
          expanded={expandedId === proposal.id}
          onToggle={() => setExpandedId(expandedId === proposal.id ? null : proposal.id)}
          onUpdate={fetchProposals}
        />
      ))}
    </div>
  );
}

function TagProposalCard({
  proposal,
  expanded,
  onToggle,
  onUpdate,
}: {
  proposal: TagProposal;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(proposal.name);
  const [description, setDescription] = useState(proposal.description || "");
  const [moderatorNotes, setModeratorNotes] = useState(proposal.moderator_notes || "");
  const [editing, setEditing] = useState(false);

  const handleAction = async (action: "save" | "approve" | "reject") => {
    setSaving(true);

    const body: Record<string, unknown> = {
      action,
      moderator_notes: moderatorNotes || null,
    };

    if (editing || action !== "reject") {
      body.name = name;
      body.description = description || null;
    }

    const res = await fetch(`/api/mod/tag-proposals/${proposal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);

    if (res.ok) {
      setEditing(false);
      onUpdate();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to update proposal");
    }
  };

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground">{proposal.name}</h3>
          <p className="text-sm text-muted-foreground">
            Category: {proposal.category_name} &middot;
            submitted by {proposal.submitted_by_username} &middot;
            {new Date(proposal.created_at).toLocaleDateString()}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="size-5 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="size-5 text-muted-foreground flex-shrink-0" />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
          {editing ? (
            <>
              <div>
                <label className="text-sm font-medium text-foreground">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
                />
              </div>
            </>
          ) : (
            <>
              {proposal.description && (
                <div>
                  <span className="text-sm text-muted-foreground">Description:</span>
                  <p className="text-sm text-foreground mt-1">{proposal.description}</p>
                </div>
              )}
            </>
          )}

          {/* Moderator notes */}
          <div>
            <label className="text-sm font-medium text-foreground">Moderator Notes</label>
            <textarea
              value={moderatorNotes}
              onChange={(e) => setModeratorNotes(e.target.value)}
              rows={2}
              placeholder="Add a note (optional)..."
              className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 flex-wrap">
            {proposal.status === "pending" && (
              <>
                <Button
                  onClick={() => handleAction("approve")}
                  disabled={saving}
                  className="bg-positive text-positive-foreground hover:bg-positive/90"
                >
                  <Check className="size-4 mr-1" /> Approve
                </Button>
                <Button
                  onClick={() => handleAction("reject")}
                  disabled={saving}
                  variant="destructive"
                >
                  <X className="size-4 mr-1" /> Reject
                </Button>
              </>
            )}
            <Button
              onClick={() => handleAction("save")}
              disabled={saving}
              variant="secondary"
            >
              <Save className="size-4 mr-1" /> Save
            </Button>
            {!editing && proposal.status === "pending" && (
              <Button
                onClick={() => setEditing(true)}
                variant="outline"
              >
                Edit
              </Button>
            )}
            {editing && (
              <Button
                onClick={() => setEditing(false)}
                variant="ghost"
              >
                Cancel Edit
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
