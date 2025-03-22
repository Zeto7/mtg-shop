'use client';

import { ProductWithRelations } from "@/@types/prisma";
import { useCartStore } from "@/shared/store/cart";
import React from "react";
import toast from "react-hot-toast";
import { ChooseKitForm } from "./choose-kit-form";
import { ChooseProductForm } from "./choose-product-form";

interface Props {
    product: ProductWithRelations;
    onSubmit?: VoidFunction
    className?: string;
}

export const ProductForm: React.FC<Props> = ({ className, onSubmit: _onSubmit, product }) => {
    const addCartItem = useCartStore(state => state.addCartItem)
    const firsItem = product.items[0];
    const isKitForm = Boolean(firsItem.amount)

    const onSubmitProduct = () => onSubmit(firsItem.id, []);
    const onSubmit = async (productItemId: number, additionals: number[]) => {
        try {
            const itemId = productItemId ?? firsItem.id;

            await addCartItem({
                productItemId: itemId,
                additionals
            });
            toast.success('Товар добавлен в корзину');
            _onSubmit?.();
        }
        catch (error) {
            toast.error('Произошла ошибка при добавлении товара в корзину');
            console.error(error);
        }
    };
    if(isKitForm) {
        return <ChooseKitForm imageUrl={product.imageUrl} name={product.name} additionals={product.additionals} items={product.items} onSubmit={onSubmit} />
    } 
    return <ChooseProductForm imageUrl={product.imageUrl} name={product.name} price={firsItem.price} onSubmit={onSubmitProduct} />
};