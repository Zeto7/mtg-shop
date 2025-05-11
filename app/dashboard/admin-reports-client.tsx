'use client';

import React, { useState, useMemo } from 'react';
import { Order, OrderStatus } from '@prisma/client';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { DateRangePicker } from '@/shared/components/shared/date-range-picker';
import { DateRange } from 'react-day-picker';
import { z } from 'zod';

const orderJsonProductSchema = z.object({ id: z.number(), name: z.string(), imageUrl: z.string().optional().nullable() }).optional().nullable();
const orderJsonProductItemSchema = z.object({ id: z.number(), price: z.number(), productId: z.number(), product: orderJsonProductSchema }).optional().nullable();
const orderJsonAdditionalSchema = z.object({ id: z.number(), name: z.string(), price: z.number() });
const orderJsonItemSchema = z.object({ id: z.number(), quantity: z.number().int().positive(), productItemId: z.number(), productItem: orderJsonProductItemSchema, additionals: z.array(orderJsonAdditionalSchema).optional().nullable() });
const orderItemsSchema = z.array(orderJsonItemSchema);

const formatCurrency = (amount: number) => (amount).toFixed(2).replace('.', ',') + ' Br';

interface SalesReportItem {
    productId: number;
    productName: string;
    quantitySold: number;
    totalRevenue: number;
    averagePrice: number;
}

interface AdminReportsClientProps {
    allOrders: Order[];
}

export function AdminReportsClient({ allOrders }: AdminReportsClientProps) {
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [reportData, setReportData] = useState<SalesReportItem[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateReport = () => {
        if (!dateRange || !dateRange.from || !dateRange.to) {
            alert("Пожалуйста, выберите начальную и конечную дату.");
            return;
        }
        setIsGenerating(true);


        const startDate = new Date(dateRange.from.setHours(0, 0, 0, 0));
        const endDate = new Date(dateRange.to.setHours(23, 59, 59, 999));

        const salesMap = new Map<number, SalesReportItem>();

        allOrders.forEach(order => {
            const orderDate = new Date(order.createdAt);
            if (
                order.status === OrderStatus.SUCCEDED &&
                orderDate >= startDate &&
                orderDate <= endDate &&
                typeof order.items === 'string'
            ) {
                try {
                    const parsedOrderItems = orderItemsSchema.parse(JSON.parse(order.items));
                    parsedOrderItems.forEach(item => {
                        if (item.productItem?.product) {
                            const productId = item.productItem.product.id;
                            const productName = item.productItem.product.name;
                            const quantity = item.quantity;
                            const pricePerItem = item.productItem.price;
                            const revenueFromItem = quantity * pricePerItem;

                            const existing = salesMap.get(productId);
                            if (existing) {
                                existing.quantitySold += quantity;
                                existing.totalRevenue += revenueFromItem;
                            } else {
                                salesMap.set(productId, {
                                    productId,
                                    productName,
                                    quantitySold: quantity,
                                    totalRevenue: revenueFromItem,
                                    averagePrice: 0
                                });
                            }
                        }
                    });
                } catch (e) {
                    console.warn("Ошибка парсинга товаров в заказе для отчета:", order.id, e);
                }
            }
        });

        const report = Array.from(salesMap.values()).map(item => ({
            ...item,
            averagePrice: item.quantitySold > 0 ? item.totalRevenue / item.quantitySold : 0,
        })).sort((a, b) => b.quantitySold - a.quantitySold || b.totalRevenue - a.totalRevenue);

        setReportData(report);
        setIsGenerating(false);
    };

    return (
        <div className="p-4 md:p-6 border rounded-lg bg-white dark:bg-gray-800 shadow-sm space-y-6">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white">Отчет о продажах за период</h2>

            <div className="flex flex-col sm:flex-row sm:items-end gap-4 p-4 border rounded-md dark:border-gray-700">
                <div className="flex-grow">
                    <Label htmlFor="date-range-picker" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Выберите период:
                    </Label>
                    {/* Если у вас есть DateRangePicker от ShadCN */}
                    <DateRangePicker
                        date={dateRange}
                        onDateChange={setDateRange}
                        className="w-full sm:w-auto"
                    />
                    {/* Альтернатива, если нет DateRangePicker: два Input type="date" */}
                    {/*
                    <div className="flex gap-2">
                        <Input
                            type="date"
                            value={dateRange?.from?.toISOString().split('T')[0] || ''}
                            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value ? new Date(e.target.value) : undefined }))}
                            className="w-full"
                        />
                        <Input
                            type="date"
                            value={dateRange?.to?.toISOString().split('T')[0] || ''}
                            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value ? new Date(e.target.value) : undefined }))}
                            className="w-full"
                        />
                    </div>
                    */}
                </div>
                <Button onClick={handleGenerateReport} disabled={isGenerating || !dateRange?.from || !dateRange?.to} className="w-full sm:w-auto">
                    {isGenerating ? 'Генерация...' : 'Сформировать отчет'}
                </Button>
            </div>

            {reportData.length > 0 && !isGenerating && (
                <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
                        Результаты отчета за период: {dateRange?.from?.toLocaleDateString('ru-RU')} - {dateRange?.to?.toLocaleDateString('ru-RU')}
                    </h3>
                    <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
                        <Table>
                            <TableHeader>
                                <TableRow className="dark:border-gray-600">
                                    <TableHead className="text-gray-700 dark:text-gray-300">ID Товара</TableHead>
                                    <TableHead className="text-gray-700 dark:text-gray-300">Название товара</TableHead>
                                    <TableHead className="text-center text-gray-700 dark:text-gray-300">Продано (шт.)</TableHead>
                                    <TableHead className="text-right text-gray-700 dark:text-gray-300">Средняя цена</TableHead>
                                    <TableHead className="text-right text-gray-700 dark:text-gray-300">Общая выручка</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reportData.map((item) => (
                                    <TableRow key={item.productId} className="dark:border-gray-600">
                                        <TableCell className="font-medium text-gray-900 dark:text-gray-100">{item.productId}</TableCell>
                                        <TableCell className="text-gray-700 dark:text-gray-300">{item.productName}</TableCell>
                                        <TableCell className="text-center text-gray-700 dark:text-gray-300">{item.quantitySold}</TableCell>
                                        <TableCell className="text-right text-gray-700 dark:text-gray-300">{formatCurrency(item.averagePrice)}</TableCell>
                                        <TableCell className="text-right font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(item.totalRevenue)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
            {!reportData.length && !isGenerating && dateRange?.from && (
                 <p className="text-center text-gray-500 mt-6">Нет данных о продажах за выбранный период.</p>
            )}
        </div>
    );
}