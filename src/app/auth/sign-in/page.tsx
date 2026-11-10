import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Entrar",
  description:
    "Entre na sua conta na avalia. para continuar avaliando produtos e ajudando outras pessoas a escolherem melhor.",
};

export default function SignInPage() {
  return (
    <AuthShell variant="sign-in">
      <SignInForm />
    </AuthShell>
  );
}
