'use client';

import { ShoppingCart, ArrowRight } from "lucide-react"
import { Button } from "../ui/button"
import React from "react"
import { cn } from "@/shared/lib/utils"
import { CartDrawer } from "./cart-drawer"
import { useCart } from "@/shared/hooks/use-cart";

interface Props {
    className?: string
}

// TODO : исправить отображение информации на кнопке

export const CartButton: React.FC<Props> = ({className}) => {
    const {totalAmount, items} = useCart();
    return (
        <CartDrawer>
            <Button className={cn('group relative rounded-3xl', className)}>
                <b>{totalAmount} Br</b>         
                <span className="h-full w-[1px] bg-white/30 mx-1" />
                <div className='flex items-center gap-1 transition durating-300 group-hover:opacity-0'>
                    <ShoppingCart className='h-4 w-4 realitive' strokeWidth={2}/>
                    <b>{items.length}</b>
                </div>
                <ArrowRight className="w-5 absolute right-5 transition duration-300 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0" />  
            </Button>
        </CartDrawer>
    )
}