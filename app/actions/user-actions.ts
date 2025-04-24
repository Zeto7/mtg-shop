// ФАЙЛ: app/actions/user-actions.ts
'use server';

import { prisma } from '@/prisma/prisma-client';
import { Prisma, User, UserRole } from '@prisma/client';
import { hashSync } from 'bcrypt';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
export type SafeUser = Omit<User, 'password'>;

type ActionResult = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

const userFormSchemaBase = z.object({
  fullName: z.string().min(2, { message: "Минимум 2 символа" }).trim(),
  email: z.string().email({ message: "Неверный email" }),
  role: z.nativeEnum(UserRole),
  id: z.number().int().positive().optional(),
});

const addUserFormSchema = userFormSchemaBase.extend({
  password: z.string().min(8, { message: "Минимум 8 символов" }),
});

const updateUserFormSchema = userFormSchemaBase.extend({
  password: z.string().optional(),
});

export async function getUsers(): Promise<SafeUser[]> {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: { id: true, fullName: true, email: true, role: true, provider: true, providerId: true, verified: true, createdAt: true, updatedAt: true }
        });
        return users;
    } catch (error) {
        console.error("Error fetching users [Server Action]:", error);
        return [];
    }
}

export async function addUserAction(formData: FormData): Promise<ActionResult> {
    const rawData = Object.fromEntries(formData.entries());
    const validation = addUserFormSchema.safeParse(rawData);

    if (!validation.success) {
        return { success: false, message: "Ошибка валидации", errors: validation.error.flatten().fieldErrors };
    }
    const { email, fullName, password, role } = validation.data;

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return { success: false, message: 'Email уже используется.' };
        }
        const hashedPassword = hashSync(password, 10);
        await prisma.user.create({
            data: {
                email,
                fullName,
                password: hashedPassword,
                role,
                verified: new Date(),
            },
        });
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        console.error("Error adding user:", error);
        return { success: false, message: 'Ошибка сервера при добавлении пользователя.' };
    }
}

// --- Action: Обновить Пользователя ---
export async function updateUserAction(formData: FormData): Promise<ActionResult> {
    const rawData = Object.fromEntries(formData.entries());
     // Приводим id к числу перед валидацией
     if (rawData.id && typeof rawData.id === 'string') {
         rawData.id = parseInt(rawData.id, 10);
     }
    const validation = updateUserFormSchema.safeParse(rawData);

    if (!validation.success) {
        return { success: false, message: "Ошибка валидации", errors: validation.error.flatten().fieldErrors };
    }
    const { id, email, fullName, role } = validation.data;

    if (!id) {
         return { success: false, message: "ID пользователя не указан." };
    }

    try {
        // Проверяем, не пытается ли админ занять чужой email (если email можно менять)
        const existingUserWithEmail = await prisma.user.findUnique({ where: { email } });
        if (existingUserWithEmail && existingUserWithEmail.id !== id) {
            return { success: false, message: 'Этот email уже используется другим пользователем.' };
        }

        await prisma.user.update({
            where: { id },
            data: {
                email,
                fullName,
                role,
                // Пароль не обновляем этой функцией, или добавить отдельную логику
                // password: password ? hashSync(password, 10) : undefined,
            },
        });
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        console.error("Error updating user:", error);
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
             return { success: false, message: 'Пользователь для обновления не найден.' };
         }
        return { success: false, message: 'Ошибка сервера при обновлении пользователя.' };
    }
}

export async function deleteUserAction(userId: number): Promise<ActionResult> {
    if (!userId) {
        return { success: false, message: "ID пользователя не указан." };
    }

    try {
        await prisma.user.delete({
            where: { id: userId },
        });
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        console.error("Error deleting user:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return { success: false, message: 'Пользователь для удаления не найден.' };
        }
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
             return { success: false, message: 'Невозможно удалить пользователя, так как он связан с другими записями (заказами и т.п.).' };
         }
        return { success: false, message: 'Ошибка сервера при удалении пользователя.' };
    }
}