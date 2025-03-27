'use server';

import { prisma } from "@/prisma/prisma-client";
import { CheckoutFormValues } from "@/shared/components/shared/checkout-components/checkout-form-schema";
import { PayOrderTemplate } from "@/shared/components/shared/email-templates/pay-order";
import { createPayment } from "@/shared/lib/create-payment";
import { getUserSession } from "@/shared/lib/get-user-session";
import { sendEmail } from "@/shared/lib/send-email";
import { OrderStatus, Prisma } from "@prisma/client";
import { hashSync } from "bcrypt";
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

        const paymentData = await createPayment((
            amount: order.totalAmount,
            orderId: order.id,
            description: 'Оплата заказа #' + order.id
        ));

        if(!paymentData)
        {
            throw new Error('Payment data not found');
        }

        await prisma.order.update({
            where: {
                id: order.id,
            },
            data: {
                paymentId: paymentData.id,
            }
        })

        const paymentUrl = paymentData.confirmation.confirmation_url

        await sendEmail(data.email, 'MTG-shop / Оплатите заказ #' + order.id, 
        PayOrderTemplate({
            orderId: order.id,
            totalAmount: order.totalAmount,
            paymentUrl,
        }),);

        return paymentUrl;
    } catch (error) {
        console.log('[CREATE_ORDER] Server error',error);
    }
}

export async function updateUserInfo(body: Prisma.UserUpdateInput) {
    try {
        const currentUser = await getUserSession();
    
        if (!currentUser) {
            throw new Error('Пользователь не найден');
        }

        const findUser = await prisma.user.findFirst({
            where: {
                id: Number(currentUser.id),
            },
        });
    
        await prisma.user.update({
            where: {
                id: Number(currentUser.id),
            },
            data: {
                fullName: body.fullName,
                password: body.password ? hashSync(body.password as string, 10) : findUser?.password,
            },
        });
    } catch (error) {
        console.log('Error [UPDATE_USER]', error);
        throw error;
    }
};

export async function registerUser(body: Prisma.UserCreateInput) {
    try {
        const user = await prisma.user.findFirst({
            where: {
                email: body.email,
            }
        })

        if (user) {
            if (!user.verified) {
              throw new Error('Почта не подтверждена');
            }
            throw new Error('Пользователь уже зарегистрирован');
        }

        const createdUser = await prisma.user.create({
            data: {
              fullName: body.fullName,
              email: body.email,
              password: hashSync(body.password, 10),
            },
        });
    } catch (error) {
        console.log('Error [REGISTER_USER]', error);
        throw error;
    }
}