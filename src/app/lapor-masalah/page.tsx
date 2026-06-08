import { redirect } from "next/navigation";
import { ReportForm } from "@/components/reports/report-form";
import { createClient } from "@/lib/supabase/server";
import type { OptionRow } from "@/types/app";

export default async function LaporMasalahPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const [{ data: categories }, { data: rooms }] = await Promise.all([
    supabase.from("categories").select("id,name,slug").order("name", { ascending: true }),
    supabase.from("rooms").select("id,name,slug").order("name", { ascending: true })
  ]);

  return (
    <section>
      <h1 className="page-title">Lapor Masalah</h1>
      <ReportForm categories={(categories ?? []) as OptionRow[]} rooms={(rooms ?? []) as OptionRow[]} />
    </section>
  );
}
