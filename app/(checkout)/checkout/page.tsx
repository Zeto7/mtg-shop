"use client";

import React, { useState, useEffect } from "react";
import { CheckoutSidebar, ShippingMethod } from "@/shared/components/shared/checkout-sidebar";
import { checkoutFormSchema, CheckoutFormValues } from "@/shared/components/shared/checkout-components/checkout-form-schema";
import { useForm, FormProvider, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createOrder } from "@/app/actions";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/components/ui/button";
import { useCart } from "@/shared/hooks/use-cart";
import { Container } from "@/shared/components/shared/container";
import { Title } from "@/shared/components/shared/title";
import { CheckoutCart } from "@/shared/components/shared/checkout-components/checkout-cart";
import { CheckoutPersonalInfo } from "@/shared/components/shared/checkout-components/checkout-personal-info";
import { CheckoutAddressForm } from "@/shared/components/shared/checkout-components/checkout-address-form";


export default function CheckoutPage() {
    const { totalAmount, updateItemQuantity, items, removeCartItem, clearCart } = useCart();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('delivery');

    const form = useForm<CheckoutFormValues>({
        resolver: zodResolver(checkoutFormSchema),
        defaultValues: {
            email: '', firstName: '', lastName: '', phone: '',
            address: '', comment: '',
            shippingMethod: 'delivery',
        },
        mode: "onChange"
    });

    useEffect(() => {
        form.setValue('shippingMethod', shippingMethod, { shouldValidate: true });
    }, [shippingMethod, form]);


    const onSubmit: SubmitHandler<CheckoutFormValues> = async (data) => {
        setIsSubmitting(true);
        console.log("Submitting data:", data);
        try {
            const orderData = {
                 firstName: data.firstName,
                 lastName: data.lastName,
                 email: data.email,
                 phone: data.phone,
                 address: data.address ?? '',
                 comment: data.comment,
            };

            const result = await createOrder(orderData);

            if (result.success && result.orderId) {
                toast.success(`Заказ #${result.orderId} успешно оформлен!`, { icon: '✅', duration: 4000 });
                clearCart?.();
                router.push('/profile?order=success');
            } else {
                toast.error(result.message || 'Не удалось создать заказ', { icon: '❌' });
            }
        } catch (error) {
            console.error("Checkout submit error:", error);
            toast.error('Произошла непредвиденная ошибка при оформлении заказа.', { icon: '❌' });
        } finally {
            setIsSubmitting(false);
        }
    };

     const onClickCountButton = (id: number, quantity: number, type: 'plus' | 'minus') => {
        const newQuantity = type === 'plus' ? quantity + 1 : quantity - 1;

        if (newQuantity <= 0) {
            removeCartItem(id);
        } else {
            updateItemQuantity(id, newQuantity);
        }
    };


    const handleRemoveItem = (id: number) => {
        removeCartItem(id);
    };


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
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="flex flex-wrap lg:flex-nowrap gap-10">
                        <div className="flex flex-col gap-10 flex-1 w-full lg:w-auto order-2 lg:order-1">
                            <CheckoutCart items={items} onClickCountButton={onClickCountButton} removeCartItem={handleRemoveItem} />
                            <CheckoutPersonalInfo />
                            <CheckoutAddressForm />
                        </div>

                         <div className="w-full lg:w-auto order-1 lg:order-2">
                             <CheckoutSidebar
                                totalAmount={totalAmount}
                                submitting={isSubmitting}
                                shippingMethod={shippingMethod}
                                onShippingChange={setShippingMethod}
                             />
                         </div>
                    </div>
                </form>
            </FormProvider>
        </Container>
    );
}