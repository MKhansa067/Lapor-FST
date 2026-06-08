"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

type Props = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const supabase = createClient();

    if (mode === "login") {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) {
        setError(loginError.message);
      } else {
        router.push("/laporan/terbaru");
        router.refresh();
      }
    } else {
      const username = String(formData.get("username") ?? "");
      const { error: registerError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username }
        }
      });

      if (registerError) {
        setError(registerError.message);
      } else {
        setMessage("Register berhasil. Silahkan klik login.");
      }
    }

    setBusy(false);
  }

  return (
    <form className="form-card form-stack" onSubmit={submit}>
      {mode === "register" ? (
        <label>
          <div className="label">Username</div>
          <input className="field" name="username" minLength={3} maxLength={40} required />
        </label>
      ) : null}

      <label>
        <div className="label">Email</div>
        <input className="field" name="email" type="email" required />
      </label>

      <label>
        <div className="label">Password</div>
        <input className="field" name="password" type="password" minLength={6} required />
      </label>

      {error ? <div className="error-text">{error}</div> : null}
      {message ? <div className="help-text">{message}</div> : null}

      <button className="btn primary" type="submit" disabled={busy}>
        {mode === "login" ? "Login" : "Register"}
      </button>

      {mode === "login" ? (
        <p className="help-text">
          Belum punya akun? <Link href="/register">Register</Link>
        </p>
      ) : (
        <p className="help-text">
          Sudah punya akun? <Link href="/login">Login</Link>
        </p>
      )}
    </form>
  );
}
