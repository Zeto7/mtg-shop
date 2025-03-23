"use client";

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



export default function Checkout() {
    const {totalAmount, updateItemQuantity, items, removeCartItem} = useaCart();
    
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

    const onSubmit = (data: CheckoutFormValues) => {
        console.log(data);
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
                    <CheckoutSidebar totalAmount={totalAmount} />
                </div>
            </form>
        </FormProvider>
    </Container>
}