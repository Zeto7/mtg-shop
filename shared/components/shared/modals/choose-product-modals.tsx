'use client';

import { Dialog, DialogContent, DialogTitle } from "@/shared/components/ui/dialog";
import { cn } from "@/shared/lib/utils";
import React from "react";
import { useRouter } from "next/navigation";
import { ChooseProductForm } from "../choose-product-form";
import { ProductWithRelations } from "@/@types/prisma";
import { ChooseKitForm } from "../choose-kit-form";
import { useCartStore } from "@/shared/store/cart";
import toast from "react-hot-toast";

interface Prors {
    product: ProductWithRelations;
    className?: string;
}

export const ChooseProductModals: React.FC<Prors> = ({ className, product }) => {
    const router = useRouter();
    const firsItem = product.items[0];
    const isKitForm = Boolean(firsItem.amount)
    const addCartItem = useCartStore(state => state.addCartItem)

    const onSubmitProduct = () => onSubmit(firsItem.id, []);
    const onSubmit = async (productItemId: number, additionals: number[]) => {
        try {
            const itemId = productItemId ?? firsItem.id;

            await addCartItem({
                productItemId: itemId,
                additionals
            });
            toast.success('Товар добавлен в корзину');
            router.back();
        }
        catch (error) {
            toast.error('Произошла ошибка при добавлении товара в корзину');
            console.error(error);
        }
    };
    return (
        <Dialog open={Boolean(product)} onOpenChange={() => router.back()}>
            <DialogContent className={cn("p-0 w-[1160px]` max-w-[1160px] min-h-[700px] bg-white overflow-hidden", className)}>
                <DialogTitle className="hidden"/>
                { isKitForm ? 
                    ( <ChooseKitForm imageUrl={product.imageUrl} name={product.name} additionals={product.additionals} items={product.items} onSubmit={onSubmit} /> ) : 
                    ( <ChooseProductForm imageUrl={product.imageUrl} name={product.name} price={firsItem.price} onSubmit={onSubmitProduct}/> )
                }
            </DialogContent>
        </Dialog>
    )
};