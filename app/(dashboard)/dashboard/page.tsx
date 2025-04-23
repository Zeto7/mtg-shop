import { Container } from "@/shared/components/shared/container";
import { ProductAdminClient } from "@/app/dashboard/product-admin-client";
import { getProducts, getCategories, getAllAdditionals } from '@/app/actions/product-actions';
// import { checkAuth } from '@/lib/auth'; // Ваша функция проверки авторизации
// import { redirect } from 'next/navigation';

export default async function DashboardPage() {
    // --- Аутентификация и Авторизация ---
    // const session = await checkAuth();
    // if (!session || session.user?.role !== 'ADMIN') { // Проверка роли из вашей схемы
    //    redirect('/unauthorized'); // Или /login
    // }
    // --- Конец Проверки ---

    // Параллельное получение данных на сервере
    const [products, categories, allAdditionals] = await Promise.all([
        getProducts(),
        getCategories(),
        getAllAdditionals()
    ]);

    return (
        <Container className="mt-10 mb-20"> {/* Добавил отступ снизу */}
            <ProductAdminClient
                initialProducts={products}
                categories={categories}
                allAdditionals={allAdditionals}
            />
        </Container>
    );
}