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

export async function updateOrderStatus( data: { orderId: number; newStatus: OrderStatus } ): Promise<OrderActionResult> {

    const validation = updateStatusSchema.safeParse(data);
    if (!validation.success) {
        console.error("Update status validation failed:", validation.error.format());
        return { success: false, message: "Неверные данные для обновления статуса." };
    }

    const { orderId, newStatus } = validation.data;

    try {
        const updatedOrder = await prisma.$transaction(async (tx) => {
            const existingOrder = await tx.order.findUnique({
                where: { id: orderId },
            });

            if (!existingOrder) {
                throw new Error('Заказ не найден.');
            }

            if (existingOrder.status === newStatus) {
                return existingOrder;
            }

            if (newStatus === OrderStatus.SUCCEDED && existingOrder.status !== OrderStatus.SUCCEDED) {
                if (typeof existingOrder.items !== 'string') {
                    console.warn(`Order items for order ${orderId} is not a string, skipping stock update.`);
                } else {
                    try {
                        const orderItems = JSON.parse(existingOrder.items) as any[];

                        if (!Array.isArray(orderItems)) {
                            throw new Error('Данные товаров в заказе не являются массивом.');
                        }

                        for (const item of orderItems) {
                            const productId = item.productItem?.productId;
                            const quantityToDecrement = item.quantity;

                            if (productId && typeof quantityToDecrement === 'number' && quantityToDecrement > 0) {
                                await tx.product.update({
                                    where: { id: Number(productId) },
                                    data: {
                                        amount: {
                                            decrement: quantityToDecrement,
                                        },
                                    },
                                });
                                console.log(`Stock decremented for product ID ${productId} by ${quantityToDecrement} for order ${orderId}`);
                            } else {
                                console.warn(`Could not determine productId or quantity for an item in order ${orderId}:`, item);
                            }
                        }
                    } catch (parseError) {
                         console.error(`Error parsing items JSON or updating stock for order ${orderId}:`, parseError);
                         throw new Error('Ошибка обработки товаров для обновления остатков.');
                    }
                }
            }

            const newlyUpdatedOrder = await tx.order.update({
                where: { id: orderId },
                data: { status: newStatus },
            });

            return newlyUpdatedOrder;
        });

        revalidatePath('/dashboard');
        revalidatePath('/profile');

        return { success: true, order: updatedOrder, message: `Статус заказа #${orderId} успешно обновлен.` };

    } catch (error) {
        console.error(`Error updating order status for order ${orderId}:`, error);
        let message = 'Ошибка сервера при обновлении статуса заказа.';
        if (error instanceof Error) {
            message = error.message;
        } else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            message = 'Заказ для обновления не найден.';
        }
        return { success: false, message };
    }
}