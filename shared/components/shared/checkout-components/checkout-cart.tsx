import { getCartItemDetails } from "@/shared/lib/get-cart-item-details";
import { removeCartItem } from "@/shared/services/cart";
import React from "react";
import { CheckoutItem } from "../checkout-item";
import { WhiteBlock } from "../white-block";
import { CartStateItem } from "@/shared/lib/get-cart-details";

interface Props {
    items: CartStateItem[];
    onClickCountButton: (id: number, quantity: number, type: 'plus' | 'minus') => void;
    removeCartItem: (id: number) => void;
    className?: string;
}

export const CheckoutCart: React.FC<Props> = ({ className, onClickCountButton, removeCartItem, items }) => {
    return (
        <WhiteBlock title="1. Корзина" className={className}>
            <div className="flex flex-col gap-7">
                { items.map((item) =>(
                    <CheckoutItem onClickRemove={function (): void { 
                        throw new Error("Function not implemented.");} } 
                        onClickCountButton={undefined} 
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
                ))}
            </div>
        </WhiteBlock>
    );
};