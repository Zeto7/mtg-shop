"use client";

import React from "react";
import { CheckoutSidebar } from "@/shared/components/shared/checkout-sidebar";
import { Container } from "@/shared/components/shared/container";
import { Title } from "@/shared/components/shared/title";
import { useaCart } from "@/shared/hooks/use-cart";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form"
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckoutCart } from "@/shared/components/shared/checkout-components/checkout-cart";
import { CheckoutPersonalInfo } from "@/shared/components/shared/checkout-components/checkout-personal-info";
import { CheckoutAddressForm } from "@/shared/components/shared/checkout-components/checkout-address-form";
import { checkoutFormSchema, CheckoutFormValues } from "@/shared/components/shared/checkout-components/checkout-form-schema";
//import { createOrder } from "@/app/actions";
import toast from "react-hot-toast";


export default function Checkout() {
    const {totalAmount, updateItemQuantity, items, removeCartItem} = useaCart();
    const [submitting, setSubmitting] = React.useState(false);
    
    const form = useForm<CheckoutFormValues>({
        resolver: zodResolver(checkoutFormSchema),
        defaultValues: {
            email: '',
            firstName: '',
            lastName: '',
            phone: '',
            address: '',
            comment: '',
          },
    });

    const onSubmit = async (data: CheckoutFormValues) => {
        try {
            setSubmitting(true);

            const url = await createOrder(data);

            toast.error('Заказ успешно оформлен!', {
                icon: '✅',
            });

            if (url) {
                location.href = url;
            }
        } catch (error) {
            console.log(error);
            setSubmitting(false);
            return toast.error('Не удалось создать заказ', {
                icon: '❌',
            });
        }
    }

    const onClickCountButton = (id: number, quantity: number, type: 'plus' | 'minus') => { 
        const newQuantity = type === 'plus' ? quantity + 1 : quantity - 1;
        updateItemQuantity(id, newQuantity);
    }

    return <Container className="mt-5">
        <Title text="Оформление заказа" className="font-extrabold mb-8 text-[36px]" />
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="flex gap-10">
                    {/*Левая часть*/}
                    <div className="flex flex-col gap-10 flex-1 mb-20">
                        <CheckoutCart items={items} onClickCountButton={onClickCountButton} removeCartItem={removeCartItem}/>
                        <CheckoutPersonalInfo />
                        <CheckoutAddressForm />
                    </div>

                    {/*Правая часть*/}
                    <CheckoutSidebar submitting={submitting} totalAmount={totalAmount} />
                </div>
            </form>
        </FormProvider>
    </Container>
}