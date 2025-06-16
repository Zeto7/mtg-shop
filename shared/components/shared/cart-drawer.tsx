'use client';

import React from "react"
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger, } from "@/shared/components/ui/sheet"
import Link from "next/link"
import { Button } from "../ui/button"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { CartDrawerItem } from "./cart-drawer-item"
import { getCartItemDetails } from "@/shared/lib/get-cart-item-details"
import Image from "next/image";
import { Title } from "./title";
import { cn } from "@/shared/lib/utils";
import { useCart } from "@/shared/hooks/use-cart";

export const CartDrawer: React.FC<React.PropsWithChildren> = ({ children}) => {
        const {totalAmount, updateItemQuantity, items, removeCartItem} = useCart();


    const onClickCountButton = (id: number, quantity: number, type: 'plus' | 'minus') => { 
        const newQuantity = type === 'plus' ? quantity + 1 : quantity - 1;
        updateItemQuantity(id, newQuantity);
    }
    
    return (
        <Sheet>
            <SheetTrigger asChild>{children}</SheetTrigger>
            <SheetContent className="flex flex-col justify-between pb-0 bg-[#f4eeee]">
                <div className={cn('flex flex-col h-full', !totalAmount && 'justify-center')}>
                { totalAmount > 0 && (
                    <SheetHeader>
                        <SheetTitle>
                            В корзине <span className="font-bold">{items.length} товара</span>
                        </SheetTitle>
                    </SheetHeader>
                )}

                { !totalAmount && (
                    <div className="flex flex-col items-center justify-center w-72 mx-auto">
                        <Image src="/assets/images/emptyCart.png" width={100} height={100} alt="empty cart" />
                        <Title size="sm" text="Корзина пуста" className="text-center font-bold my-2" />

                        <SheetClose>
                            <Button className="w-56 h-12 text-base" size="lg">
                                <ArrowLeft className="w-5 mr-2" />
                                Вернуться назад
                            </Button>
                        </SheetClose>
                    </div>
                    
                )}

                { totalAmount > 0 && <>
                    <div className="-mx-3 mt-5 overflow-auto scrollbar flex-1 rounded-2xl">
                        { items.map((item) => (
                            <div className="mb-2">
                                <CartDrawerItem
                                    key={item.id} 
                                    id={item.id}
                                    imageUrl={item.imageUrl}
                                    details={getCartItemDetails(item.additionals, item.kitAmount)}
                                    name={item.name}
                                    price={item.price}
                                    quantity={item.quantity}
                                    onClickCountButton={type => onClickCountButton(item.id, item.quantity, type)} 
                                    onClickRemove={() => removeCartItem(item.id)}
                                    />
                            </div>
                            ))
                        }
                </div>

                <SheetFooter className="-mx-6 bg-white p-8">
                    <div className="w-full">
                        <div className="flex mb-4">
                            <span className="flex flex-1 text-lg text-neutral-500">
                                Итого
                                <div className="flex-1 border-b border-dashed border-b-neutral-200 relative -top-1 mx-2" />
                            </span>

                            <span className="font-bold text-lg">{totalAmount} Br</span>
                        </div>

                        <Link href="/checkout">
                            <Button type="submit" className="w-full h-12 text-base rounded-3xl">
                                Оформить заказ
                                <ArrowRight className="w-5 ml-2" />
                            </Button>
                        </Link>
                    </div>
                </SheetFooter>
                </>
                }
                </div>
            </SheetContent>
        </Sheet>
    )
}