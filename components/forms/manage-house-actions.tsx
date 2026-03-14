"use client";

import { useRouter } from "next/navigation";
import { Pencil, Trash2, X } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";

import { Button } from "@/components/shared/button";
import { useToast } from "@/components/shared/toast-provider";

export function ManageHouseActions({
  houseId,
  initialName,
  disabled
}: {
  houseId: string;
  initialName: string;
  disabled: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState<false | "save" | "delete">(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setMessage("Enter a house name.");
      toast("Enter a house name.", "error");
      return;
    }

    setLoading("save");
    setMessage(null);

    try {
      const response = await fetch(`/api/houses/${houseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to update house.");
      }

      setMessage("House updated successfully.");
      toast("Data updated: house renamed.");
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Unable to update house.";
      setMessage(text);
      toast(text, "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete ${initialName}? This removes its members, readings, bills, and history.`
    );

    if (!confirmed) {
      return;
    }

    setLoading("delete");
    setMessage(null);

    try {
      const response = await fetch(`/api/houses/${houseId}`, {
        method: "DELETE"
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to delete house.");
      }

      toast("Data updated: house deleted.");
      router.refresh();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Unable to delete house.";
      setMessage(text);
      toast(text, "error");
    } finally {
      setLoading(false);
    }
  }

  if (isEditing) {
    return (
      <form onSubmit={handleSave} className="app-muted-panel space-y-3 rounded-3xl border p-4">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
            Rename house
          </span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={disabled || loading !== false}
            className="app-input"
          />
        </label>
        {message ? <p className="text-sm text-[color:var(--text-secondary)]">{message}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={disabled || loading !== false || !name.trim()}>
            {loading === "save" ? "Saving..." : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={loading !== false}
            onClick={() => {
              setName(initialName);
              setIsEditing(false);
              setMessage(null);
            }}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" disabled={disabled || loading !== false} onClick={() => setIsEditing(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Button>
        <Button type="button" variant="danger" disabled={disabled || loading !== false} onClick={handleDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          {loading === "delete" ? "Deleting..." : "Delete"}
        </Button>
      </div>
      {message ? <p className="text-sm text-[color:var(--text-secondary)]">{message}</p> : null}
    </div>
  );
}
