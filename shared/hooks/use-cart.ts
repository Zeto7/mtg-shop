import React from "react";
import { useCartStore } from "../store/cart";
import { CreateCartItemValues } from "../services/dto/cart.dto";
import { CartStateItem } from "../lib/get-cart-details";

type ReturnProps = {
    totalAmount: number,
    items: CartStateItem[],
    updateItemQuantity: (id: number, quantity: number) => Promise<void>,
    removeCartItem: (id: number) => Promise<void>,
    addCartItem: (values: CreateCartItemValues) => Promise<void>,
}

export const useCart = (): ReturnProps => {
    const cartState = useCartStore((state) => state);

    React.useEffect(() => {
        cartState.fetchCartItems();
    }, []);

    return cartState;
};