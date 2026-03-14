"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

import { Button } from "@/components/shared/button";
import { useToast } from "@/components/shared/toast-provider";

export function AddMemberForm({ houseId, disabled }: { houseId: string; disabled: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ houseId, name })
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to add room.");
      }

      setName("");
      setMessage("Room added successfully.");
      toast("Data updated: room saved.");
      router.refresh();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Unable to add room.";
      setMessage(text);
      toast(text, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="app-label mb-2 block text-sm font-medium">Room name</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          disabled={disabled || loading}
          placeholder="House 101"
          className="app-input"
        />
      </label>
      {message ? <p className="text-sm text-[color:var(--text-secondary)]">{message}</p> : null}
      <Button type="submit" disabled={disabled || loading || !name.trim()}>
        {loading ? "Saving..." : "Add room"}
      </Button>
    </form>
  );
}
