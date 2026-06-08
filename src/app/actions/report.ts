"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ReportStatus } from "@/types/app";

export async function markReportClosed(reportId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("reports")
    .update({ status: "closed" satisfies ReportStatus })
    .eq("id", reportId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/laporan/detail/${reportId}`);
}

export async function updateReportStatus(formData: FormData) {
  const reportId = String(formData.get("reportId") ?? "");
  const status = String(formData.get("status") ?? "") as ReportStatus;

  if (!reportId || !["open", "on_progress", "closed", "duplicate"].includes(status)) {
    throw new Error("Data status tidak valid.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("reports").update({ status }).eq("id", reportId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/laporan/detail/${reportId}`);
  redirect(`/laporan/detail/${reportId}`);
}
