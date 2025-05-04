'use client';

import { getMyOrders } from '@/app/actions/user-actions'; // <-- Уточните путь
import { Order } from '@prisma/client';
import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Badge } from "@/shared/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Terminal } from 'lucide-react';

const formatDate = (date: Date | null | undefined) => date ? new Date(date).toLocaleDateString('ru-RU') : 'N/A';
const formatCurrency = (amount: number) => (amount).toFixed(2).replace('.', ',') + ' Br';

export default function OrderHistoryList() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrders = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const result = await getMyOrders();
                if (result.success && result.orders) {
                    setOrders(result.orders);
                } else {
                    setError(result.message || 'Не удалось загрузить историю заказов.');
                }
            } catch (err) {
                console.error("Failed to fetch orders:", err);
                setError('Ошибка при загрузке истории заказов.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrders();
    }, []);

    if (isLoading) {
        return <p>Загрузка истории заказов...</p>;
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Ошибка</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (orders.length === 0) {
        return <p>У вас пока нет заказов.</p>;
    }

    return (
         <div className="overflow-x-auto rounded-lg border mt-6">
             <Table>
                 <TableHeader>
                     <TableRow>
                         <TableHead className="w-[80px]">Номер</TableHead>
                         <TableHead>Дата</TableHead>
                         <TableHead>Статус</TableHead>
                         <TableHead className="text-right">Сумма</TableHead>
                         {/* Можно добавить кнопку/ссылку для просмотра деталей */}
                         {/* <TableHead className="text-right">Действия</TableHead> */}
                     </TableRow>
                 </TableHeader>
                 <TableBody>
                     {orders.map((order) => (
                         <TableRow key={order.id}>
                             <TableCell className="font-medium">#{order.id}</TableCell>
                             <TableCell>{formatDate(order.createdAt)}</TableCell>
                             <TableCell>
                                 <Badge variant={order.status === 'SUCCEDED' ? 'default' : (order.status === 'PENDING' ? 'secondary' : 'outline')}>
                                     {order.status} {/* TODO: Перевести статусы */}
                                 </Badge>
                             </TableCell>
                             <TableCell className="text-right">{formatCurrency(order.totalAmount)}</TableCell>
                         </TableRow>
                     ))}
                 </TableBody>
             </Table>
         </div>
    );
}