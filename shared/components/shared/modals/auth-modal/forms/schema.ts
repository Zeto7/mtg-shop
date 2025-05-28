import { z } from "zod";

const passwordSchema = z.string().min(6, { message: 'Пароль должен содержать не менее 6 символов' });

export const formLoginSchema = z.object({
    email: z.string().email({ message: 'Введите корректный email' }),
    password: passwordSchema
});

export const formRegisterSchema = z.object({
    fullName: z.string()
      .min(2, { message: 'Имя должно содержать минимум 2 символа' })
      .trim(),
    email: z.string()
      .email({ message: 'Введите корректный email' }),
    password: z.string()
      .min(8, { message: 'Пароль должен содержать минимум 8 символов' }),
    confirmPassword: z.string()
      .min(8, { message: 'Подтверждение пароля обязательно' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

export type TFormLoginValues = z.infer<typeof formLoginSchema>;
export type TFormRegisterValues = z.infer<typeof formRegisterSchema>;