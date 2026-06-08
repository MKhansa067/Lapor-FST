import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <section>
      <h1 className="page-title">Login</h1>
      <AuthForm mode="login" />
    </section>
  );
}
