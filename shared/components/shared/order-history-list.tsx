'use client';

import { getMyOrders } from '@/app/actions/user-actions';
import { Order, OrderStatus } from '@prisma/client';
import React, { useEffect, useState, useMemo } from 'react';
import { Badge } from "@/shared/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Terminal, Search } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, } from '../ui/accordion';
import { z } from 'zod';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {  Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious, } from '../ui/pagination';

const formatDate = (date: Date | null | undefined) => date ? new Date(date).toLocaleDateString('ru-RU') : 'N/A';
const formatCurrency = (amount: number) => (amount).toFixed(2).replace('.', ',') + ' Br';

const orderJsonProductSchema = z.object({
    id: z.number(), name: z.string(), imageUrl: z.string().optional().nullable(),
}).optional().nullable();
const orderJsonProductItemSchema = z.object({
    id: z.number(), price: z.number(), productId: z.number(), product: orderJsonProductSchema,
}).optional().nullable();
const orderJsonAdditionalSchema = z.object({
    id: z.number(), name: z.string(), price: z.number(),
});
const orderJsonItemSchema = z.object({
    id: z.number(), quantity: z.number().int().positive(), productItemId: z.number(),
    productItem: orderJsonProductItemSchema,
    additionals: z.array(orderJsonAdditionalSchema).optional().nullable(),
});
type OrderJsonItem = z.infer<typeof orderJsonItemSchema>;
const orderItemsSchema = z.array(orderJsonItemSchema);

const ORDERS_PER_PAGE = 5;

