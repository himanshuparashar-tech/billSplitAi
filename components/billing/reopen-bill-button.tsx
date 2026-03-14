"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/shared/button";
import { useToast } from "@/components/shared/toast-provider";

export function ReopenBillButton({ billId, disabled }: { billId: string; disabled: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const response = await fetch(`/api/bills/${billId}/reopen`, { method: "POST" });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error ?? "Unable to reopen bill.");
      }
      toast("Data updated: month reopened.");
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Unable to reopen bill.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="secondary" onClick={handleClick} disabled={disabled || loading}>
      {loading ? "Reopening..." : "Reopen month"}
    </Button>
  );
}
