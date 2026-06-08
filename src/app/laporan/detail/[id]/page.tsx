import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReportDetailCards } from "@/components/reports/report-detail-cards";
import type { ReportListRow } from "@/types/app";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReportDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const currentUser = userData.user;

  const { data: report, error } = await supabase
    .from("report_list_view")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!report) {
    notFound();
  }

  const { data: mediaData } = await supabase
    .from("report_media")
    .select("id,media_type,storage_bucket,storage_path")
    .eq("report_id", id)
    .order("created_at", { ascending: true });

  const mediaWithUrls = await Promise.all(
    (mediaData ?? []).map(async (item) => {
      if (!currentUser) return item;
      const { data } = await supabase.storage
        .from(item.storage_bucket)
        .createSignedUrl(item.storage_path, 60 * 15);
      return { ...item, signedUrl: data?.signedUrl };
    })
  );

  const { data: comments } = await supabase
    .from("comments")
    .select("id,body,created_at,profiles(username)")
    .eq("report_id", id)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true });

  let currentUserRole: string | undefined;

  if (currentUser) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .maybeSingle();

    currentUserRole = profile?.role;
  }

  return (
    <section>
      <Link href="/laporan/terbaru" className="back-link">
        &lt; kembali ke list
      </Link>
      <ReportDetailCards
        report={report as ReportListRow}
        media={mediaWithUrls as never[]}
        comments={(comments ?? []) as never[]}
        currentUserId={currentUser?.id}
        currentUserRole={currentUserRole}
      />
    </section>
  );
}
