import Link from "next/link";
import { REPORT_STATUS_CLASS, REPORT_STATUS_LABEL } from "@/lib/constants";
import type { ReportListRow } from "@/types/app";
import { ReportQuickActions } from "./report-quick-actions";
import { formatWibDate } from "@/lib/date";

function shortText(value: string, max = 180) {
  return value.length > max ? `${value.slice(0, max).trim()}...` : value;
}

export function ReportListItem({ report }: { report: ReportListRow }) {
  return (
    <article className="report-item">
      <Link href={`/laporan/detail/${report.id}`}>
        <div className="report-head">
          <span className={REPORT_STATUS_CLASS[report.status]}>
            {REPORT_STATUS_LABEL[report.status]}
          </span>
          <span className="report-title">{report.title}</span>
        </div>
        <p className="report-desc">{shortText(report.description)}</p>
      </Link>

      <div className="report-meta">
        <span>{formatWibDate(report.created_at)}</span>
        <span>{report.category_name ?? "Tanpa kategori"}</span>
        <span>{report.room_other ?? report.room_name ?? "Tanpa ruangan"}</span>
        <ReportQuickActions
          reportId={report.id}
          voteCount={report.vote_count}
          commentCount={report.comment_count}
        />
      </div>
    </article>
  );
}
