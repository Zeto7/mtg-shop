'use server';

import { prisma } from '@/prisma/prisma-client';
import { OrderStatus, Prisma } from '@prisma/client';
import { z } from 'zod';

const orderJsonProductSchema = z.object({ id: z.number(), name: z.string(), imageUrl: z.string().optional().nullable(), }).optional().nullable();
const orderJsonProductItemSchema = z.object({ id: z.number(), price: z.number(), productId: z.number(), product: orderJsonProductSchema, }).optional().nullable();
const orderJsonAdditionalSchema = z.object({ id: z.number(), name: z.string(), price: z.number(), });
const orderJsonItemSchema = z.object({ id: z.number(), quantity: z.number().int().positive(), productItemId: z.number(), productItem: orderJsonProductItemSchema, additionals: z.array(orderJsonAdditionalSchema).optional().nullable(), });
const orderItemsSchema = z.array(orderJsonItemSchema);

// Тип для одного элемента отчета
export interface SalesReportItem {
    productId: number;
    productName: string;
    quantitySold: number;
    totalRevenue: number; // Общая выручка от этого товара
    averagePrice: number; // Средняя цена продажи (если цена могла меняться)
}

// Тип для возвращаемого значения
type SalesReportResult = {
    success: boolean;
    report?: SalesReportItem[];
    message?: string;
    startDate?: Date;
    endDate?: Date;
    totalOverallRevenue?: number;
};

// Схема для валидации дат
const dateRangeSchema = z.object({
    startDate: z.coerce.date({ errorMap: () => ({ message: "Неверный формат начальной даты" }) }),
    endDate: z.coerce.date({ errorMap: () => ({ message: "Неверный формат конечной даты" }) }),
}).refine(data => data.endDate >= data.startDate, {
    message: "Конечная дата не может быть раньше начальной",
    path: ["endDate"],
});

export async function getSalesReport(
    params: { startDate: string | Date; endDate: string | Date }
): Promise<SalesReportResult> {
    // TODO: Проверка прав администратора

    const validation = dateRangeSchema.safeParse(params);
    if (!validation.success) {
        console.error("Date range validation failed:", validation.error.format());
        return { success: false, message: "Неверный диапазон дат." };
    }

    const { startDate, endDate } = validation.data;

    // Устанавливаем время для endDate на конец дня
    const adjustedEndDate = new Date(endDate);
    adjustedEndDate.setHours(23, 59, 59, 999);

    try {
        const orders = await prisma.order.findMany({
            where: {
                status: OrderStatus.SUCCEDED, // Учитываем только успешные/оплаченные заказы
                createdAt: {
                    gte: startDate,
                    lte: adjustedEndDate, // Используем скорректированную конечную дату
                },
            },
        });

        const productSalesMap = new Map<number, {
            productName: string;
            quantitySold: number;
            totalRevenue: number;
            prices: number[]; // Для расчета средней цены
        }>();

        let totalOverallRevenue = 0;

        for (const order of orders) {
            if (typeof order.items === 'string') {
                try {
                    const parsedOrderItems = orderItemsSchema.parse(JSON.parse(order.items));
                    for (const item of parsedOrderItems) {
                        if (item.productItem?.product) {
                            const productId = item.productItem.product.id;
                            const productName = item.productItem.product.name;
                            const itemPrice = item.productItem.price; // Цена за единицу данной вариации
                            const quantity = item.quantity;
                            // Рассчитываем цену с допами для каждой единицы товара
                            const additionalsTotalPerUnit = item.additionals?.reduce((sum, add) => sum + (add?.price ?? 0), 0) ?? 0;
                            const priceWithAdditionals = itemPrice + additionalsTotalPerUnit;
                            const revenueFromItem = quantity * priceWithAdditionals;

                            totalOverallRevenue += revenueFromItem;

                            const existingEntry = productSalesMap.get(productId);
                            if (existingEntry) {
                                existingEntry.quantitySold += quantity;
                                existingEntry.totalRevenue += revenueFromItem;
                                existingEntry.prices.push(priceWithAdditionals);
                            } else {
                                productSalesMap.set(productId, {
                                    productName,
                                    quantitySold: quantity,
                                    totalRevenue: revenueFromItem,
                                    prices: [priceWithAdditionals],
                                });
                            }
                        }
                    }
                } catch (e) {
                    console.warn(`Не удалось обработать товары для заказа ${order.id} при формировании отчета:`, e);
                }
            }
        }

        const report: SalesReportItem[] = Array.from(productSalesMap.entries()).map(
            ([productId, data]) => ({
                productId,
                productName: data.productName,
                quantitySold: data.quantitySold,
                totalRevenue: data.totalRevenue,
                averagePrice: data.prices.reduce((a, b) => a + b, 0) / data.prices.length || 0,
            })
        ).sort((a,b) => b.quantitySold - a.quantitySold); // Сортируем по количеству проданных


        return { success: true, report, startDate, endDate, totalOverallRevenue };

    } catch (error) {
        console.error("Error generating sales report:", error);
        return { success: false, message: 'Ошибка сервера при формировании отчета.' };
    }
}