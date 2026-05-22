"use client";

import { useState, useRef } from "react";
import { GripVertical, Pencil, Trash2, Plus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Bookshelf } from "@/types";

type EditableShelf = {
  id?: string; // undefined for newly created shelves
  name: string;
  isNew?: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shelves: Bookshelf[];
  onSave: (shelves: Bookshelf[]) => void;
};

export default function EditShelvesModal({
  open,
  onOpenChange,
  shelves,
  onSave,
}: Props) {
  const [editableShelves, setEditableShelves] = useState<EditableShelf[]>(() =>
    shelves.map((s) => ({ id: s.id, name: s.name }))
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [newShelfName, setNewShelfName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const dragIndex = useRef<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);

  // Reset state when dialog opens
  function handleOpenChange(isOpen: boolean) {
    if (isOpen) {
      setEditableShelves(shelves.map((s) => ({ id: s.id, name: s.name })));
      setEditingIndex(null);
      setNewShelfName("");
      setError("");
    }
    onOpenChange(isOpen);
  }

  // Drag and drop handlers
  function handleDragStart(index: number) {
    dragIndex.current = index;
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    dragOverIndex.current = index;
  }

  function handleDrop() {
    if (dragIndex.current === null || dragOverIndex.current === null) return;
    if (dragIndex.current === dragOverIndex.current) return;

    const updated = [...editableShelves];
    const [dragged] = updated.splice(dragIndex.current, 1);
    updated.splice(dragOverIndex.current, 0, dragged);
    setEditableShelves(updated);

    dragIndex.current = null;
    dragOverIndex.current = null;
  }

  function handleDragEnd() {
    dragIndex.current = null;
    dragOverIndex.current = null;
  }

  // Rename handlers
  function startEditing(index: number) {
    setEditingIndex(index);
    setEditingName(editableShelves[index].name);
  }

  function confirmRename() {
    if (editingIndex === null) return;
    const trimmed = editingName.trim();
    if (!trimmed) return;

    // Check for duplicate names
    const duplicate = editableShelves.some(
      (s, i) => i !== editingIndex && s.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      setError("Shelf names must be unique");
      return;
    }

    setEditableShelves((prev) =>
      prev.map((s, i) => (i === editingIndex ? { ...s, name: trimmed } : s))
    );
    setEditingIndex(null);
    setEditingName("");
    setError("");
  }

  function cancelRename() {
    setEditingIndex(null);
    setEditingName("");
    setError("");
  }

  // Delete handler
  function handleDelete(index: number) {
    if (editableShelves.length <= 1) {
      setError("You must have at least one bookshelf");
      return;
    }
    setEditableShelves((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditingName("");
    }
    setError("");
  }

  // Add handler
  function handleAddShelf() {
    const trimmed = newShelfName.trim();
    if (!trimmed) return;

    const duplicate = editableShelves.some(
      (s) => s.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      setError("Shelf names must be unique");
      return;
    }

    setEditableShelves((prev) => [...prev, { name: trimmed, isNew: true }]);
    setNewShelfName("");
    setError("");
  }

  // Save handler
  async function handleSave() {
    setIsSaving(true);
    setError("");

    try {
      const res = await fetch("/api/bookshelves/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shelves: editableShelves.map((s) => ({
            id: s.isNew ? undefined : s.id,
            name: s.name,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      const data = await res.json();
      onSave(data.shelves);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Bookshelves</DialogTitle>
          <DialogDescription>
            Drag to reorder, rename, or delete your bookshelves.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1 max-h-64 overflow-y-auto py-2">
          {editableShelves.map((shelf, index) => (
            <div
              key={shelf.id ?? `new-${index}`}
              draggable={editingIndex !== index}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              className="flex items-center gap-2 rounded-md border bg-card p-2 cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="size-4 text-muted-foreground shrink-0" />

              {editingIndex === index ? (
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") confirmRename();
                      if (e.key === "Escape") cancelRename();
                    }}
                    className="h-7 text-sm"
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0"
                    onClick={confirmRename}
                  >
                    <Check className="size-3.5" />
                    <span className="sr-only">Confirm rename</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0"
                    onClick={cancelRename}
                  >
                    <X className="size-3.5" />
                    <span className="sr-only">Cancel rename</span>
                  </Button>
                </div>
              ) : (
                <>
                  <span className="flex-1 text-sm text-foreground truncate">
                    {shelf.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0"
                    onClick={() => startEditing(index)}
                  >
                    <Pencil className="size-3.5" />
                    <span className="sr-only">Rename shelf</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 text-destructive-foreground hover:text-destructive-foreground"
                    onClick={() => handleDelete(index)}
                    disabled={editableShelves.length <= 1}
                  >
                    <Trash2 className="size-3.5" />
                    <span className="sr-only">Delete shelf</span>
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Add new shelf */}
        <div className="flex items-center gap-2">
          <Input
            value={newShelfName}
            onChange={(e) => setNewShelfName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddShelf();
            }}
            placeholder="New shelf name..."
            className="flex-1"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleAddShelf}
            disabled={!newShelfName.trim()}
          >
            <Plus className="size-4" />
            <span className="sr-only">Add shelf</span>
          </Button>
        </div>

        {error && (
          <p className="text-sm text-destructive-foreground">{error}</p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