export default function OrderHistoryList() {
    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const fetchOrders = async () => {
            setIsLoading(true); setError(null);
            try {
                const result = await getMyOrders();
                if (result.success && result.orders) {
                    setAllOrders(result.orders);
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

    const filteredOrders = useMemo(() => {
        if (!searchTerm) return allOrders;
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return allOrders.filter(order => {
            if (order.id.toString().includes(lowerCaseSearchTerm)) return true;
            if (typeof order.items === 'string') {
                try {
                    const items = orderItemsSchema.parse(JSON.parse(order.items));
                    return items.some(item =>
                        item.productItem?.product?.name?.toLowerCase().includes(lowerCaseSearchTerm)
                    );
                } catch { }
            }
            return false;
        });
    }, [allOrders, searchTerm]);

    // Пагинация
    const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);
    const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;
    const endIndex = startIndex + ORDERS_PER_PAGE;
    const listToDisplay = filteredOrders.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const localizeStatus = (status: OrderStatus): string => {
        switch (status) {
            case OrderStatus.PENDING: return 'Ожидает';
            case OrderStatus.SUCCEDED: return 'Одобрено';
            case OrderStatus.CANCELLED: return 'Отменен';
            default: return status;
        }
    };

    if (isLoading) return <div className="text-center p-4">Загрузка истории заказов...</div>;
    if (error) return (
        <Alert variant="destructive" className="mt-4">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Ошибка</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
    );

    return (
        <div className="w-full">
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Поиск..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="pl-10"
                    />
                </div>
            </div>

            {allOrders.length === 0 && !isLoading && (
                <p className="text-center text-gray-500 mt-4">У вас пока нет заказов.</p>
            )}

            {filteredOrders.length === 0 && searchTerm && !isLoading && (
                 <p className="text-center text-gray-500 mt-4">Заказы по вашему запросу не найдены.</p>
            )}


            {listToDisplay.length > 0 && (
                <Accordion type="single" collapsible className="w-full space-y-3">
                    {listToDisplay.map((order) => {
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
                                    parseError = "Некорректный формат данных товаров.";
                                }
                            } catch (e) {
                                console.error(`Failed to parse items JSON for order ${order.id}:`, e);
                                parseError = "Ошибка чтения данных товаров.";
                            }
                        } else if (order.items !== null && order.items !== undefined) {
                             parseError = "Неожиданный формат данных товаров.";
                        }

                        return (
                            <AccordionItem value={`order-${order.id}`} key={order.id} className="border rounded-md px-4 shadow-sm bg-white dark:bg-gray-800">
                                <AccordionTrigger className="hover:no-underline py-3">
                                    <div className="flex justify-between items-center w-full pr-2">
                                        <div className="text-sm text-left">
                                            <span className="font-medium">Заказ #{order.id}</span>
                                            <span className="text-gray-500 dark:text-gray-400 ml-2">от {formatDate(order.createdAt)}</span>
                                        </div>
                                        <div className="text-sm text-right space-x-3 flex items-center">
                                            <Badge
                                                variant={ order.status === OrderStatus.SUCCEDED ? 'default' : order.status === OrderStatus.PENDING ? 'secondary' : 'outline' }
                                                className="text-xs px-2 py-0.5">
                                                {localizeStatus(order.status)}
                                            </Badge>
                                            <span className="font-semibold">{formatCurrency(order.totalAmount)}</span>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-3 pb-3 border-t border-gray-100 dark:border-gray-700">
                                    {parseError ? (
                                        <p className="text-sm text-red-600 px-2">{parseError}</p>
                                    ) : parsedItems.length > 0 ? (
                                        <ul className="space-y-1.5 text-sm px-2">
                                            {parsedItems.map((item, index) => {
                                                const productName = item.productItem?.product?.name ?? `Товар (ID: ${item.productItemId})`;
                                                const productQuantity = item.quantity;
                                                const itemPrice = item.productItem?.price ?? 0;
                                                const additionalsTotal = item.additionals?.reduce((sum, add) => sum + (add?.price ?? 0), 0) ?? 0;
                                                const displayPrice = itemPrice + additionalsTotal;

                                                return (
                                                     <li key={`${item.id}-${index}-${item.productItemId}`} className="flex justify-between items-start py-0.5 border-b last:border-b-0 dark:border-gray-600">
                                                         <span className="flex flex-col text-gray-700 dark:text-gray-300 mr-2">
                                                              <span>
                                                                  {productName}
                                                                  {item.additionals && item.additionals.length > 0 && (
                                                                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                                                                          (+ {item.additionals.map(a => a?.name).filter(Boolean).join(', ')})
                                                                      </span>
                                                                  )}
                                                              </span>
                                                               <span className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                                                                  Количество: {productQuantity}
                                                              </span>
                                                         </span>
                                                         <span className="text-gray-800 dark:text-gray-200 w-24 text-right flex-shrink-0">
                                                            {formatCurrency(displayPrice * productQuantity)}
                                                         </span>
                                                     </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 px-2">Состав заказа не найден.</p>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            )}

            {totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                                    className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
                                />

                            </PaginationItem>
                            {[...Array(totalPages).keys()].map(num => {
                                const pageNumber = num + 1;
                                
                                if (totalPages <= 7 || // Показать все, если мало страниц
                                    pageNumber === 1 || // Всегда показывать первую
                                    pageNumber === totalPages || // Всегда показывать последнюю
                                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1) // Показать текущую и соседние
                                ) {
                                    return (
                                        <PaginationItem key={pageNumber}>
                                            <PaginationLink
                                                href="#"
                                                onClick={(e) => { e.preventDefault(); handlePageChange(pageNumber); }}
                                                isActive={currentPage === pageNumber}
                                            >
                                                {pageNumber}
                                            </PaginationLink>
                                        </PaginationItem>
                                    );
                                } else if (
                                    (pageNumber === currentPage - 2 && pageNumber > 1) ||
                                    (pageNumber === currentPage + 2 && pageNumber < totalPages)
                                ) {
                                    return <PaginationItem key={`ellipsis-${pageNumber}`}><PaginationEllipsis /></PaginationItem>;
                                }
                                return null;
                            })}
                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </div>
    );
}