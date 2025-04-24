'use server';

import { prisma } from '@/prisma/prisma-client';
import { hashSync } from 'bcrypt';
import { UserRole } from '@prisma/client';
import { z } from 'zod';


const registerActionInputSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  password: z.string().min(8),
});
type RegisterActionInput = z.infer<typeof registerActionInputSchema>;

type ActionResult = {
  success: boolean;
  message?: string;
};

export async function registerUserAction(input: RegisterActionInput): Promise<ActionResult> {
  const validation = registerActionInputSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, message: 'Неверные данные регистрации.' };
  }
  const { email, fullName, password } = validation.data;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { success: false, message: 'Пользователь с таким email уже существует.' };
    }

    const hashedPassword = hashSync(password, 10);

    await prisma.user.create({
      data: {
        email,
        fullName,
        password: hashedPassword,
        verified: new Date(),
        role: UserRole.USER,
      },
    });

    return { success: true };

  } catch (error) {
    console.error("Error in registerUserAction:", error);
    return { success: false, message: 'Ошибка сервера при регистрации.' };
  }
}