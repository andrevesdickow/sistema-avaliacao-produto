import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpSuccess } from "@/components/auth/sign-up-success";

export const metadata: Metadata = {
  title: "Conta criada",
  description: "Sua conta na avalia. foi criada com sucesso.",
};

export default function SignUpSuccessPage() {
  return (
    <AuthShell>
      <SignUpSuccess />
    </AuthShell>
  );
}
