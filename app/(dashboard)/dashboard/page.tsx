import { Container } from "@/shared/components/shared/container";
import Link from 'next/link';
import { Button } from "@/shared/components/ui/button";
import { HomeIcon } from "lucide-react";

import { getProducts, getCategories, getAllAdditionals } from '@/app/actions/product-actions';
import { getUsers, SafeUser } from '@/app/actions/user-actions';

import { DashboardTabsClient } from "@/app/dashboard/dashboard-tabs-client";
// import { checkAuth } from '@/lib/auth';
// import { redirect } from 'next/navigation';

export default async function DashboardPage() {
    // TODO : Аутентификация и Авторизация
    // const session = await checkAuth();
    // if (!session || session.user?.role !== 'ADMIN') {
    //    redirect('/unauthorized');
    // }

    const [products, categories, allAdditionals, users] = await Promise.all([
        getProducts(),
        getCategories(),
        getAllAdditionals(),
        getUsers()
    ]);

    return (
        <Container className="mt-6 mb-20">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Панель Администратора</h1>
                {/* --- Ссылка на главную --- */}
                <Button asChild variant="outline" size="sm">
                    <Link href="/" className="flex items-center gap-2">
                         <HomeIcon className="h-4 w-4"/>
                         На главную
                    </Link>
                </Button>
            </div>

            <DashboardTabsClient
                initialProducts={products}
                categories={categories}
                allAdditionals={allAdditionals}
                initialUsers={users}
            />
        </Container>
    );
}