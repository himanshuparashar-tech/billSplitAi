"use client";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

import { Button } from "@/components/shared/button";
import { useToast } from "@/components/shared/toast-provider";
import type { BillSnapshot } from "@/types";

export function ExportButtons({ bill, targetId }: { bill: BillSnapshot; targetId: string }) {
  const { toast } = useToast();

  async function handlePdf() {
    const target = document.getElementById(targetId);
    if (!target) return;

    const canvas = await html2canvas(target, { scale: 2, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const ratio = canvas.height / canvas.width;
    const width = pageWidth - 20;
    const height = width * ratio;

    pdf.addImage(imgData, "PNG", 10, 10, width, height);
    pdf.save(`${bill.house.name}-${bill.billing_month}.pdf`);
    toast("Export completed: PDF downloaded.");
  }

  async function handleJpg() {
    const target = document.getElementById(targetId);
    if (!target) return;

    const canvas = await html2canvas(target, { scale: 2, backgroundColor: "#ffffff" });
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/jpeg", 0.95);
    link.download = `${bill.house.name}-${bill.billing_month}.jpg`;
    link.click();
    toast("Export completed: JPG downloaded.");
  }

  function handleExcel() {
    const rows = bill.results.map((result) => ({
      House: bill.house.name,
      Month: bill.billing_month,
      Member: result.member_name_snapshot,
      "Units Consumed": result.final_units,
      "Bill Amount": result.bill_amount,
      "Price Per Unit": bill.price_per_unit,
      "Total Bill": bill.main_bill_amount
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "SplitBill");
    XLSX.writeFile(workbook, `${bill.house.name}-${bill.billing_month}.xlsx`);
    toast("Export completed: Excel downloaded.");
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap [&_button]:w-full sm:[&_button]:w-auto sm:[&_button]:flex-none">
      <Button variant="secondary" onClick={handlePdf}>Download PDF</Button>
      <Button variant="secondary" onClick={handleExcel}>Download Excel</Button>
      <Button variant="secondary" onClick={handleJpg}>Download JPG</Button>
    </div>
  );
}

