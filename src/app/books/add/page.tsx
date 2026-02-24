"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, AlertTriangle, Check, Loader2 } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────

type AuthorEntry = { id?: string; name: string }; // id present = existing
type SeriesEntry = { id?: string; name: string } | null;
type LinkEntry = { label: string; url: string };

// ─── Debounced search hook ───────────────────────────────────

function useDebouncedSearch<T>(
  endpoint: string,
  delay = 300
): { query: string; setQuery: (v: string) => void; results: T[]; isLoading: boolean; clear: () => void } {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${endpoint}?q=${encodeURIComponent(query.trim())}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setResults(data.results ?? data.books ?? data.authors ?? data.series ?? []);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, delay);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, endpoint, delay]);

  const clear = useCallback(() => { setQuery(""); setResults([]); }, []);
  return { query, setQuery, results, isLoading, clear };
}

// ─── AutocompleteInput ───────────────────────────────────────

function AutocompleteInput<T extends { id: string; name: string }>({
  endpoint,
  placeholder,
  value,
  onSelect,
  onCustom,
  renderItem,
}: {
  endpoint: string;
  placeholder: string;
  value: string;
  onSelect: (item: T) => void;
  onCustom: (name: string) => void;
  renderItem?: (item: T) => React.ReactNode;
}) {
  const { query, setQuery, results, isLoading, clear } = useDebouncedSearch<T>(endpoint);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value, setQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onCustom(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && query.trim().length >= 2 && (
        <div className="absolute z-20 mt-1 w-full rounded border bg-background shadow max-h-48 overflow-y-auto">
          {isLoading && <div className="px-3 py-2 text-sm text-muted-foreground">Searching...</div>}
          {!isLoading && results.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No matches found. Click Add to continue with a new author.
            </div>
          )}
          {!isLoading &&
            results.map((item) => (
              <div
                key={item.id}
                className="cursor-pointer px-3 py-2 hover:bg-secondary text-sm"
                onClick={() => {
                  onSelect(item);
                  setQuery(item.name);
                  setOpen(false);
                }}
              >
                {renderItem ? renderItem(item) : item.name}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// ─── Title check for duplicates ──────────────────────────────

function TitleInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [duplicates, setDuplicates] = useState<{ id: string; title: string }[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (value.trim().length < 3) {
      setDuplicates([]);
      return;
    }
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/books/search?q=${encodeURIComponent(value.trim())}`);
        if (!res.ok) return;
        const data = await res.json();
        setDuplicates(
          (data.books || [])
            .filter((b: any) => b.title.toLowerCase() === value.trim().toLowerCase())
            .slice(0, 3)
        );
      } catch {
        /* ignore */
      }
    }, 500);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [value]);

  return (
    <div>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Book title *"
        autoComplete="off"
        required
      />
      {duplicates.length > 0 && (
        <div className="flex items-start gap-2 mt-2 p-2 rounded bg-destructive/10 text-destructive-foreground text-sm">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-destructive-foreground" />
          <div>
            <p className="font-medium">A book with this title may already exist:</p>
            {duplicates.map((b) => (
              <a
                key={b.id}
                href={`/books/${b.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-primary hover:underline"
              >
                {b.title}
              </a>
            ))}
            <p className="text-muted-foreground mt-1">Please verify before submitting.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Form ───────────────────────────────────────────────

export default function AddBookPage() {
  const { user } = useAuth();

  // Form state
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState<AuthorEntry[]>([]);
  const [authorInput, setAuthorInput] = useState("");
  const [series, setSeries] = useState<SeriesEntry>(null);
  const [seriesIndex, setSeriesIndex] = useState("");
  const [publicationYear, setPublicationYear] = useState("");
  const [description, setDescription] = useState("");
  const [links, setLinks] = useState<LinkEntry[]>([]);
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-muted-foreground">
        Please log in to suggest a book.
      </div>
    );
  }

  function addAuthor(entry: AuthorEntry) {
    if (!entry.name.trim()) return;
    // Avoid duplicates
    if (authors.some((a) => a.name.toLowerCase() === entry.name.trim().toLowerCase())) return;
    setAuthors((prev) => [...prev, { id: entry.id, name: entry.name.trim() }]);
    setAuthorInput("");
  }

  function removeAuthor(index: number) {
    setAuthors((prev) => prev.filter((_, i) => i !== index));
  }

  function addLink() {
    if (!linkLabel.trim() || !linkUrl.trim()) return;
    setLinks((prev) => [...prev, { label: linkLabel.trim(), url: linkUrl.trim() }]);
    setLinkLabel("");
    setLinkUrl("");
  }

  function removeLink(index: number) {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  }

  function resetForm() {
    setTitle("");
    setAuthors([]);
    setAuthorInput("");
    setSeries(null);
    setSeriesIndex("");
    setPublicationYear("");
    setDescription("");
    setLinks([]);
    setLinkLabel("");
    setLinkUrl("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || authors.length === 0) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/books/propose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          publication_year: publicationYear ? parseInt(publicationYear) : null,
          series_id: series?.id || null,
          proposed_series_name: series && !series.id ? series.name : null,
          series_index: seriesIndex ? parseFloat(seriesIndex) : null,
          authors: authors.map((a) => ({ author_id: a.id || null, proposed_name: a.id ? null : a.name })),
          links: links.filter((l) => l.label && l.url),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit");
      }

      resetForm();
      setMessage({ type: "success", text: "Your book suggestion has been submitted. You will be notified once it is reviewed by a moderator." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setMessage({ type: "error", text: msg });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-1">Suggest a Book</h1>
      <p className="text-muted-foreground mb-6">
        Submit a book to be reviewed and added to the database.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">Title <span className="text-destructive-foreground">*</span></label>
          <TitleInput value={title} onChange={setTitle} />
        </div>

        {/* Authors */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">
            Authors <span className="text-destructive-foreground">*</span>
          </label>

          {authors.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {authors.map((a, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm ${
                    a.id
                      ? "bg-primary/10 text-primary"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {a.name}
                  {!a.id && <span className="text-muted-foreground text-xs">(new)</span>}
                  <button type="button" onClick={() => removeAuthor(i)} className="hover:text-destructive-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <div className="flex-1">
              <AutocompleteInput<{ id: string; name: string }>
                endpoint="/api/authors/search"
                placeholder="Search or type a new author..."
                value={authorInput}
                onSelect={(item) => {
                  addAuthor({ id: item.id, name: item.name });
                }}
                onCustom={(val) => setAuthorInput(val)}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => {
                if (authorInput.trim()) {
                  addAuthor({ name: authorInput.trim() });
                }
              }}
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Select an existing author from the list or type a new name and click Add.
          </p>
        </div>

        {/* Series */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">Series</label>
          <div className="flex gap-2">
            <div className="flex-1">
              <AutocompleteInput<{ id: string; name: string }>
                endpoint="/api/series/search"
                placeholder="Search or type a new series..."
                value={series?.name || ""}
                onSelect={(item) => setSeries({ id: item.id, name: item.name })}
                onCustom={(val) => {
                  if (val.trim()) {
                    setSeries({ name: val.trim() });
                  } else {
                    setSeries(null);
                  }
                }}
              />
            </div>
            <div className="w-24">
              <Input
                type="number"
                step="0.1"
                min="0"
                placeholder="#"
                value={seriesIndex}
                onChange={(e) => setSeriesIndex(e.target.value)}
              />
            </div>
          </div>
          {series && !series.id && series.name && (
            <p className="text-xs text-muted-foreground mt-1">
              This will create a new series: <span className="font-medium">{series.name}</span>
            </p>
          )}
        </div>

        {/* Publication year */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">Publication Year</label>
          <Input
            type="number"
            min="0"
            max={new Date().getFullYear() + 5}
            placeholder="e.g. 2024"
            value={publicationYear}
            onChange={(e) => setPublicationYear(e.target.value)}
            className="w-32"
          />
        </div>

        {/* Description */}
        {/* <div>
          <label className="text-sm font-medium mb-1.5 block">Description</label>
          <textarea
            className="w-full min-h-25 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none resize-y"
            placeholder="Brief description of the book..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div> */}

        {/* Links */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">Links</label>

          {links.length > 0 && (
            <div className="space-y-1.5 mb-2">
              {links.map((link, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{link.label}:</span>
                  <span className="text-muted-foreground truncate flex-1">{link.url}</span>
                  <button type="button" onClick={() => removeLink(i)} className="text-muted-foreground hover:text-destructive-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="Label (e.g. Goodreads)"
              value={linkLabel}
              onChange={(e) => setLinkLabel(e.target.value)}
              className="w-40"
            />
            <Input
              placeholder="URL"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="flex-1"
            />
            <Button type="button" variant="outline" size="default" onClick={addLink}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            An Open Library link is especially helpful as that is the source of covers and descriptions.
          </p>
        </div>

        {message && (
        <div
          className={`flex items-center gap-2 p-3 rounded mb-6 text-sm ${
            message.type === "success"
              ? "bg-positive/20 text-positive-foreground"
              : "bg-destructive/10 text-destructive-foreground"
          }`}
        >
          {message.type === "success" ? <Check className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
          {message.text}
        </div>
      )}

        {/* Submit */}
        <div className="flex items-center gap-4 pt-2">
          <Button type="submit" disabled={submitting || !title.trim() || authors.length === 0}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit"
            )}
          </Button>
          {!title.trim() && <p className="text-sm text-muted-foreground">Title is required</p>}
          {title.trim() && authors.length === 0 && (
            <p className="text-sm text-muted-foreground">At least one author is required</p>
          )}
        </div>
      </form>
    </div>
  );
}
