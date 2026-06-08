import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username,display_name,role")
    .eq("id", userData.user.id)
    .maybeSingle();

  return (
    <section className="form-card">
      <h1 className="page-title">Settings</h1>
      <div className="info-grid">
        <div>
          <div className="label">Username</div>
          <div className="value">{profile?.username}</div>
        </div>
        <div>
          <div className="label">Display name</div>
          <div className="value">{profile?.display_name ?? "-"}</div>
        </div>
        <div>
          <div className="label">Role</div>
          <div className="value">{profile?.role}</div>
        </div>
      </div>
    </section>
  );
}
