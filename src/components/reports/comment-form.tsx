"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export function CommentForm({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      router.push("/login");
      return;
    }

    const { error: insertError } = await supabase.from("comments").insert({
      report_id: reportId,
      author_id: userData.user.id,
      body
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setBody("");
      router.refresh();
    }

    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="form-stack">
      <textarea
        className="textarea"
        maxLength={1024}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Tulis komentar maksimal 1024 karakter"
        required
      />
      <div className="help-text">Upload image/video komentar bisa ditambahkan memakai tabel comment_media dan bucket comment-images/comment-videos.</div>
      {error ? <div className="error-text">{error}</div> : null}
      <button className="btn primary" type="submit" disabled={busy}>
        Kirim Komentar
      </button>
    </form>
  );
}
