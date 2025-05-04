'use server';

import { prisma } from '@/prisma/prisma-client';
import { Order, OrderStatus, Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';


type OrderActionResult = {
  success: boolean;
  message?: string;
  order?: Order;
};

const updateStatusSchema = z.object({
    orderId: z.coerce.number().int().positive(),
    newStatus: z.nativeEnum(OrderStatus),
});

export async function getOrders(): Promise<Order[]> {

    try {
        const orders = await prisma.order.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });
        return orders;
    } catch (error) {
        console.error("Error fetching orders [Server Action]:", error);
        return [];
    }
}

export async function updateOrderStatus(
    data: { orderId: number; newStatus: OrderStatus }
): Promise<OrderActionResult> {

    const validation = updateStatusSchema.safeParse(data);
    if (!validation.success) {
        console.error("Update status validation failed:", validation.error.format());
        return { success: false, message: "Неверные данные для обновления статуса." };
    }

    const { orderId, newStatus } = validation.data;

    try {
        const existingOrder = await prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!existingOrder) {
             return { success: false, message: 'Заказ не найден.' };
        }

        if (existingOrder.status === newStatus) {
             return { success: true, message: 'Статус заказа уже установлен.', order: existingOrder };
        }

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                status: newStatus,
            },
        });

        revalidatePath('/dashboard');

        return { success: true, order: updatedOrder };

    } catch (error) {
        console.error(`Error updating order status for order ${orderId}:`, error);
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
             return { success: false, message: 'Заказ для обновления не найден.' };
         }
        return { success: false, message: 'Ошибка сервера при обновлении статуса заказа.' };
    }
}