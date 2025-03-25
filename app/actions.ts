'use server';

import { prisma } from "@/prisma/prisma-client";
import { CheckoutFormValues } from "@/shared/components/shared/checkout-components/checkout-form-schema";
import { PayOrderTemplate } from "@/shared/components/shared/email-templates/pay-order";
import { sendEmail } from "@/shared/lib/send-email";
import { OrderStatus } from "@prisma/client";
import { cookies } from "next/headers";

export async function createOrder(data: CheckoutFormValues) {
    try {
        const cookieStore = await cookies();
        const cartToken = cookieStore.get('cartToken')?.value;

        if (!cartToken) {
            throw new Error('Cart token not found');
        }

        // Нахождение корзины по токену
        const userCart = await prisma.cart.findFirst({
            include: {
                user: true,
                items: {
                    include: {
                        additionals: true,
                        productItem: {
                            include: {
                                product: true,
                            },
                        },
                    },
                },
            },
            where: {
                token: cartToken,
            },
        });

        if (!userCart) {
            throw new Error('Cart not found');
        }

        if (userCart?.totalAmount === 0) {
            throw new Error('Cart is empty');
        }

        // Создание заказа
        const order = await prisma.order.create({
            data: {
                token: cartToken,
                fullName: data.firstName + ' ' + data.lastName,
                email: data.email,
                phone: data.phone,
                address: data.address,
                comment: data.comment,
                totalAmount: userCart.totalAmount,
                status: OrderStatus.PENDING,
                items: JSON.stringify(userCart.items),
            },
        });

        // Очистка корзины
        await prisma.cart.update({
            where: {
                id: userCart.id,
            },
            data: {
                totalAmount: 0,
            }
        });

        await prisma.cartItem.deleteMany({
            where: {
                cartId: userCart.id,
            },
        }); 

        // TODO : Сделать создание ссылки оплаты

        await sendEmail(data.email, 'MTG-shop / Оплатите заказ #' + order.id, 
            PayOrderTemplate({
            orderId: order.id,
            totalAmount: order.totalAmount,
            paymentUrl: 'https://resend.com/docs/send-with-nextjs',
        }));
    } catch (error) {
        console.log('[CREATE_ORDER] Server error',error);
    }
}