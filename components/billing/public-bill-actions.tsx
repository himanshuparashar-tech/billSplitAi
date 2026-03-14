"use client";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Copy, Download, MessageCircle } from "lucide-react";

import { Button } from "@/components/shared/button";
import { useToast } from "@/components/shared/toast-provider";
import type { BillSnapshot } from "@/types";

export function PublicBillActions({ bill, targetId }: { bill: BillSnapshot; targetId: string }) {
  const { toast } = useToast();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast("Public bill link copied.");
    } catch {
      toast("Unable to copy the public link.", "error");
    }
  }

  function handleWhatsApp() {
    const text = encodeURIComponent(
      `SplitBill AI invoice for ${bill.house.name} (${bill.billing_month}). View bill: ${window.location.href}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }

  async function handlePdf() {
    const target = document.getElementById(targetId);
    if (!target) return;

    const canvas = await html2canvas(target, { scale: 2, backgroundColor: "#ffffff" });
    const image = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const ratio = canvas.height / canvas.width;
    const width = pageWidth - 20;
    const height = width * ratio;

    pdf.addImage(image, "PNG", 10, 10, width, height);
    pdf.save(`${bill.house.name}-${bill.billing_month}-invoice.pdf`);
    toast("Export completed: PDF downloaded.");
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <Button variant="secondary" onClick={handleCopy}>
        <Copy className="mr-2 h-4 w-4" />
        Copy link
      </Button>
      <Button variant="secondary" onClick={handleWhatsApp}>
        <MessageCircle className="mr-2 h-4 w-4" />
        Share to WhatsApp
      </Button>
      <Button onClick={handlePdf}>
        <Download className="mr-2 h-4 w-4" />
        Download PDF
      </Button>
    </div>
  );
}

