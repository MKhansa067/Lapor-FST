export const REPORT_STATUS_LABEL: Record<string, string> = {
  open: "Terbuka",
  on_progress: "Di Proses",
  closed: "Selesai",
  duplicate: "Duplikat"
};

export const REPORT_STATUS_CLASS: Record<string, string> = {
  open: "status status-open",
  on_progress: "status status-progress",
  closed: "status status-closed",
  duplicate: "status status-duplicate"
};

export const SORT_OPTIONS = [
  { value: "created_at", label: "Dibuat saat" },
  { value: "updated_at", label: "Diperbarui saat" },
  { value: "reviewed_at", label: "Direview saat" },
  { value: "title", label: "Judul" },
  { value: "vote_count", label: "Vote" },
  { value: "comment_count", label: "Komentar" }
] as const;

export const MAX_TITLE_LENGTH = 100;
export const MAX_TEXT_LENGTH = 1024;
export const MAX_IMAGE_SIZE = 32 * 1024 * 1024;
export const MAX_VIDEO_SIZE = 512 * 1024 * 1024;
export const MAX_REPORT_IMAGES = 5;
