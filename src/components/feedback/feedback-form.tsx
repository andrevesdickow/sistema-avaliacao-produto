"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { RatingInput } from "@/components/feedback/rating-stars";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { FeedbackApiError, submitFeedback } from "@/lib/api/feedback";
import {
  type FeedbackFormInput,
  type FeedbackPayload,
  feedbackSchema,
} from "@/lib/validation/feedback";

const ALERT_ID = "feedback-error";
const COMMENT_MAX_LENGTH = 2000;

export function FeedbackForm({ productId }: { productId: string }) {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);

  const form = useForm<FeedbackFormInput, unknown, FeedbackPayload>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      score: 0,
      comment: "",
    },
    mode: "onTouched",
  });

  const mutation = useMutation({
    mutationFn: (payload: FeedbackPayload) =>
      submitFeedback(productId, payload),
    onSuccess: () => {
      setShowSuccess(true);
      form.reset({ score: 0, comment: "" });
      router.refresh();
    },
    onError: (error) => {
      if (!(error instanceof FeedbackApiError) || !error.fields) {
        return;
      }

      const scoreError = error.fields.score?.[0];
      const commentError = error.fields.comment?.[0];

      if (scoreError) {
        form.setError("score", { type: "server", message: scoreError });
      }

      if (commentError) {
        form.setError("comment", { type: "server", message: commentError });
      }

      if (scoreError) {
        document.getElementById("score-1")?.focus();
      } else if (commentError) {
        form.setFocus("comment");
      }
    },
  });

  useEffect(() => {
    if (!mutation.isError) {
      return;
    }

    if (mutation.error instanceof FeedbackApiError && mutation.error.fields) {
      return;
    }

    document.getElementById(ALERT_ID)?.focus();
  }, [mutation.isError, mutation.error]);

  const onSubmit = form.handleSubmit((values) => mutation.mutate(values));
  const { errors } = form.formState;
  const commentLength = (form.watch("comment") ?? "").length;

  const serverErrorMessage =
    mutation.error instanceof FeedbackApiError
      ? mutation.error.fields
        ? null
        : mutation.error.message
      : mutation.error
        ? "Ocorreu um erro inesperado. Tente novamente."
        : null;

  return (
    <div className="rounded-2xl border border-white/10 bg-card/70 p-6">
      <header>
        <h2 className="font-display text-2xl leading-tight tracking-tight">
          Avalie este produto
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Conte como foi sua experiência. Sua nota e seu comentário ficam
          públicos para ajudar outras pessoas.
        </p>
      </header>

      {showSuccess ? (
        <output className="mt-5 flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm">
          <CheckCircle2
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-primary"
          />
          <span>
            Avaliação publicada. Obrigado por compartilhar sua experiência!
          </span>
        </output>
      ) : null}

      {serverErrorMessage ? (
        <Alert
          id={ALERT_ID}
          tabIndex={-1}
          variant="destructive"
          className="mt-5 border-destructive/30 bg-destructive/10 focus-visible:ring-2 focus-visible:ring-destructive/40 focus-visible:outline-none"
        >
          <AlertCircle aria-hidden />
          <AlertTitle>Não foi possível publicar</AlertTitle>
          <AlertDescription>{serverErrorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <form
        onSubmit={onSubmit}
        onChange={() => {
          if (showSuccess) {
            setShowSuccess(false);
          }

          if (mutation.isError) {
            mutation.reset();
          }
        }}
        aria-busy={mutation.isPending}
        noValidate
      >
        <FieldGroup className="mt-5 gap-5">
          <Field data-invalid={Boolean(errors.score)}>
            <FieldLabel htmlFor="score-1">Sua nota</FieldLabel>
            <Controller
              control={form.control}
              name="score"
              render={({ field }) => (
                <RatingInput
                  name={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={Boolean(errors.score)}
                  describedBy={errors.score ? "score-error" : undefined}
                  disabled={mutation.isPending}
                />
              )}
            />
            <FieldError id="score-error" errors={[errors.score]} />
          </Field>

          <Field data-invalid={Boolean(errors.comment)}>
            <div className="flex items-baseline justify-between gap-3">
              <FieldLabel htmlFor="comment">Seu comentário</FieldLabel>
              <span className="text-xs tabular-nums text-muted-foreground">
                {commentLength}/{COMMENT_MAX_LENGTH}
              </span>
            </div>
            <Textarea
              id="comment"
              rows={5}
              className="min-h-32 resize-y"
              placeholder="O que você gostou? O que poderia ser melhor?"
              maxLength={COMMENT_MAX_LENGTH}
              disabled={mutation.isPending}
              aria-invalid={Boolean(errors.comment) || undefined}
              aria-describedby={
                errors.comment ? "comment-error" : "comment-hint"
              }
              {...form.register("comment")}
            />
            <FieldDescription id="comment-hint">
              Seja específico e respeitoso. Comentários não podem ser editados
              depois de publicados.
            </FieldDescription>
            <FieldError id="comment-error" errors={[errors.comment]} />
          </Field>
        </FieldGroup>

        <Button
          type="submit"
          size="lg"
          className="mt-5 h-11 w-full text-sm font-semibold"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <>
              <Loader2
                aria-hidden
                className="size-4 animate-spin motion-reduce:animate-none"
              />
              Publicando...
            </>
          ) : (
            <>
              <Send aria-hidden className="size-4" />
              Publicar avaliação
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
