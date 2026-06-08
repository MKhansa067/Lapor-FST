export type ReportStatus = "open" | "on_progress" | "closed" | "duplicate";

export type ReportListRow = {
  id: string;
  author_id: string;
  author_username: string;
  title: string;
  description: string;
  status: ReportStatus;
  category_id: string | null;
  category_name: string | null;
  room_id: string | null;
  room_name: string | null;
  room_other: string | null;
  observation_result: string | null;
  expected_result: string | null;
  duplicate_of_report_id: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  resolved_at: string | null;
  vote_count: number;
  comment_count: number;
  media_count: number;
};

export type OptionRow = {
  id: string;
  name: string;
  slug: string;
};
