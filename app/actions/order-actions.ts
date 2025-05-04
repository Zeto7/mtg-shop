'use server';

import { prisma } from '@/prisma/prisma-client';
import { CheckoutFormValues } from "@/shared/components/shared/checkout-components/checkout-form-schema";
import { getUserSession } from "@/shared/lib/get-user-session";
import { sendEmail } from "@/shared/lib/send-email";
import OrderConfirmationEmail from '@/shared/components/shared/email-templates/OrderConfirmationEmail';
import { OrderStatus, Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import React from 'react';

type CreateOrderResult = {
    success: boolean;
    message?: string;
    orderId?: number;
    paymentUrl?: string | null;
}

export async function createOrder(data: CheckoutFormValues): Promise<CreateOrderResult> {
    const cookieStore = cookies();
    const cartToken = cookieStore.get('cartToken')?.value;
    const session = await getUserSession();
    const userId = session?.id ? Number(session.id) : null;

    if (!userId) {
        return { success: false, message: 'Для оформления заказа необходимо войти в аккаунт.' };
    }

    if (!cartToken) {
        return { success: false, message: 'Токен корзины не найден' };
    }

    try {
        const userCart = await prisma.cart.findFirst({
            where: { token: cartToken },
            include: { items: true },
        });

        if (!userCart) {
            return { success: false, message: 'Корзина не найдена' };
        }
        if (userCart?.totalAmount === 0 || userCart.items.length === 0) {
            return { success: false, message: 'Корзина пуста' };
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
                userId: userId,
            },
        });

         await prisma.cart.update({
             where: { id: userCart.id },
             data: { totalAmount: 0, items: { deleteMany: {} } }
         });
         cookieStore.delete('cartToken');

        return { success: true, orderId: order.id };

    } catch (error) {
        console.error('[CREATE_ORDER SIMPLIFIED] Server error', error);
        let message = 'Не удалось сохранить заказ.';
        if (error instanceof Error) {
            message = error.message;
        }
        return { success: false, message };
    }
}