"use client";

import { CheckoutItem } from "@/shared/components/shared/checkout-item";
import { CheckoutItemDetails } from "@/shared/components/shared/checkout-item-details";
import { Container } from "@/shared/components/shared/container";
import { Title } from "@/shared/components/shared/title";
import { WhiteBlock } from "@/shared/components/shared/white-block";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { ArrowRight, Car, Package, Percent } from "lucide-react";

export default function Checkout() {
    return <Container className="mt-5">
        <Title text="Оформление заказа" className="font-extrabold mb-8 text-[36px]" />

        <div className="flex gap-10">
            {/*Левая часть*/}
            <div className="flex flex-col gap-10 flex-1 mb-10">
                <WhiteBlock title="1. Корзина">
                    <div className="flex flex-col gap-8">
                    <CheckoutItem onClickRemove={function (): void { 
                        throw new Error("Function not implemented.");} } 
                        onClickCountButton={undefined} 
                        id={12} 
                        imageUrl="https://www.trader-online.de/out/pictures/generated/product/1/540_340_75/Final-Fantasy-Einsteigerpaket-englisch_195166271170.png"
                        details="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quas." 
                        name="Дуэльный набор Final Fantasy"
                        price={120} 
                        quantity={1}
                    />
                    <CheckoutItem onClickRemove={function (): void { 
                        throw new Error("Function not implemented.");} } 
                        onClickCountButton={undefined} 
                        id={12} 
                        imageUrl="https://www.trader-online.de/out/pictures/generated/product/1/540_340_75/Final-Fantasy-Einsteigerpaket-englisch_195166271170.png"
                        details="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quas." 
                        name="Дуэльный набор Final Fantasy"
                        price={120} 
                        quantity={1}
                    />
                    </div>
                </WhiteBlock>

                <WhiteBlock title="1. Персональные данные">
                    <div className="grid grid-cols-2 gap-5">
                        <Input name="firstName" className="text-base" placeholder="Имя" />
                        <Input name="lastName" className="text-base" placeholder="Фамилия" />
                        <Input name="email" className="text-base" placeholder="E-Mail" />
                        <Input name="phone" className="text-base" placeholder="Телефон" />
                    </div>
                </WhiteBlock>

                <WhiteBlock title="3. Адрес доставки">
                    <div className="grid grid-cols gap-5">
                        <Input name="firstName" className="text-base" placeholder="Адрес" />
                        <Textarea rows={5} className="text-base" placeholder="Комментарий к заказу"/>
                    </div>
                </WhiteBlock>
            </div>

            {/*Правая часть*/}
            <div className="w-[450px]">
                <WhiteBlock className="p-6 sticky top-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-xl">Итого:</span>
                        <span className="text-3xl font-extrabold">144 Br</span>
                    </div>

                    <CheckoutItemDetails title={<div className="flex items-center"> 
                        <Package className="mr-2 text-gray-300"/> Стоимость товаров:
                        </div>} value="554"
                    />
                    <CheckoutItemDetails title={<div className="flex items-center"> 
                        <Percent className="mr-2 text-gray-300"/> Налог:
                        </div>} value="554"
                    />
                    <CheckoutItemDetails title={<div className="flex items-center"> 
                        <Car className="mr-2 text-gray-300"/> Доставка:
                        </div>} value="554"
                    />

                    <Button
                        type="submit"
                        className="w-full h-14 rounded-2xl mt-6 text-base font-bold bg-[#B22222]">
                        Перейти к оплате
                        <ArrowRight className="w-5 ml-2" />
                    </Button>
                </WhiteBlock>
            </div>
        </div>
    </Container>
}