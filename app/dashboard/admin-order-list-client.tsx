'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Order, OrderStatus } from '@prisma/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { updateOrderStatus } from '@/app/actions/admin-order-actions';
import toast from 'react-hot-toast';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Search } from 'lucide-react';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis
} from "@/shared/components/ui/pagination";
import { z } from 'zod';

const orderJsonProductSchema = z.object({ id: z.number(), name: z.string(), imageUrl: z.string().optional().nullable(), }).optional().nullable();
const orderJsonProductItemSchema = z.object({ id: z.number(), price: z.number(), productId: z.number(), product: orderJsonProductSchema, }).optional().nullable();
const orderJsonAdditionalSchema = z.object({ id: z.number(), name: z.string(), price: z.number(), });
const orderJsonItemSchema = z.object({ id: z.number(), quantity: z.number().int().positive(), productItemId: z.number(), productItem: orderJsonProductItemSchema, additionals: z.array(orderJsonAdditionalSchema).optional().nullable(), });
const orderItemsSchema = z.array(orderJsonItemSchema);

interface OrderListClientProps {
    initialOrders: Order[];
}

const formatDate = (date: Date | null | undefined) => date ? new Date(date).toLocaleString('ru-RU') : 'N/A';
const formatCurrency = (amount: number) => (amount).toFixed(2).replace('.', ',') + ' Br';

interface StatusSelectorProps {
    orderId: number;
    currentStatus: OrderStatus;
    onStatusSuccessfullyUpdated: (orderId: number, newStatus: OrderStatus) => void;
}

