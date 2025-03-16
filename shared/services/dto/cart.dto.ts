import { Additional, Cart, CartItem, Product, ProductItem } from "@prisma/client";

export type CartItemDTO = CartItem & {
    productItem: ProductItem & {
        product: Product;
    };
    additionals: Additional[];
};

export interface CartDTO extends Cart {
    items: CartItemDTO[]; 
}