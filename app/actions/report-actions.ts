'use server';

import { prisma } from '@/prisma/prisma-client';
import { OrderStatus, Prisma } from '@prisma/client';
import { z } from 'zod';

const orderJsonProductSchema = z.object({
    id: z.number(),
    name: z.string(),
    imageUrl: z.string().optional().nullable(),
}).optional().nullable();

const orderJsonProductItemSchema = z.object({
    id: z.number(),
    price: z.number(),
    productId: z.number(),
    product: orderJsonProductSchema,
}).optional().nullable();

const orderJsonAdditionalSchema = z.object({
    id: z.number(),
    name: z.string(),
    price: z.number(),
});

const orderJsonItemSchema = z.object({
    id: z.number(),
    quantity: z.number().int().positive(),
    productItemId: z.number(),
    productItem: orderJsonProductItemSchema,
    additionals: z.array(orderJsonAdditionalSchema).optional().nullable(),
});
const orderItemsSchema = z.array(orderJsonItemSchema);

export interface SalesReportItem {
    productId: number;
    productName: string;
    quantitySold: number;
    totalRevenue: number;
    averagePrice: number;
}

export interface RatingReportItem {
    productId: number;
    productName: string;
    quantitySold: number;
}

type ReportData = SalesReportItem[] | RatingReportItem[];

type ReportResult = {
    success: boolean;
    reportType?: 'sales' | 'rating';
    report?: ReportData;
    message?: string;
    startDate?: Date;
    endDate?: Date;
    totalOverallRevenue?: number;
};

const reportParamsSchema = z.object({
    startDate: z.coerce.date({ errorMap: () => ({ message: "Неверный формат начальной даты" }) }),
    endDate: z.coerce.date({ errorMap: () => ({ message: "Неверный формат конечной даты" }) }),
    reportType: z.enum(['sales', 'rating'], { errorMap: () => ({ message: "Неверный тип отчета" }) }),
}).refine(data => data.endDate >= data.startDate, {
    message: "Конечная дата не может быть раньше начальной",
    path: ["endDate"],
});

export async function generateReport(
    params: { startDate: string | Date; endDate: string | Date; reportType: 'sales' | 'rating' }
): Promise<ReportResult> {

    const validation = reportParamsSchema.safeParse(params);
    if (!validation.success) {
        console.error("Report params validation failed:", validation.error.format());
        return { success: false, message: "Неверные параметры отчета." };
    }

    const { startDate, endDate, reportType } = validation.data;

    const adjustedEndDate = new Date(endDate);
    adjustedEndDate.setHours(23, 59, 59, 999);

    try {
        const orders = await prisma.order.findMany({
            where: {
                status: OrderStatus.SUCCEDED,
                createdAt: {
                    gte: startDate,
                    lte: adjustedEndDate,
                },
            },
        });

        const productSalesMap = new Map<number, {
            productName: string;
            quantitySold: number;
            totalRevenue: number;
            pricesWithAddons: number[];
        }>();

        let totalOverallRevenueForSales = 0;

        for (const order of orders) {
            if (typeof order.items === 'string') {
                try {
                    const parsedOrderItems = orderItemsSchema.parse(JSON.parse(order.items));
                    for (const item of parsedOrderItems) {
                        if (item.productItem?.product) {
                            const productId = item.productItem.product.id;
                            const productName = item.productItem.product.name;
                            const baseItemPrice = item.productItem.price;
                            const quantity = item.quantity;

                            const additionalsTotalPerUnit = item.additionals?.reduce((sum, add) => sum + (add?.price ?? 0), 0) ?? 0;
                            const pricePerUnitWithAddons = baseItemPrice + additionalsTotalPerUnit;
                            const revenueFromThisLineItem = quantity * pricePerUnitWithAddons;

                            if (reportType === 'sales') {
                                totalOverallRevenueForSales += revenueFromThisLineItem;
                            }

                            const existingEntry = productSalesMap.get(productId);
                            if (existingEntry) {
                                existingEntry.quantitySold += quantity;
                                existingEntry.totalRevenue += revenueFromThisLineItem;
                                for (let i = 0; i < quantity; i++) {
                                    existingEntry.pricesWithAddons.push(pricePerUnitWithAddons);
                                }
                            } else {
                                productSalesMap.set(productId, {
                                    productName,
                                    quantitySold: quantity,
                                    totalRevenue: revenueFromThisLineItem,
                                    pricesWithAddons: Array(quantity).fill(pricePerUnitWithAddons),
                                });
                            }
                        }
                    }
                } catch (e) {
                    console.warn(`Не удалось обработать товары для заказа ${order.id} при формировании отчета:`, e);
                }
            }
        }

        let report: ReportData = [];

        if (reportType === 'sales') {
            report = Array.from(productSalesMap.entries()).map(
                ([productId, data]) => ({
                    productId,
                    productName: data.productName,
                    quantitySold: data.quantitySold,
                    totalRevenue: data.totalRevenue,
                    averagePrice: data.pricesWithAddons.length > 0
                        ? data.pricesWithAddons.reduce((a, b) => a + b, 0) / data.pricesWithAddons.length
                        : 0,
                })
            ).sort((a, b) => b.totalRevenue - a.totalRevenue);
        } else if (reportType === 'rating') {
            report = Array.from(productSalesMap.values()).map(
                (data) => ({
                    productId: Array.from(productSalesMap.entries()).find(entry => entry[1] === data)?.[0] || 0,
                    productName: data.productName,
                    quantitySold: data.quantitySold,
                })
            ).sort((a, b) => b.quantitySold - a.quantitySold)
             .slice(0, 20); // Топ-20
        }

        return {
            success: true,
            report,
            reportType,
            startDate,
            endDate: adjustedEndDate,
            totalOverallRevenue: reportType === 'sales' ? totalOverallRevenueForSales : undefined
        };

    } catch (error) {
        console.error(`Error generating ${reportType} report:`, error);
        return { success: false, message: 'Ошибка сервера при формировании отчета.' };
    }
}