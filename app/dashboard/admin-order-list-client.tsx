'use client';

import React, { useState, useMemo, useEffect, useTransition } from 'react';
import { Order, OrderStatus } from '@prisma/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { updateOrderStatus } from '../actions/admin-order-actions';
import toast from 'react-hot-toast';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Search, TrendingUp } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/shared/components/ui/accordion";
import { Badge } from '@/shared/components/ui/badge';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/shared/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { z } from 'zod';
import { cn } from '@/shared/lib/utils';


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

interface OrderListClientProps {
    initialOrders: Order[];
}

const formatDate = (date: Date | null | undefined) => date ? new Date(date).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'}) : 'N/A';
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
            <SelectTrigger className={cn(`w-[150px] text-xs h-8`, isPending && 'opacity-50 cursor-not-allowed')}>
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
    productId: number;
    productName: string;
    salesCount: number;
    totalRevenue: number;
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

    const localizeStatus = (status: OrderStatus): string => {
        switch (status) {
            case OrderStatus.PENDING: return 'Ожидает';
            case OrderStatus.SUCCEDED: return 'Одобрено';
            case OrderStatus.CANCELLED: return 'Отменен';
            default: return status;
        }
    };

    const popularProducts = useMemo((): PopularProductData[] => {
        const productSalesMap = new Map<number, PopularProductData>();
        orders.forEach(order => {
            if (order.status === OrderStatus.SUCCEDED && typeof order.items === 'string') {
                try {
                    const parsedOrderItems = orderItemsSchema.parse(JSON.parse(order.items));
                    parsedOrderItems.forEach(item => {
                        if (item.productItem?.product) {
                            const mainProductId = item.productItem.product.id;
                            const mainProductName = item.productItem.product.name;
                            const quantity = item.quantity;
                            const revenueFromItem = quantity * (item.productItem.price ?? 0);

                            const existingEntry = productSalesMap.get(mainProductId);
                            if (existingEntry) {
                                existingEntry.salesCount += quantity;
                                existingEntry.totalRevenue += revenueFromItem;
                            } else {
                                productSalesMap.set(mainProductId, {
                                    productId: mainProductId,
                                    productName: mainProductName,
                                    salesCount: quantity,
                                    totalRevenue: revenueFromItem,
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
        <div className="space-y-6">
            <div className="mb-4">
                <Label htmlFor="order-search" className="sr-only">Поиск заказов</Label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        id="order-search"
                        type="text"
                        placeholder="Поиск..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="pl-10 w-full md:w-1/2 lg:w-1/3 h-10"
                    />
                </div>
            </div>

            {filteredOrders.length === 0 ? (
                <p className="text-center text-gray-500 mt-6">
                    {searchTerm ? "Заказы по вашему запросу не найдены." : "Нет заказов, соответствующих фильтру."}
                </p>
            ) : (
                <Accordion type="multiple" className="w-full space-y-3">
                    {paginatedOrders.map((order) => {
                        let parsedItems: OrderJsonItem[] = [];
                        let parseError: string | null = null;
                        if (typeof order.items === 'string') {
                            try {
                                const jsonData = JSON.parse(order.items);
                                const validationResult = orderItemsSchema.safeParse(jsonData);
                                if (validationResult.success) parsedItems = validationResult.data;
                                else { console.error(`Zod validation for order ${order.id}:`, validationResult.error.format()); parseError = "Некорректный формат данных товаров в заказе."; }
                            } catch (e) { console.error(`JSON parse error for order ${order.id}:`, e); parseError = "Ошибка чтения данных товаров в заказе."; }
                        } else if (order.items !== null && order.items !== undefined) parseError = "Неожиданный формат данных товаров.";

                        return (
                            <AccordionItem value={`order-${order.id}`} key={order.id} className="border rounded-lg shadow-sm overflow-hidden dark:border-gray-700">
                                <AccordionTrigger className="hover:no-underline px-4 py-3 bg-gray-50 dark:bg-gray-800 transition-colors">
                                    <div className="flex flex-wrap justify-between items-center w-full gap-x-4 gap-y-2">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-1">
                                            <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">Заказ #{order.id}</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(order.createdAt)}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <StatusSelector
                                                orderId={order.id}
                                                currentStatus={order.status}
                                                onStatusSuccessfullyUpdated={handleOrderStatusUpdate}
                                            />
                                            <Badge
                                                variant={order.status === OrderStatus.SUCCEDED ? 'default' : order.status === OrderStatus.CANCELLED ? 'destructive' : 'secondary'}
                                                className="text-xs whitespace-nowrap"
                                            >
                                                {localizeStatus(order.status)}
                                            </Badge>
                                            <span className="font-semibold text-sm text-gray-800 dark:text-gray-100 whitespace-nowrap">
                                                {formatCurrency(order.totalAmount)}
                                            </span>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-4 pb-4 px-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800/50">
                                    <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
                                        <div className="space-y-1 text-sm">
                                            <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Информация о клиенте:</h4>
                                            <p><strong className="text-gray-600 dark:text-gray-400">Имя:</strong> {order.fullName}</p>
                                            <p><strong className="text-gray-600 dark:text-gray-400">Email:</strong> {order.email}</p>
                                            <p><strong className="text-gray-600 dark:text-gray-400">Телефон:</strong> {order.phone}</p>
                                            <div className="mt-1">
                                                <strong className="block text-gray-600 dark:text-gray-400 mb-0.5">Адрес доставки:</strong>
                                                <span className={cn(order.address && order.address.trim() !== '' ? "text-gray-800 dark:text-gray-200" : "italic text-gray-500 dark:text-gray-400")}>
                                                    {order.address && order.address.trim() !== '' ? order.address : "Самовывоз"}
                                                </span>
                                            </div>
                                            {order.comment && <p className="mt-1"><strong className="text-gray-600 dark:text-gray-400">Комментарий:</strong> {order.comment}</p>}
                                        </div>

                                        {/* Товары в заказе */}
                                        <div className="space-y-1 text-sm">
                                            <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Состав заказа:</h4>
                                            {parseError ? (
                                                <p className="text-red-600">{parseError}</p>
                                            ) : parsedItems.length > 0 ? (
                                                <ul className="space-y-1.5">
                                                    {parsedItems.map((item, index) => {
                                                        const productName = item.productItem?.product?.name ?? `Товар (ID: ${item.productItemId})`;
                                                        const itemPrice = item.productItem?.price ?? 0;
                                                        const additionalsTotal = item.additionals?.reduce((sum, add) => sum + (add?.price ?? 0), 0) ?? 0;
                                                        const displayPricePerOne = itemPrice + additionalsTotal;
                                                        const totalItemPrice = displayPricePerOne * item.quantity;

                                                        return (
                                                            <li key={`${item.id}-${index}-${item.productItemId}`} className="flex justify-between items-start py-1 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                                                                <div className="flex-grow pr-2">
                                                                    <span className="text-gray-800 dark:text-gray-100">{productName}</span>
                                                                    {item.additionals && item.additionals.length > 0 && (
                                                                        <span className="block text-xs text-gray-500 dark:text-gray-400">
                                                                            (+ {item.additionals.map(a => a?.name).filter(Boolean).join(', ')})
                                                                        </span>
                                                                    )}
                                                                    <span className="block text-xs text-gray-500 dark:text-gray-400">Кол-во: {item.quantity}</span>
                                                                </div>
                                                                <div className="text-right flex-shrink-0">
                                                                    <span className="text-xs text-gray-600 dark:text-gray-300">{formatCurrency(displayPricePerOne)} /шт.</span>
                                                                    <br/>
                                                                    <span className="font-medium text-gray-800 dark:text-gray-100">{formatCurrency(totalItemPrice)}</span>
                                                                </div>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            ) : (
                                                <p className="text-gray-500">Состав заказа не найден.</p>
                                            )}
                                        </div>
                                    </div>
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
                            <PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }} className={cn(currentPage === 1 && "pointer-events-none opacity-50")} /></PaginationItem>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => {
                                const showPage = totalPages <= 7 || pageNumber === 1 || pageNumber === totalPages || (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 1);
                                const showEllipsisBefore = pageNumber === currentPage - 2 && currentPage - 2 > 1 && totalPages > 7;
                                const showEllipsisAfter = pageNumber === currentPage + 2 && currentPage + 2 < totalPages && totalPages > 7;

                                if (showEllipsisBefore) return <PaginationItem key={`ellipsis-start-${pageNumber}`}><PaginationEllipsis /></PaginationItem>;
                                if (!showPage && pageNumber !== 1 && pageNumber !== totalPages) return null;
                                if (showEllipsisAfter) return <PaginationItem key={`ellipsis-end-${pageNumber}`}><PaginationEllipsis /></PaginationItem>;
                                if (showPage) return (<PaginationItem key={pageNumber}><PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(pageNumber); }} isActive={currentPage === pageNumber}>{pageNumber}</PaginationLink></PaginationItem>);
                                return null;
                            })}
                            <PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }} className={cn(currentPage === totalPages && "pointer-events-none opacity-50")} /></PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}

            {popularProducts.length > 0 && (
                <div className="pt-8 border-t dark:border-gray-700">
                    <h2 className="text-xl md:text-2xl font-semibold mb-6 text-gray-800 dark:text-white flex items-center">
                        <TrendingUp className="mr-3 h-6 w-6 text-primary" />
                        Топ-15 популярных товаров
                    </h2>
                    <div className="overflow-x-auto rounded-lg border dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
                        <Table>
                            <TableHeader>
                                <TableRow className="dark:border-gray-600">
                                    <TableHead className="text-gray-700 dark:text-gray-300">Название</TableHead>
                                    <TableHead className="text-center text-gray-700 dark:text-gray-300">Продано (шт.)</TableHead>
                                    <TableHead className="text-right text-gray-700 dark:text-gray-300">Выручка</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {popularProducts.map((product) => (
                                    <TableRow key={product.productId} className="dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <TableCell className="font-medium text-gray-900 dark:text-gray-100">{product.productName}</TableCell>
                                        <TableCell className="text-center text-gray-700 dark:text-gray-300">{product.salesCount}</TableCell>
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