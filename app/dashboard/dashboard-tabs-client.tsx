'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { ProductAdminClient } from './product-admin-client';
import { UserListClient } from './user-list-client';
import { ProductWithRelations, CategoryData, AdditionalData } from '@/@types/prisma';
import { SafeUser } from '@/app/actions/user-actions';
import { Order } from '@prisma/client';
import { OrderListClient } from './admin-order-list-client';
import { ProductStockListClient } from './admin-product-stock-list-client';

interface DashboardTabsClientProps {
    initialProducts: ProductWithRelations[];
    categories: CategoryData[];
    allAdditionals: AdditionalData[];
    initialUsers: SafeUser[];
    initialOrders: Order[];
}

export function DashboardTabsClient({
    initialProducts,
    categories,
    allAdditionals,
    initialUsers,
    initialOrders,
}: DashboardTabsClientProps) {
    return (
        <Tabs defaultValue="products" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-5">
                <TabsTrigger value="products">Товары</TabsTrigger>
                <TabsTrigger value="users">Пользователи</TabsTrigger>
                <TabsTrigger value="orders">Заказы</TabsTrigger>
                <TabsTrigger value="stock">Учет Товаров</TabsTrigger>
            </TabsList>

            <TabsContent value="products">
                <ProductAdminClient
                    initialProducts={initialProducts}
                    categories={categories}
                    allAdditionals={allAdditionals}
                />
            </TabsContent>

            <TabsContent value="users">
                <UserListClient users={initialUsers} />
            </TabsContent>

            <TabsContent value="orders">
                <OrderListClient initialOrders={initialOrders} />
            </TabsContent>

            <TabsContent value="stock">
                <ProductStockListClient products={initialProducts} />
            </TabsContent>
        </Tabs>
    );
}