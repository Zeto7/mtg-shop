import { Container } from "@/shared/components/shared/container";
import Link from 'next/link';
import { Button } from "@/shared/components/ui/button";
import { HomeIcon } from "lucide-react";
import { getProducts, getCategories, getAllAdditionals } from '@/app/actions/product-actions';
import { getUsers, SafeUser } from '@/app/actions/user-actions';
import { getOrders } from "@/app/actions/admin-order-actions";
import { DashboardTabsClient } from "@/app/dashboard/dashboard-tabs-client";
import { Order } from '@prisma/client';

export default async function DashboardPage() {
    const [products, categories, allAdditionals, users, orders] = await Promise.all([
        getProducts(),
        getCategories(),
        getAllAdditionals(),
        getUsers(),
        getOrders()
    ]);

    return (
        <Container className="mt-6 mb-20">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Панель Администратора</h1>
                 <Button asChild variant="outline" size="sm">
                    <Link href="/" className="flex items-center gap-2"> <HomeIcon className="h-4 w-4"/> На главную </Link>
                </Button>
            </div>

            <DashboardTabsClient
                initialProducts={products}
                categories={categories}
                allAdditionals={allAdditionals}
                initialUsers={users}
                initialOrders={orders}
            />
        </Container>
    );
}