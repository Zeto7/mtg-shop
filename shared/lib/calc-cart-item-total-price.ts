import { CartItemDTO } from "../services/dto/cart.dto";

export const calcCartItemTotalPrice = (item: CartItemDTO): number => {
    const additionalPrice = item.additionals.reduce((acc, additional) => acc + additional.price, 0)
    return (additionalPrice + item.productItem.price) * item.quantity;
}