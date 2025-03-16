import { Cart } from "@prisma/client";
import { axiosInstance } from "./axios-instance";

export const fetchCart = async (): Promise<Cart> => {
    const { data } = await axiosInstance.get<Cart>('/cart');
    return data;
};