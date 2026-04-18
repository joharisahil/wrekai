import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <AuthShell
      eyebrow="Start your trial"
      title="Create a Clareeva account"
      description="Sign up with Google or email and password to start clustering customer feedback."
    >
      <SignupForm />
    </AuthShell>
  );
}
