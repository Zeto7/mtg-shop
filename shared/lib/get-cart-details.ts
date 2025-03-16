import { CartDTO } from "../services/dto/cart.dto";
import { calcCartItemTotalPrice } from "./calc-cart-item-total-price";

export type CartStateItem = {
    id: number;
    quantity: number;
    name: string;
    imageUrl: string;
    price: number;
    kitAmount?: number | null;
    additionals: Array<{ name: string; price: number }>;
  };


type ReturnProps = {
    items: CartStateItem[];
    totalAmount: number;
}

export const getCartDetails = (data: CartDTO): ReturnProps => {
    const items = data.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        name: item.productItem.product.name,
        imageUrl: item.productItem.product.imageUrl,
        price: calcCartItemTotalPrice(item),
        kitAmount: item.productItem.amount,
        additionals: item.additionals.map((additional) => ({
            name: additional.name,
            price: additional.price,
        })),
    }));

    return { items, totalAmount: data.totalAmount }
}  