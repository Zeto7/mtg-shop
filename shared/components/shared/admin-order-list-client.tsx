'use client';

import React, { useState, useTransition } from 'react';
import { Order, OrderStatus } from '@prisma/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Badge } from "@/shared/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { updateOrderStatus } from '@/app/actions/admin-order-actions';
import toast from 'react-hot-toast';

interface OrderListClientProps {
    initialOrders: Order[];
}

const formatDate = (date: Date | null | undefined) => date ? new Date(date).toLocaleString('ru-RU') : 'N/A';
const formatCurrency = (amount: number) => (amount / 100).toFixed(2).replace('.', ',') + ' Br';

function StatusSelector({ orderId, currentStatus }: { orderId: number; currentStatus: OrderStatus }) {
    const [isPending, startTransition] = useTransition();
    const handleStatusChange = (newStatus: string) => {
        if (Object.values(OrderStatus).includes(newStatus as OrderStatus) && newStatus !== currentStatus) {
             startTransition(async () => {
                 try {
                     const result = await updateOrderStatus({ orderId, newStatus: newStatus as OrderStatus });
                     if (result.success) {
                         toast.success(`Статус заказа #${orderId} обновлен.`);
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
            <SelectTrigger className={`w-[150px] text-xs h-8 ${isPending ? 'opacity-50' : ''}`}>
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


export function OrderListClient({ initialOrders }: OrderListClientProps) {
    const orders = initialOrders;

    if (!orders || orders.length === 0) {
        return <p className="text-center text-gray-500 mt-6">Заказы не найдены.</p>;
    }

    return (
         <div className="overflow-x-auto rounded-lg border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[60px]">ID</TableHead>
                        <TableHead>Дата</TableHead>
                        <TableHead>Клиент</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Телефон</TableHead>
                        <TableHead>Адрес</TableHead>
                        <TableHead>Сумма</TableHead>
                        <TableHead className="text-center">Статус</TableHead>
                         {/* <TableHead className="text-right">Действия</TableHead> */}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.map((order) => (
                        <TableRow key={order.id}>
                            <TableCell className="font-medium">#{order.id}</TableCell>
                            <TableCell className="text-xs whitespace-nowrap">{formatDate(order.createdAt)}</TableCell>
                            <TableCell>{order.fullName}</TableCell>
                            <TableCell>{order.email}</TableCell>
                            <TableCell>{order.phone}</TableCell>
                            <TableCell className="text-xs max-w-[200px] truncate" title={order.address}>{order.address}</TableCell> {/* Обрезаем длинный адрес */}
                            <TableCell className="font-semibold whitespace-nowrap">{formatCurrency(order.totalAmount)}</TableCell>
                            <TableCell className="text-center">
                                <StatusSelector orderId={order.id} currentStatus={order.status} />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}