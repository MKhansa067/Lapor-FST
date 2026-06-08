import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ReportFilter } from "@/components/reports/report-filter";
import { ReportListItem } from "@/components/reports/report-list-item";
import { createClient } from "@/lib/supabase/server";
import type { OptionRow, ReportListRow } from "@/types/app";

const VIEW_TITLES: Record<string, string> = {
  terbaru: "Laporan Terbaru",
  terbuka: "Laporan Terbuka",
  diproses: "Laporan Di Proses",
  selesai: "Laporan Selesai",
  laporanku: "Laporanku"
};

const VIEW_STATUS: Record<string, string | null> = {
  terbaru: null,
  terbuka: "open",
  diproses: "on_progress",
  selesai: "closed",
  laporanku: null
};

type PageProps = {
  params: Promise<{ view: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function single(value: string | string[] | undefined, fallback = "") {
  return Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;
}

export default async function ReportListPage({ params, searchParams }: PageProps) {
  const { view } = await params;
  const queryParams = (await searchParams) ?? {};

  if (!VIEW_TITLES[view]) {
    notFound();
  }

  const page = Number(single(queryParams.page, "1"));
  const offset = Math.max(0, page - 1) * 30;
  const search = single(queryParams.q).trim();
  const category = single(queryParams.category);
  const sort = single(queryParams.sort, "created_at");
  const order = single(queryParams.order, "desc") === "asc" ? "asc" : "desc";

  const supabase = await createClient();

  const { data: categoriesData } = await supabase
    .from("categories")
    .select("id,name,slug")
    .order("name", { ascending: true });

  const categories = (categoriesData ?? []) as OptionRow[];

  let reportQuery = supabase
    .from("report_list_view")
    .select("*")
    .range(offset, offset + 29);

  const status = VIEW_STATUS[view];
  if (status) {
    reportQuery = reportQuery.eq("status", status);
  }

  if (view === "laporanku") {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      redirect("/login");
    }
    reportQuery = reportQuery.eq("author_id", userData.user.id);
  }

  if (search) {
    reportQuery = reportQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (category) {
    reportQuery = reportQuery.eq("category_id", category);
  }

  const safeSort = ["created_at", "updated_at", "reviewed_at", "title", "vote_count", "comment_count"].includes(sort)
    ? sort
    : "created_at";

  const { data, error } = await reportQuery.order(safeSort, { ascending: order === "asc", nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  const reports = (data ?? []) as ReportListRow[];
  const nextParams = new URLSearchParams();

  for (const [key, value] of Object.entries(queryParams)) {
    if (typeof value === "string" && key !== "page") {
      nextParams.set(key, value);
    }
  }

  nextParams.set("page", String(page + 1));

  return (
    <section>
      <h1 className="page-title">{VIEW_TITLES[view]}</h1>
      <ReportFilter
        categories={categories}
        defaultSearch={search}
        defaultCategory={category}
        defaultSort={safeSort}
        defaultOrder={order}
      />

      <div className="report-list">
        {reports.length > 0 ? (
          reports.map((report) => <ReportListItem key={report.id} report={report} />)
        ) : (
          <div className="card">Belum ada laporan.</div>
        )}
      </div>

      {reports.length === 30 ? (
        <div className="pagination">
          <Link className="btn" href={`/laporan/${view}?${nextParams.toString()}`}>
            Next
          </Link>
        </div>
      ) : null}
    </section>
  );
}
