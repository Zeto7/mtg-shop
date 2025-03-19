import { Cart } from "@prisma/client";
import { axiosInstance } from "./axios-instance";
import { CartDTO } from "./dto/cart.dto";

export const fetchCart = async (): Promise<CartDTO> => {
    const { data } = await axiosInstance.get<CartDTO>('/cart');
    console.log('ABOBA');
    console.log(data);
    return data;
};