"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

import { Button } from "@/components/shared/button";
import { useToast } from "@/components/shared/toast-provider";

export function CreateHouseForm({ disabled }: { disabled: boolean }) {
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
      const response = await fetch("/api/houses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to create house.");
      }

      setName("");
      setMessage("House created successfully.");
      toast("Data updated: house created.");
      router.refresh();
      router.push(`/houses/${result.id}`);
    } catch (error) {
      const text = error instanceof Error ? error.message : "Unable to create house.";
      setMessage(text);
      toast(text, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">House name</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          disabled={disabled || loading}
          placeholder="Pitru Chaya"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand"
        />
      </label>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      <Button type="submit" disabled={disabled || loading || !name.trim()}>
        {loading ? "Creating..." : "Create house"}
      </Button>
    </form>
  );
}
