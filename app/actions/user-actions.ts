'use server';

import { prisma } from '@/prisma/prisma-client';
import { Prisma, User, UserRole } from '@prisma/client';
import { hashSync } from 'bcrypt';
import { revalidatePath } from 'next/cache';
import { getUserSession } from '@/shared/lib/get-user-session';
import { Order } from '@prisma/client';
import { z } from 'zod';
export type SafeUser = Omit<User, 'password'>;

type ActionResult = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
  user?: SafeUser;
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

const updateProfileSchema = z.object({
    fullName: z.string().min(2, { message: "Минимум 2 символа" }).trim(),
    password: z.string().min(8, { message: "Минимум 8 символов" }).optional().or(z.literal('')),
});
type UpdateProfileData = z.infer<typeof updateProfileSchema>;

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

export async function getMyOrders(): Promise<{ success: boolean; orders?: Order[]; message?: string }> {
    try {
        const session = await getUserSession();
        if (!session?.id) {
            return { success: false, message: "Пользователь не аутентифицирован." };
        }
        const userId = Number(session.id);

        const orders = await prisma.order.findMany({
            where: { userId: userId },
            orderBy: { createdAt: 'desc' }, // Сначала новые
            // Можно добавить include, если нужны связанные данные, но для списка обычно нет
        });

        return { success: true, orders };

    } catch (error) {
        console.error("Error fetching user orders:", error);
        return { success: false, message: "Ошибка сервера при получении заказов." };
    }
}

export async function getCurrentUserProfile(): Promise<ActionResult> {
    try {
      // getUserSession возвращает объект user {id, role, name...} или null
      const currentUser = await getUserSession();
  
      if (!currentUser?.id) { // Проверяем наличие ID у результата getUserSession
        return { success: false, message: "Пользователь не аутентифицирован." };
      }
  
      const userId = Number(currentUser.id); // Преобразуем ID сессии в число
  
      // Ищем пользователя в БД по этому ID
      const user = await prisma.user.findUnique({
        where: { id: userId },
        // Выбираем поля, чтобы исключить пароль
        select: {
          id: true, fullName: true, email: true, role: true, provider: true,
          providerId: true, verified: true, createdAt: true, updatedAt: true
        }
      });
  
      if (!user) {
        // Если сессия есть, а пользователя в БД нет - это ошибка
        console.error(`User with ID ${userId} found in session but not in DB.`);
        return { success: false, message: "Профиль пользователя не найден в базе данных." };
      }
  
      // Возвращаем успех и данные пользователя
      return { success: true, user };
  
    } catch (error) {
      console.error("Error fetching current user profile:", error);
      return { success: false, message: "Ошибка сервера при получении профиля." };
    }
  }
  
  // --- ДОБАВИТЬ: Обновить профиль ТЕКУЩЕГО пользователя ---
  export async function updateMyProfile(data: UpdateProfileData): Promise<ActionResult> {
      // 1. Валидация входных данных
      const validation = updateProfileSchema.safeParse(data);
      if (!validation.success) {
          return { success: false, message: "Ошибка валидации данных профиля", errors: validation.error.format() }; // Возвращаем ошибки Zod
      }
      const { fullName, password } = validation.data;
  
      try {
          // 2. Получаем сессию ТЕКУЩЕГО пользователя
          const currentUser = await getUserSession();
          if (!currentUser?.id) { // Проверяем наличие ID
              return { success: false, message: "Пользователь не аутентифицирован." };
          }
          const userId = Number(currentUser.id);
  
          // 3. Находим пользователя (для получения старого пароля, если новый не указан - хотя это не нужно, см. ниже)
          // Достаточно просто убедиться, что пользователь существует, хотя сессия это уже подтверждает.
          const findUser = await prisma.user.findUnique({
              where: { id: userId },
              select: { id: true } // Достаточно выбрать ID для проверки существования
          });
  
          if (!findUser) {
               return { success: false, message: 'Пользователь для обновления не найден.' };
          }
  
          // 4. Готовим данные для обновления
          const dataToUpdate: Prisma.UserUpdateInput = {
              fullName: fullName, // Обновляем имя
          };
  
          // Если передан новый пароль и он не пустой, хешируем и добавляем его
          if (password && password.length > 0) {
              dataToUpdate.password = hashSync(password, 10);
          }
          // Если password пустой или не передан, поле password не будет в dataToUpdate,
          // и Prisma его не изменит.
  
          // 5. Обновляем пользователя в БД
          await prisma.user.update({
              where: { id: userId }, // Обновляем по ID из сессии
              data: dataToUpdate,
          });
  
          // 6. Ревалидируем путь к странице профиля
          revalidatePath('/profile');
  
          return { success: true }; // Возвращаем успех
  
      } catch (error) {
          console.error("Error updating own profile:", error);
          return { success: false, message: 'Ошибка сервера при обновлении профиля.' };
      }
  }