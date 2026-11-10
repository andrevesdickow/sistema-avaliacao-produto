import { z } from "zod";

/**
 * bcrypt trunca senhas acima de 72 bytes. Validamos o tamanho em bytes para
 * evitar que o usuário acredite estar usando uma senha maior do que a real.
 */
const MAX_PASSWORD_BYTES = 72;

const passwordSchema = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres.")
  .refine(
    (value) => new TextEncoder().encode(value).length <= MAX_PASSWORD_BYTES,
    `A senha deve ter no máximo ${MAX_PASSWORD_BYTES} bytes.`,
  );

export const signUpSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, "O nome deve ter pelo menos 2 caracteres.")
      .max(50, "O nome deve ter no máximo 50 caracteres."),
    lastName: z
      .string()
      .trim()
      .min(2, "O sobrenome deve ter pelo menos 2 caracteres.")
      .max(50, "O sobrenome deve ter no máximo 50 caracteres."),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(
        z
          .email("Informe um e-mail válido.")
          .max(254, "O e-mail deve ter no máximo 254 caracteres."),
      ),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirme sua senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type SignUpFormInput = z.input<typeof signUpSchema>;
export type SignUpPayload = z.output<typeof signUpSchema>;
