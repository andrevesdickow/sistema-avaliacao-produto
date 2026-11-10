"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SignUpApiError, submitSignUp } from "@/lib/api/sign-up";
import { signUpSchema } from "@/lib/validation/sign-up";

type FormInput = z.input<typeof signUpSchema>;
type FormOutput = z.output<typeof signUpSchema>;

const fieldNames = [
  "firstName",
  "lastName",
  "email",
  "password",
  "confirmPassword",
] as const;

type FieldName = (typeof fieldNames)[number];

function isFieldName(value: string): value is FieldName {
  return fieldNames.includes(value as FieldName);
}

const toggleClassName =
  "absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset focus-visible:outline-none";

const ALERT_ID = "sign-up-error";

const legalLinkClassName =
  "text-foreground underline decoration-white/20 underline-offset-2 transition-colors hover:decoration-white/50 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none";

export function SignUpForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onTouched",
  });

  const mutation = useMutation({
    mutationFn: submitSignUp,
    onSuccess: () => {
      router.push("/auth/sign-up/success");
    },
    onError: (error) => {
      if (!(error instanceof SignUpApiError) || !error.fields) {
        return;
      }

      let firstInvalidField: FieldName | null = null;

      for (const [field, messages] of Object.entries(error.fields)) {
        if (isFieldName(field) && messages?.[0]) {
          form.setError(field, { type: "server", message: messages[0] });
          firstInvalidField ??= field;
        }
      }

      if (firstInvalidField) {
        form.setFocus(firstInvalidField);
      }
    },
  });

  useEffect(() => {
    if (!mutation.isError) {
      return;
    }

    if (mutation.error instanceof SignUpApiError && mutation.error.fields) {
      return;
    }

    document.getElementById(ALERT_ID)?.focus();
  }, [mutation.isError, mutation.error]);

  const onSubmit = form.handleSubmit((values) => mutation.mutate(values));
  const { errors } = form.formState;

  const serverErrorMessage =
    mutation.error instanceof SignUpApiError
      ? mutation.error.message
      : mutation.error
        ? "Ocorreu um erro inesperado. Tente novamente."
        : null;

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-4xl leading-tight tracking-tight">
          Crie sua conta
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Leva um minuto. Depois é só avaliar o que você já usou e ajudar outras
          pessoas a escolherem melhor.
        </p>
      </header>

      {serverErrorMessage ? (
        <Alert
          id={ALERT_ID}
          tabIndex={-1}
          variant="destructive"
          className="mb-6 border-destructive/30 bg-destructive/10 focus-visible:ring-2 focus-visible:ring-destructive/40 focus-visible:outline-none"
        >
          <AlertCircle aria-hidden />
          <AlertTitle>Não foi possível criar sua conta</AlertTitle>
          <AlertDescription>{serverErrorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <form
        onSubmit={onSubmit}
        onChange={() => {
          if (mutation.isError) {
            mutation.reset();
          }
        }}
        noValidate
      >
        <p className="mb-5 text-xs text-muted-foreground">
          Todos os campos são obrigatórios.
        </p>

        <FieldGroup className="gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field data-invalid={Boolean(errors.firstName)}>
              <FieldLabel htmlFor="firstName">Nome</FieldLabel>
              <Input
                id="firstName"
                className="h-11"
                placeholder="Marina"
                autoComplete="given-name"
                required
                aria-invalid={Boolean(errors.firstName) || undefined}
                aria-describedby={
                  errors.firstName ? "firstName-error" : undefined
                }
                {...form.register("firstName")}
              />
              <FieldError id="firstName-error" errors={[errors.firstName]} />
            </Field>

            <Field data-invalid={Boolean(errors.lastName)}>
              <FieldLabel htmlFor="lastName">Sobrenome</FieldLabel>
              <Input
                id="lastName"
                className="h-11"
                placeholder="Souza"
                autoComplete="family-name"
                required
                aria-invalid={Boolean(errors.lastName) || undefined}
                aria-describedby={
                  errors.lastName ? "lastName-error" : undefined
                }
                {...form.register("lastName")}
              />
              <FieldError id="lastName-error" errors={[errors.lastName]} />
            </Field>
          </div>

          <Field data-invalid={Boolean(errors.email)}>
            <FieldLabel htmlFor="email">E-mail</FieldLabel>
            <Input
              id="email"
              type="email"
              className="h-11"
              placeholder="voce@email.com"
              autoComplete="email"
              inputMode="email"
              required
              aria-invalid={Boolean(errors.email) || undefined}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...form.register("email")}
            />
            <FieldError id="email-error" errors={[errors.email]} />
          </Field>

          <Field data-invalid={Boolean(errors.password)}>
            <FieldLabel htmlFor="password">Senha</FieldLabel>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                className="h-11 pr-11"
                placeholder="Mínimo de 8 caracteres"
                autoComplete="new-password"
                required
                aria-invalid={Boolean(errors.password) || undefined}
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
                {...form.register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className={toggleClassName}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <EyeOff aria-hidden className="size-4" />
                ) : (
                  <Eye aria-hidden className="size-4" />
                )}
              </button>
            </div>
            <FieldError id="password-error" errors={[errors.password]} />
          </Field>

          <Field data-invalid={Boolean(errors.confirmPassword)}>
            <FieldLabel htmlFor="confirmPassword">
              Confirme sua senha
            </FieldLabel>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                className="h-11 pr-11"
                placeholder="Repita a senha"
                autoComplete="new-password"
                required
                aria-invalid={Boolean(errors.confirmPassword) || undefined}
                aria-describedby={
                  errors.confirmPassword ? "confirmPassword-error" : undefined
                }
                {...form.register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                className={toggleClassName}
                aria-label={
                  showConfirmPassword
                    ? "Ocultar senha de confirmação"
                    : "Mostrar senha de confirmação"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff aria-hidden className="size-4" />
                ) : (
                  <Eye aria-hidden className="size-4" />
                )}
              </button>
            </div>
            <FieldError
              id="confirmPassword-error"
              errors={[errors.confirmPassword]}
            />
          </Field>
        </FieldGroup>

        <Button
          type="submit"
          size="lg"
          className="mt-8 h-12 w-full rounded-lg text-sm font-semibold"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <>
              <Loader2
                aria-hidden
                className="size-4 animate-spin motion-reduce:animate-none"
              />
              Criando conta...
            </>
          ) : (
            "Criar conta"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
        Ao criar sua conta, você concorda com os{" "}
        <Link href="/legal/terms" className={legalLinkClassName}>
          termos de uso
        </Link>{" "}
        e a{" "}
        <Link href="/legal/privacy" className={legalLinkClassName}>
          política de privacidade
        </Link>
        .
      </p>

      <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
        Já tem uma conta?{" "}
        <Link href="/auth/sign-in" className={legalLinkClassName}>
          Entrar
        </Link>
      </p>
    </div>
  );
}
