import { prisma } from "@/prisma/prisma-client";
import { Price } from "../components/shared/cart-item-details";

export interface GetSearchParams {
    query?: string;
    sortBy?: string;
    amount?: string;
    additionals?: string;
    priceFrom?: string;
    priceTo?: string;
}

const DEFAULT_MIN_PRICE = 0;
const DEFAULT_MAX_PRICE = 1000;


export const findKits = async (params: GetSearchParams) => {
    const amount = params.amount?.split(',').map(Number);
    const additionalsIdArr = params.additionals?.split(',').map(Number);

    const minPrice = Number(params.priceFrom) || DEFAULT_MIN_PRICE;
    const maxPrice = Number(params.priceTo) || DEFAULT_MAX_PRICE;

      const categories = await prisma.category.findMany({
        include: {
            products: {
                orderBy: {
                    id: 'desc',
                },
                where: {
                    additionals: additionalsIdArr ? {
                        some: {
                            id: {
                            in: additionalsIdArr,
                            },
                        },
                    } : undefined,
                items: {
                    some: {
                        amount: {
                            in: amount,
                        },
                    price: {
                        gte: minPrice,
                        lte: maxPrice,
                    },
                    },
                },
                },
                include: {
                    items: {
                        where: {
                            price: {
                                gte: minPrice,
                                lte: maxPrice,
                            },
                        },
                    orderBy: {
                        price: 'asc',
                    },
                    },
                },
            },
        },
    })

    return categories;
}