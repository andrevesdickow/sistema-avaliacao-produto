import { z } from "zod";

/**
 * Login não repete a regra de tamanho do cadastro: o objetivo é apenas impedir
 * envios vazios. Credenciais inválidas são tratadas de forma genérica na API.
 */
export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(
      z
        .email("Informe um e-mail válido.")
        .max(254, "O e-mail deve ter no máximo 254 caracteres."),
    ),
  password: z.string().min(1, "Informe sua senha."),
});

export type SignInFormInput = z.input<typeof signInSchema>;
export type SignInPayload = z.output<typeof signInSchema>;
