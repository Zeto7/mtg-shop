// ФАЙЛ: app/checkout/page.tsx
"use client";

import React from "react";
import { CheckoutSidebar } from "@/shared/components/shared/checkout-sidebar";
import { Container } from "@/shared/components/shared/container";
import { Title } from "@/shared/components/shared/title";
// Исправляем имя хука useCart (если он так называется)
import { useCart } from "@/shared/hooks/use-cart";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckoutCart } from "@/shared/components/shared/checkout-components/checkout-cart";
import { CheckoutPersonalInfo } from "@/shared/components/shared/checkout-components/checkout-personal-info";
import { CheckoutAddressForm } from "@/shared/components/shared/checkout-components/checkout-address-form";
import { checkoutFormSchema, CheckoutFormValues } from "@/shared/components/shared/checkout-components/checkout-form-schema";
// Импортируем action
import { createOrder } from "@/app/actions/order-actions"; // <-- Уточните путь!
import toast from "react-hot-toast";
import { useRouter } from "next/navigation"; // Для редиректа
import { Button } from "@/shared/components/ui/button";

export default function CheckoutPage() { // Переименовал для ясности
    // Убедитесь, что хук useCart возвращает нужные методы/свойства
    const { totalAmount, updateItemQuantity, items, removeCartItem, clearCart } = useCart();
    const router = useRouter(); // Инициализируем роутер
    const [isSubmitting, setIsSubmitting] = React.useState(false); // Переименовал для ясности

    const form = useForm<CheckoutFormValues>({
        resolver: zodResolver(checkoutFormSchema),
        // Можно попробовать получить данные из сессии для предзаполнения
        // defaultValues: { email: session?.user?.email ?? '', ... }
        defaultValues: { /* ... */ },
    });

    const onSubmit: SubmitHandler<CheckoutFormValues> = async (data) => {
        setIsSubmitting(true); // Ставим флаг загрузки
        try {
            // Вызываем Server Action
            const result = await createOrder(data);

            // Проверяем результат
            if (result.success && result.orderId) {
                // --- ИСПРАВЛЕНИЕ: Используем toast.success ---
                toast.success(`Заказ #${result.orderId} успешно оформлен!`, {
                    icon: '✅',
                    duration: 4000, // Увеличим длительность
                });
                // Очищаем состояние корзины на клиенте (если useCart это предоставляет)
                clearCart?.(); // Вызываем метод очистки из хука корзины

                // Перенаправляем пользователя (например, на страницу "Спасибо" или в профиль)
                router.push('/profile?order=success'); // Добавляем параметр для возможного сообщения на странице профиля

                // Если была логика с paymentUrl:
                // if (result.paymentUrl) {
                //     location.href = result.paymentUrl; // Редирект на оплату
                // } else {
                //     router.push('/order/success?id=' + result.orderId); // Редирект на страницу успеха
                // }

            } else {
                // Показываем ошибку от сервера
                toast.error(result.message || 'Не удалось создать заказ', {
                    icon: '❌',
                });
            }
        } catch (error) {
            console.error("Checkout submit error:", error);
            toast.error('Произошла непредвиденная ошибка при оформлении заказа.', {
                icon: '❌',
            });
        } finally {
            setIsSubmitting(false); // Снимаем флаг загрузки
        }
    };

    // Эта функция должна быть передана в CheckoutCart
    const onClickCountButton = (id: number, quantity: number, type: 'plus' | 'minus') => {
        const newQuantity = type === 'plus' ? quantity + 1 : quantity - 1;
        // Убедимся, что количество не меньше 1, если тип 'minus'
        if (newQuantity >= 0) { // Позволяем 0 для удаления через кнопку X
             updateItemQuantity(id, newQuantity);
        }
        if (newQuantity === 0) { // Если стало 0, можно сразу удалить
             removeCartItem(id);
        }
    };

     // Эта функция должна быть передана в CheckoutCart
     const handleRemoveItem = (id: number) => {
         removeCartItem(id);
     };

    // Если корзина пуста, можно показать сообщение или редиректить
     if (!items || items.length === 0 && !form.formState.isSubmitting) {
         return (
             <Container className="mt-10 text-center">
                 <Title text="Ваша корзина пуста" className="mb-4" />
                 <Button onClick={() => router.push('/')}>Вернуться к покупкам</Button>
             </Container>
         );
     }


    return (
        <Container className="mt-5">
            <Title text="Оформление заказа" className="font-extrabold mb-8 text-[36px]" />
            <FormProvider {...form}>
                {/* Передаем наш onSubmit */}
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="flex flex-wrap lg:flex-nowrap gap-10">
                        {/*Левая часть*/}
                        <div className="flex flex-col gap-10 flex-1 w-full lg:w-auto order-2 lg:order-1">
                            {/* Передаем обработчики в CheckoutCart */}
                            <CheckoutCart
                                items={items}
                                onClickCountButton={onClickCountButton}
                                removeCartItem={handleRemoveItem} // Используем новый обработчик
                                />
                            <CheckoutPersonalInfo />
                            <CheckoutAddressForm />
                        </div>

                        {/*Правая часть*/}
                         <div className="w-full lg:w-[450px] order-1 lg:order-2">
                             {/* Передаем isSubmitting в Sidebar */}
                             <CheckoutSidebar submitting={isSubmitting} totalAmount={totalAmount} />
                         </div>
                    </div>
                </form>
            </FormProvider>
        </Container>
    );
}