import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReportListItem } from "@/components/reports/report-list-item";
import type { ReportListRow } from "@/types/app";

export default async function BookmarksPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const { data: bookmarks } = await supabase
    .from("bookmarks")
    .select("report_id")
    .eq("user_id", userData.user.id);

  const ids = (bookmarks ?? []).map((bookmark) => bookmark.report_id);

  const { data: reports } = ids.length
    ? await supabase.from("report_list_view").select("*").in("id", ids)
    : { data: [] };

  return (
    <section>
      <h1 className="page-title">Bookmarks</h1>
      <div className="report-list">
        {(reports ?? []).length > 0 ? (
          (reports as ReportListRow[]).map((report) => <ReportListItem key={report.id} report={report} />)
        ) : (
          <div className="card">Belum ada bookmark.</div>
        )}
      </div>
    </section>
  );
}
