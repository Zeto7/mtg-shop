'use client';

import React from "react"
import { cn } from "@/shared/lib/utils"
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger, } from "@/shared/components/ui/sheet"
import Link from "next/link"
import { Button } from "../ui/button"
import { ArrowRight } from "lucide-react"
import { CartDrawerItem } from "./cart-drawer-item"
import { getCartItemDetails } from "@/shared/lib/get-cart-item-details"
import { useCartStore } from "@/shared/store/cart";
import { stat } from "fs";
import { KitAmount } from "@/shared/constants/kit";

interface Props {
    className?: string
}

export const CartDrawer: React.FC<React.PropsWithChildren<Props>> = ({ children, className }) => {
    const [totalAmount, fetchCartItems, items] = useCartStore(state => [state.totalAmount, state.fetchCartItems, state.items]);
    
    React.useEffect(() => {
        fetchCartItems();
    }, [])
    return (
        <Sheet>
            <SheetTrigger asChild>{children}</SheetTrigger>
            <SheetContent className="flex flex-col justify-between pb-0 bg-[#f4eeee]">
                <SheetHeader>
                    <SheetTitle>
                        В корзине <span className="font-bold">3 товара</span>
                    </SheetTitle>
                </SheetHeader>

                <div className="-mx-3 mt-5 overflow-auto scrollbar flex-1 rounded-2xl">
                    <div className="mb-2">
                        {items.map((item) => (
                            <CartDrawerItem key={item.id} id={item.id}
                            imageUrl={item.imageUrl}
                            //details={item.kitAmount ? getCartItemDetails(item.additionals, item.kitAmount as KitAmount[]) : ''}
                            details={''}
                            name={item.name}
                            price={item.price}
                            quantity={item.quantity} />
                        ))}
                    </div>
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

                        <Link href="/cart">
                            <Button type="submit" className="w-full h-12 text-base rounded-3xl">
                                Оформить заказ
                                <ArrowRight className="w-5 ml-2" />
                            </Button>
                        </Link>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}