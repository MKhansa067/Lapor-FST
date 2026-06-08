import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/actions/auth";

export async function Header() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  let username: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();

    username = profile?.username ?? user.email ?? "Profil";
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/laporan/terbaru" className="logo">
          Lapor FST
        </Link>

        <nav className="nav" aria-label="Navigasi utama">
          <Link href="/laporan/terbaru">Laporan Terbaru</Link>
          <Link href="/laporan/terbuka">Laporan Terbuka</Link>
          <Link href="/laporan/diproses">Laporan Di Proses</Link>
          <Link href="/laporan/selesai">Laporan Ditutup</Link>
          <Link href="/laporan/laporanku">Laporanku</Link>
          <Link href="/lapor-masalah" className="primary-link">
            Lapor Masalah
          </Link>
        </nav>

        <div className="profile-menu">
          {user ? (
            <details>
              <summary className="profile-summary">
                <span>Profil</span>
                <span className="summary-chevron" aria-hidden="true">▾</span>
              </summary>
              <div className="profile-dropdown">
                <div className="profile-name">{username}</div>
                <Link href="/bookmarks">Bookmarks</Link>
                <Link href="/settings">Settings</Link>
                <form action={logout}>
                  <button className="logout-button" type="submit">
                    Log out
                  </button>
                </form>
              </div>
            </details>
          ) : (
            <Link href="/login">Login</Link>
          )}
        </div>
      </div>
    </header>
  );
}
