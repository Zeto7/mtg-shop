'use client';

import { getMyOrders } from '@/app/actions/user-actions';
import { Order, OrderStatus } from '@prisma/client';
import React, { useEffect, useState } from 'react';
import { Badge } from "@/shared/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Terminal } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, } from '../ui/accordion';
import { z } from 'zod';

const formatDate = (date: Date | null | undefined) => date ? new Date(date).toLocaleDateString('ru-RU') : 'N/A';
const formatCurrency = (amount: number) => (amount).toFixed(2).replace('.', ',') + ' Br';

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

type OrderJsonItem = z.infer<typeof orderJsonItemSchema>;

const orderItemsSchema = z.array(orderJsonItemSchema);


export default function OrderHistoryList() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrders = async () => {
            setIsLoading(true); setError(null);
            try {
                const result = await getMyOrders();
                if (result.success && result.orders) {
                    setOrders(result.orders);
                } else {
                     setError(result.message || 'Не удалось загрузить историю заказов.');
                }
            } catch(err: any) {
                 console.error("Failed to fetch orders:", err);
                 setError(err?.message || 'Ошибка при загрузке истории заказов.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrders();
    }, []);

    if (isLoading) return <div className="text-center p-4">Загрузка истории заказов...</div>;
    if (error) return (
        <Alert variant="destructive" className="mt-4">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Ошибка</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
    );
    if (orders.length === 0) return <p className="text-center text-gray-500 mt-4">У вас пока нет заказов.</p>;

    const localizeStatus = (status: OrderStatus): string => {
        switch (status) {
            case OrderStatus.PENDING: return 'Ожидает';
            case OrderStatus.SUCCEDED: return 'Одобрено';
            case OrderStatus.CANCELLED: return 'Отменен';
            default: return status;
        }
    };

    return (
        <Accordion type="single" collapsible className="w-full space-y-4">
            {orders.map((order) => {
                let parsedItems: OrderJsonItem[] = [];
                let parseError: string | null = null;

                if (typeof order.items === 'string') {
                    try {
                        const jsonData = JSON.parse(order.items);
                        const validationResult = orderItemsSchema.safeParse(jsonData);

                        if (validationResult.success) {
                            parsedItems = validationResult.data;
                        } else {
                            console.error(`Zod validation failed for order ${order.id}:`, validationResult.error.format());
                            parseError = "Некорректный формат данных товаров в заказе.";
                        }
                    } catch (e) {
                        console.error(`Failed to parse items JSON for order ${order.id}:`, e);
                        parseError = "Ошибка чтения данных товаров в заказе.";
                    }
                } else if (order.items !== null && order.items !== undefined) {
                    console.warn(`Order items for order ${order.id} is not a string:`, order.items);
                    parseError = "Неожиданный формат данных товаров.";
                }

                return (
                    <AccordionItem value={`order-${order.id}`} key={order.id} className="border rounded-md px-4 shadow-sm">
                        <AccordionTrigger className="hover:no-underline py-3">
                            <div className="flex justify-between items-center w-full pr-2">
                                <div className="text-sm text-left">
                                    <span className="font-medium">Заказ #{order.id}</span>
                                    <span className="text-gray-500 ml-2">от {formatDate(order.createdAt)}</span>
                                </div>
                                <div className="text-sm text-right space-x-3 flex items-center">
                                    <Badge variant={ order.status === OrderStatus.SUCCEDED ? 'default' : order.status === OrderStatus.PENDING ? 'secondary' : 'outline' }
                                        className="text-xs px-2 py-0.5">
                                        {localizeStatus(order.status)}
                                    </Badge>
                                    <span className="font-semibold">{formatCurrency(order.totalAmount)}</span>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-3 pb-3 border-t border-gray-100">
                            {parseError ? (
                                <p className="text-sm text-red-600 px-2">{parseError}</p>
                            ) : parsedItems.length > 0 ? (
                                <ul className="space-y-1.5 text-sm px-2">
                                    {parsedItems.map((item, index) => {
                                        const productName = item.productItem?.product?.name ?? `Товар ID: ${item.productItemId}`;
                                        const itemPrice = item.productItem?.price ?? 0;
                                        const additionalsTotal = item.additionals?.reduce((sum, add) => sum + (add?.price ?? 0), 0) ?? 0;
                                        const displayPrice = itemPrice + additionalsTotal;

                                        return (
                                             <li key={`${item.id}-${index}-${item.productItemId}`} className="flex justify-between items-center py-0.5">
                                                 <span className="text-gray-700">
                                                     {productName}
                                                      {item.additionals && item.additionals.length > 0 && (
                                                           <span className="text-xs text-gray-500 ml-1">
                                                               (+ {item.additionals.map(a => a?.name).filter(Boolean).join(', ')})
                                                           </span>
                                                       )}
                                                 </span>
                                             </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-500 px-2">Состав заказа не найден.</p>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                );
            })}
        </Accordion>
    );
}