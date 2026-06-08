import { AuthForm } from "@/components/auth/auth-form";

export default function RegisterPage() {
  return (
    <section>
      <h1 className="page-title">Register</h1>
      <AuthForm mode="register" />
    </section>
  );
}