function StatusSelector({ orderId, currentStatus, onStatusSuccessfullyUpdated }: StatusSelectorProps) {
    const [isPending, startTransition] = React.useTransition();
    const handleStatusChange = (newStatusValue: string) => {
        const newStatus = newStatusValue as OrderStatus;
        if (Object.values(OrderStatus).includes(newStatus) && newStatus !== currentStatus) {
             startTransition(async () => {
                 try {
                     const result = await updateOrderStatus({ orderId, newStatus });
                     if (result.success) {
                         toast.success(`Статус заказа #${orderId} обновлен на ${newStatus}.`);
                         onStatusSuccessfullyUpdated(orderId, newStatus);
                     } else {
                         toast.error(result.message || 'Не удалось обновить статус.');
                     }
                 } catch (error) {
                     toast.error('Ошибка при обновлении статуса.');
                 }
             });
        }
    };

    return (
         <Select
            defaultValue={currentStatus}
            onValueChange={handleStatusChange}
            disabled={isPending}
        >
            <SelectTrigger className={`w-[150px] text-xs h-8 ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <SelectValue placeholder="Сменить статус..." />
            </SelectTrigger>
            <SelectContent>
                {Object.values(OrderStatus).map((status) => (
                    <SelectItem key={status} value={status} className="text-xs">
                        {status}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

const ORDERS_PER_PAGE = 10;

interface PopularProductData {
    productId: number; name: string; price: number; salesCount: number; totalRevenue: number;
}

export function OrderListClient({ initialOrders }: OrderListClientProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [orders, setOrders] = useState<Order[]>(initialOrders);

    useEffect(() => {
        setOrders(initialOrders);
    }, [initialOrders]);

    const handleOrderStatusUpdate = (orderId: number, newStatus: OrderStatus) => {
        setOrders(prevOrders =>
            prevOrders.map(order =>
                order.id === orderId ? { ...order, status: newStatus } : order
            )
        );
    };

    const filteredOrders = useMemo(() => {
        if (!searchTerm.trim()) return orders;
        const lowerSearchTerm = searchTerm.toLowerCase().trim();
        return orders.filter(order =>
            (order.fullName || '').toLowerCase().includes(lowerSearchTerm) ||
            (order.email || '').toLowerCase().includes(lowerSearchTerm) ||
            (order.phone || '').toLowerCase().includes(lowerSearchTerm) ||
            (order.address || '').toLowerCase().includes(lowerSearchTerm) ||
            order.totalAmount.toString().replace('.', ',').includes(lowerSearchTerm) ||
            order.id.toString().includes(lowerSearchTerm)
        );
    }, [orders, searchTerm]);

    const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);
    const paginatedOrders = useMemo(() => {
        const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;
        return filteredOrders.slice(startIndex, startIndex + ORDERS_PER_PAGE);
    }, [filteredOrders, currentPage]);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    const popularProducts = useMemo((): PopularProductData[] => {
        const productSalesMap = new Map<number, PopularProductData>();

        orders.forEach(order => {
            if (order.status === OrderStatus.SUCCEDED && typeof order.items === 'string') {
                try {
                    const parsedOrderItems = orderItemsSchema.parse(JSON.parse(order.items));
                    parsedOrderItems.forEach(item => {
                        if (item.productItem?.product) {
                            const productId = item.productItem.product.id;
                            const productName = item.productItem.product.name;
                            const displayPrice = item.productItem.price;
                            const quantity = item.quantity;
                            const revenueFromItem = quantity * item.productItem.price;

                            const existingEntry = productSalesMap.get(productId);
                            if (existingEntry) {
                                existingEntry.salesCount += quantity;
                                existingEntry.totalRevenue += revenueFromItem;
                            } else {
                                productSalesMap.set(productId, {
                                    productId, name: productName, price: displayPrice,
                                    salesCount: quantity, totalRevenue: revenueFromItem,
                                });
                            }
                        }
                    });
                } catch (e) {
                    console.warn(`Не удалось обработать товары для заказа ${order.id} при расчете популярности:`, e);
                }
            }
        });
        return Array.from(productSalesMap.values())
            .sort((a, b) => b.salesCount - a.salesCount || b.totalRevenue - a.totalRevenue)
            .slice(0, 15);
    }, [orders]);


    if (initialOrders.length === 0 && !searchTerm) {
        return <p className="text-center text-gray-500 mt-6">Заказы не найдены.</p>;
    }

    return (
        <div className="space-y-8 p-4 md:p-0">
            <div className="space-y-4">
                 <div className="mb-4">
                    <Label htmlFor="order-search" className="sr-only">Поиск заказов</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                            id="order-search"
                            type="text"
                            placeholder="Поиск по клиенту, email, ID..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-10 w-full md:w-1/2 lg:w-1/3"
                        />
                    </div>
                </div>

                {filteredOrders.length === 0 ? (
                    <p className="text-center text-gray-500 mt-6">
                        {searchTerm ? "Заказы по вашему запросу не найдены." : "Нет заказов, соответствующих фильтру."}
                    </p>
                ) : (
                    <>
                        <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
                            <Table>
                                <TableHeader>
                                    <TableRow className="dark:border-gray-700">
                                        <TableHead className="w-[60px] text-gray-700 dark:text-gray-300">ID</TableHead>
                                        <TableHead className="text-gray-700 dark:text-gray-300">Дата</TableHead>
                                        <TableHead className="text-gray-700 dark:text-gray-300">Клиент</TableHead>
                                        <TableHead className="text-gray-700 dark:text-gray-300">Email</TableHead>
                                        <TableHead className="text-gray-700 dark:text-gray-300">Телефон</TableHead>
                                        <TableHead className="text-gray-700 dark:text-gray-300">Адрес</TableHead>
                                        <TableHead className="text-gray-700 dark:text-gray-300">Сумма</TableHead>
                                        <TableHead className="text-center text-gray-700 dark:text-gray-300">Статус</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedOrders.map((order) => (
                                        <TableRow key={order.id} className="dark:border-gray-700">
                                            <TableCell className="font-medium text-gray-800 dark:text-gray-200">#{order.id}</TableCell>
                                            <TableCell className="text-xs whitespace-nowrap text-gray-800 dark:text-gray-200">{formatDate(order.createdAt)}</TableCell>
                                            <TableCell className="text-gray-800 dark:text-gray-200">{order.fullName}</TableCell>
                                            <TableCell className="text-gray-800 dark:text-gray-200">{order.email}</TableCell>
                                            <TableCell className="text-gray-800 dark:text-gray-200">{order.phone}</TableCell>
                                            <TableCell className="text-xs max-w-[200px] truncate text-gray-800 dark:text-gray-200" title={order.address || undefined}>{order.address}</TableCell>
                                            <TableCell className="font-semibold whitespace-nowrap text-gray-800 dark:text-gray-200">{formatCurrency(order.totalAmount)}</TableCell>
                                            <TableCell className="text-center">
                                                <StatusSelector
                                                    orderId={order.id}
                                                    currentStatus={order.status}
                                                    onStatusSuccessfullyUpdated={handleOrderStatusUpdate}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {totalPages > 1 && (
                            <div className="mt-8 flex justify-center">
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }} className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined} /></PaginationItem>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => {
                                            const showPage = totalPages <= 7 || pageNumber === 1 || pageNumber === totalPages || (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1);
                                            const showEllipsisBefore = pageNumber === currentPage - 2 && currentPage - 2 > 1 && totalPages > 7;
                                            const showEllipsisAfter = pageNumber === currentPage + 2 && currentPage + 2 < totalPages && totalPages > 7;
                                            if (showEllipsisBefore || showEllipsisAfter) return <PaginationItem key={`ellipsis-${pageNumber}`}><PaginationEllipsis /></PaginationItem>;
                                            if (showPage) return (<PaginationItem key={pageNumber}><PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(pageNumber); }} isActive={currentPage === pageNumber}>{pageNumber}</PaginationLink></PaginationItem>);
                                            return null;
                                        })}
                                        <PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }} className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined} /></PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        )}
                    </>
                )}
            </div>

            {popularProducts.length > 0 && (
                <div className="mt-12 pt-8 border-t dark:border-gray-700">
                    <h2 className="text-xl md:text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
                        Топ-15 популярных товаров
                    </h2>
                    <div className="overflow-x-auto rounded-lg border dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
                        <Table>
                            <TableHeader>
                                <TableRow className="dark:border-gray-600">
                                    <TableHead className="text-gray-700 dark:text-gray-300">Название товара</TableHead>
                                    <TableHead className="text-center text-gray-700 dark:text-gray-300">Продаж (шт.)</TableHead>
                                    <TableHead className="text-right text-gray-700 dark:text-gray-300">Цена за ед.</TableHead>
                                    <TableHead className="text-right text-gray-700 dark:text-gray-300">Общая выручка</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {popularProducts.map((product) => (
                                    <TableRow key={product.productId} className="dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <TableCell className="font-medium text-gray-900 dark:text-gray-100">{product.name}</TableCell>
                                        <TableCell className="text-center text-gray-700 dark:text-gray-300">{product.salesCount}</TableCell>
                                        <TableCell className="text-right text-gray-700 dark:text-gray-300">{formatCurrency(product.price)}</TableCell>
                                        <TableCell className="text-right font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(product.totalRevenue)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </div>
    );
}