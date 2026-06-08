"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

type Props = {
  reportId: string;
  voteCount: number;
  commentCount: number;
};

export function ReportQuickActions({ reportId, voteCount, commentCount }: Props) {
  const router = useRouter();
  const [votes, setVotes] = useState(voteCount);
  const [busy, setBusy] = useState(false);

  async function requireUser() {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      router.push("/login");
      return null;
    }

    return { supabase, userId: data.user.id };
  }

  async function vote() {
    setBusy(true);
    const context = await requireUser();

    if (!context) {
      setBusy(false);
      return;
    }

    const { error } = await context.supabase
      .from("votes")
      .upsert({ report_id: reportId, user_id: context.userId }, { onConflict: "report_id,user_id" });

    if (!error) {
      setVotes((current) => current + 1);
    }

    setBusy(false);
  }

  async function bookmark() {
    setBusy(true);
    const context = await requireUser();

    if (!context) {
      setBusy(false);
      return;
    }

    await context.supabase
      .from("bookmarks")
      .upsert({ report_id: reportId, user_id: context.userId }, { onConflict: "report_id,user_id" });

    setBusy(false);
  }

  return (
    <>
      <button className="btn" type="button" onClick={vote} disabled={busy}>
        ▲ {votes}
      </button>
      <span>💬 {commentCount}</span>
      <button className="btn" type="button" onClick={bookmark} disabled={busy}>
        🔖
      </button>
    </>
  );
}
