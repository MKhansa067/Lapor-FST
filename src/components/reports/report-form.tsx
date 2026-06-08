"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import {
  MAX_IMAGE_SIZE,
  MAX_REPORT_IMAGES,
  MAX_TEXT_LENGTH,
  MAX_TITLE_LENGTH,
  MAX_VIDEO_SIZE
} from "@/lib/constants";
import type { OptionRow } from "@/types/app";

type Props = {
  categories: OptionRow[];
  rooms: OptionRow[];
};

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export function ReportForm({ categories, rooms }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [useOtherRoom, setUseOtherRoom] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      router.push("/login");
      return;
    }

    const photoFiles = formData.getAll("photos").filter((file): file is File => file instanceof File && file.size > 0);
    const video = formData.get("video");
    const videoFile = video instanceof File && video.size > 0 ? video : null;

    if (photoFiles.length > MAX_REPORT_IMAGES) {
      setError("Foto maksimal 5 file.");
      setBusy(false);
      return;
    }

    for (const photo of photoFiles) {
      if (photo.size > MAX_IMAGE_SIZE) {
        setError("Ukuran setiap foto maksimal 32 MB.");
        setBusy(false);
        return;
      }
    }

    if (videoFile && videoFile.size > MAX_VIDEO_SIZE) {
      setError("Ukuran video maksimal 512 MB.");
      setBusy(false);
      return;
    }

    const selectedRoom = String(formData.get("room_id") ?? "");
    const roomOther = String(formData.get("room_other") ?? "").trim();

    const { data: report, error: insertError } = await supabase
      .from("reports")
      .insert({
        author_id: userData.user.id,
        title: String(formData.get("title") ?? ""),
        category_id: String(formData.get("category_id") ?? "") || null,
        room_id: useOtherRoom ? null : selectedRoom || null,
        room_other: useOtherRoom ? roomOther : null,
        description: String(formData.get("description") ?? ""),
        observation_result: String(formData.get("observation_result") ?? ""),
        expected_result: String(formData.get("expected_result") ?? "")
      })
      .select("id")
      .single();

    if (insertError || !report) {
      setError(insertError?.message ?? "Gagal membuat laporan.");
      setBusy(false);
      return;
    }

    for (const photo of photoFiles) {
      const path = `${userData.user.id}/${report.id}/${crypto.randomUUID()}-${safeFileName(photo.name)}`;
      const { error: uploadError } = await supabase.storage.from("report-images").upload(path, photo);

      if (uploadError) {
        setError(uploadError.message);
        setBusy(false);
        return;
      }

      await supabase.from("report_media").insert({
        report_id: report.id,
        uploader_id: userData.user.id,
        media_type: "image",
        storage_bucket: "report-images",
        storage_path: path,
        mime_type: photo.type,
        file_size_bytes: photo.size,
        original_filename: photo.name
      });
    }

    if (videoFile) {
      const path = `${userData.user.id}/${report.id}/${crypto.randomUUID()}-${safeFileName(videoFile.name)}`;
      const { error: uploadError } = await supabase.storage.from("report-videos").upload(path, videoFile);

      if (uploadError) {
        setError(uploadError.message);
        setBusy(false);
        return;
      }

      await supabase.from("report_media").insert({
        report_id: report.id,
        uploader_id: userData.user.id,
        media_type: "video",
        storage_bucket: "report-videos",
        storage_path: path,
        mime_type: videoFile.type,
        file_size_bytes: videoFile.size,
        original_filename: videoFile.name
      });
    }

    router.push(`/laporan/detail/${report.id}`);
    router.refresh();
  }

  return (
    <form className="form-card form-stack" onSubmit={submit}>
      <label>
        <div className="label">Judul</div>
        <input className="field" name="title" maxLength={MAX_TITLE_LENGTH} required />
        <div className="help-text">Maksimal 100 karakter.</div>
      </label>

      <label>
        <div className="label">Kategori</div>
        <select className="select" name="category_id" required>
          <option value="">Pilih kategori</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        <div className="label">Detail Ruangan</div>
        <select
          className="select"
          name="room_id"
          disabled={useOtherRoom}
          required={!useOtherRoom}
        >
          <option value="">Pilih ruangan</option>
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        <input type="checkbox" checked={useOtherRoom} onChange={(event) => setUseOtherRoom(event.target.checked)} /> Gunakan ruangan lainnya
      </label>

      {useOtherRoom ? (
        <label>
          <div className="label">Ruangan lainnya</div>
          <input className="field" name="room_other" maxLength={100} required />
        </label>
      ) : null}

      <label>
        <div className="label">Deskripsi</div>
        <textarea className="textarea" name="description" maxLength={MAX_TEXT_LENGTH} required />
        <div className="help-text">Maksimal 1024 karakter.</div>
      </label>

      <label>
        <div className="label">Observasi hasil</div>
        <textarea className="textarea" name="observation_result" maxLength={MAX_TEXT_LENGTH} />
      </label>

      <label>
        <div className="label">Ekspektasi hasil</div>
        <textarea className="textarea" name="expected_result" maxLength={MAX_TEXT_LENGTH} />
      </label>

      <label>
        <div className="label">Bukti video</div>
        <input className="field" type="file" name="video" accept="video/mp4,video/webm,video/quicktime" />
        <div className="help-text">Maksimal 512 MB.</div>
      </label>

      <label>
        <div className="label">Bukti foto</div>
        <input className="field" type="file" name="photos" accept="image/jpeg,image/png,image/webp" multiple />
        <div className="help-text">Maksimal 5 foto, 32 MB per foto.</div>
      </label>

      <label>
        <input type="checkbox" required /> Saya menyetujui bahwa laporan ini benar dan dapat ditinjau oleh pihak FST.
      </label>

      {error ? <div className="error-text">{error}</div> : null}

      <div className="form-actions">
        <button className="btn primary" type="submit" disabled={busy}>
          Kirim Laporan
        </button>
      </div>
    </form>
  );
}
