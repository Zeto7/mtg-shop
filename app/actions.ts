'use server';

import { prisma } from '@/prisma/prisma-client';
import { CheckoutFormValues } from "@/shared/components/shared/checkout-components/checkout-form-schema";
import { getUserSession } from "@/shared/lib/get-user-session";
import { OrderStatus, Prisma, UserRole } from "@prisma/client";
import { hashSync } from "bcrypt"; 
import { cookies } from "next/headers";
import { z } from 'zod';

export async function createOrder(data: CheckoutFormValues) {
    try {   
        const cookieStore = await cookies();
        const cartToken = cookieStore.get('cartToken')?.value;

        if (!cartToken) {
            throw new Error('Cart token not found');
        }

        const userCart = await prisma.cart.findFirst({
            include: {
                user: true,
                items: {
                    include: {
                        additionals: true,
                        productItem: {
                            include: {
                                product: true,
                            },
                        },
                    },
                },
            },
            where: {
                token: cartToken,
            },
        });

        if (!userCart) {
            throw new Error('Cart not found');
        }

        if (userCart?.totalAmount === 0) {
            throw new Error('Cart is empty');
        }

        const order = await prisma.order.create({
            data: {
                token: cartToken,
                fullName: data.firstName + ' ' + data.lastName,
                email: data.email,
                phone: data.phone,
                address: data.address,
                comment: data.comment,
                totalAmount: userCart.totalAmount,
                status: OrderStatus.PENDING,
                items: JSON.stringify(userCart.items),
                userId: userCart.userId ?? undefined,
            },
        });

        await prisma.cart.update({
            where: { id: userCart.id },
            data: { totalAmount: 0 }
        });

        await prisma.cartItem.deleteMany({
            where: { cartId: userCart.id },
        });

        return { success: true, orderId: order.id };

    } catch (error) {
        console.error('[CREATE_ORDER] Server error', error);
        return { success: false, message: 'Не удалось создать заказ.' };
    }
}

export async function updateUserInfo(body: Prisma.UserUpdateInput) {
    if (!body || (body.password && typeof body.password !== 'string')) {
        return { success: false, message: 'Неверные данные для обновления.' };
    }

    try {
        const currentUser = await getUserSession();

        if (!currentUser?.id) {
             return { success: false, message: 'Пользователь не аутентифицирован.' };
        }

        const findUser = await prisma.user.findUnique({
            where: {
                id: Number(currentUser.id),
            },
        });

        if (!findUser) {
            return { success: false, message: 'Пользователь не найден в базе данных.' };
        }

        await prisma.user.update({
            where: {
                id: Number(currentUser.id),
            },
            data: {
                fullName: body.fullName,
                password: body.password ? hashSync(body.password as string, 10) : findUser.password,

                 email: undefined,
                 verified: undefined,
                 role: undefined,
            },
        });
        return { success: true };
    } catch (error) {
        console.error('Error [UPDATE_USER]', error);

        return { success: false, message: 'Не удалось обновить данные пользователя.' };

    }
};


const registerUserInputSchema = z.object({
  email: z.string().email({ message: "Введите корректный email" }),
  fullName: z.string().min(2, { message: "Имя должно содержать минимум 2 символа" }),
  password: z.string().min(8, { message: "Пароль должен содержать минимум 8 символов" }),
});

type RegisterUserInputData = z.infer<typeof registerUserInputSchema>;

type ActionResult = {
  success: boolean;
  message?: string;
};

export async function registerUser(input: RegisterUserInputData): Promise<ActionResult> {
  const validation = registerUserInputSchema.safeParse(input);
  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    console.error("Register validation failed:", errors);
    const firstErrorMessage = Object.values(errors).flat()[0] || 'Неверные данные регистрации.';
    return { success: false, message: firstErrorMessage };
  }
  const { email, fullName, password } = validation.data;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return { success: false, message: 'Пользователь с таким email уже зарегистрирован.' };
    }

    const hashedPassword = hashSync(password, 10);

    await prisma.user.create({
      data: {
        email: email,
        fullName: fullName,
        password: hashedPassword,
        verified: null,
        role: UserRole.USER,
      },
    });
    return { success: true };

  } catch (error) {
    console.error("Error during user registration [Server Action]:", error);
    return { success: false, message: 'Произошла ошибка на сервере при регистрации.' };
  }
}