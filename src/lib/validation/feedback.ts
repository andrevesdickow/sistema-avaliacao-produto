import { z } from "zod";

export const feedbackSchema = z.object({
  score: z
    .number({ error: "Escolha uma nota de 1 a 5." })
    .int("Escolha uma nota de 1 a 5.")
    .min(1, "Escolha uma nota de 1 a 5.")
    .max(5, "Escolha uma nota de 1 a 5."),
  comment: z
    .string()
    .trim()
    .min(1, "Escreva um comentário sobre o produto.")
    .max(2000, "O comentário deve ter no máximo 2000 caracteres."),
});

export type FeedbackFormInput = z.input<typeof feedbackSchema>;
export type FeedbackPayload = z.output<typeof feedbackSchema>;
