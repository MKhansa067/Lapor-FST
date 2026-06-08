import { REPORT_STATUS_CLASS, REPORT_STATUS_LABEL } from "@/lib/constants";
import type { ReportListRow } from "@/types/app";
import { CommentForm } from "./comment-form";
import { markReportClosed, updateReportStatus } from "@/app/actions/report";

type MediaRow = {
  id: string;
  media_type: "image" | "video";
  storage_bucket: string;
  storage_path: string;
  signedUrl?: string;
};

type CommentRow = {
  id: string;
  body: string;
  created_at: string;
  profiles?: { username: string } | null;
};

type Props = {
  report: ReportListRow;
  media: MediaRow[];
  comments: CommentRow[];
  currentUserId?: string;
  currentUserRole?: string;
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function ReportDetailCards({ report, media, comments, currentUserId, currentUserRole }: Props) {
  const isOwner = currentUserId === report.author_id;
  const isAdmin = currentUserRole === "admin";

  return (
    <div className="detail-grid">
      <div className="cards">
        <section className="card">
          <h2>{report.title}</h2>
          <p>{report.description}</p>
        </section>

        <section className="card">
          <h3>Informasi Status</h3>
          <div className="info-grid">
            <div>
              <div className="label">Status</div>
              <span className={REPORT_STATUS_CLASS[report.status]}>{REPORT_STATUS_LABEL[report.status]}</span>
            </div>
            <div>
              <div className="label">Author</div>
              <div className="value">{report.author_username}</div>
            </div>
            <div>
              <div className="label">Dibuat</div>
              <div className="value">{formatDate(report.created_at)}</div>
            </div>
            <div>
              <div className="label">Pembaruan terakhir</div>
              <div className="value">{formatDate(report.updated_at)}</div>
            </div>
          </div>
        </section>

        <section className="card">
          <h3>Detail Umum</h3>
          <div className="info-grid">
            <div>
              <div className="label">Ruangan</div>
              <div className="value">{report.room_other ?? report.room_name ?? "-"}</div>
            </div>
            <div>
              <div className="label">Kategori Masalah</div>
              <div className="value">{report.category_name ?? "-"}</div>
            </div>
          </div>
        </section>

        <section className="card">
          <h3>Outcomes</h3>
          <div className="info-grid">
            <div>
              <div className="label">Hasil Observasi</div>
              <p>{report.observation_result ?? "-"}</p>
            </div>
            <div>
              <div className="label">Hasil Ekspektasi</div>
              <p>{report.expected_result ?? "-"}</p>
            </div>
          </div>
        </section>

        <section className="card">
          <h3>Bukti</h3>
          {media.length > 0 ? (
            <div className="cards">
              {media.map((item) => (
                <div key={item.id}>
                  {item.signedUrl ? (
                    item.media_type === "image" ? (
                      <img src={item.signedUrl} alt="Bukti laporan" style={{ maxWidth: "100%", borderRadius: 12 }} />
                    ) : (
                      <video src={item.signedUrl} controls style={{ maxWidth: "100%", borderRadius: 12 }} />
                    )
                  ) : (
                    <span>{item.storage_path}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="help-text">Belum ada bukti.</p>
          )}
        </section>

        <section className="card">
          <h3>Komentar</h3>
          <CommentForm reportId={report.id} />
          <div className="cards" style={{ marginTop: 18 }}>
            {comments.map((comment) => (
              <article className="card" key={comment.id}>
                <strong>{comment.profiles?.username ?? "User"}</strong>
                <p>{comment.body}</p>
                <span className="help-text">{formatDate(comment.created_at)}</span>
              </article>
            ))}
          </div>
        </section>
      </div>

      {(isOwner || isAdmin) && (
        <aside className="card">
          <h3>Aksi Laporan</h3>
          <div className="info-grid">
            <div>
              <div className="label">Status</div>
              <span className={REPORT_STATUS_CLASS[report.status]}>{REPORT_STATUS_LABEL[report.status]}</span>
            </div>
            <div>
              <div className="label">Author</div>
              <div className="value">{report.author_username}</div>
            </div>
            <div>
              <div className="label">Dibuat</div>
              <div className="value">{formatDate(report.created_at)}</div>
            </div>
            <div>
              <div className="label">Diperbarui</div>
              <div className="value">{formatDate(report.updated_at)}</div>
            </div>
          </div>

          {isOwner && report.status !== "closed" ? (
            <form action={markReportClosed.bind(null, report.id)} style={{ marginTop: 16 }}>
              <button type="submit" className="btn green">
                Tandai sebagai selesai
              </button>
            </form>
          ) : null}

          {isAdmin ? (
            <form action={updateReportStatus} className="form-stack" style={{ marginTop: 16 }}>
              <input type="hidden" name="reportId" value={report.id} />
              <label>
                <div className="label">Admin status</div>
                <select className="select" name="status" defaultValue={report.status}>
                  <option value="open">Terbuka</option>
                  <option value="on_progress">Di Proses</option>
                  <option value="duplicate">Duplikat</option>
                  <option value="closed">Selesai</option>
                </select>
              </label>
              <button type="submit" className="btn primary">
                Simpan Status
              </button>
            </form>
          ) : null}
        </aside>
      )}
    </div>
  );
}
