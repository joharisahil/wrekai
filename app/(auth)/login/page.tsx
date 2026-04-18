import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to your Clareeva workspace"
      description="Use your password or request a magic link for secure, low-friction access."
    >
      <LoginForm />
    </AuthShell>
  );
}
