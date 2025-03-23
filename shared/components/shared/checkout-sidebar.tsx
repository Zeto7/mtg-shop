import { Package, Percent, Car, ArrowRight } from "lucide-react";
import React from "react";
import { Button } from "../ui/button";
import { CheckoutItemDetails } from "./checkout-item-details";
import { WhiteBlock } from "./white-block";

interface Props {
    totalAmount: number
    className?: string
}

const VAT = 3;
const DELIVERY_PRICE = 20;

export const CheckoutSidebar: React.FC<Props> = ({className, totalAmount}) => {
    const vatPrice = (totalAmount * VAT) / 100;
    const totalPrice = totalAmount + DELIVERY_PRICE + vatPrice;

    return (
        <div className="w-[450px]">
            <WhiteBlock className="p-6 sticky top-4">
                <div className="flex flex-col gap-1">
                    <span className="text-xl">Итого:</span>
                    <span className="text-3xl font-extrabold">{totalPrice} Br</span>
                </div>

                <CheckoutItemDetails title={<div className="flex items-center"> 
                    <Package className="mr-2 text-gray-300"/> Стоимость товаров:
                    </div>} value={`${totalAmount}`}
                />
                <CheckoutItemDetails title={<div className="flex items-center"> 
                    <Percent className="mr-2 text-gray-300"/> Налог:
                    </div>} value={`${vatPrice}`}
                />
                <CheckoutItemDetails title={<div className="flex items-center"> 
                    <Car className="mr-2 text-gray-300"/> Доставка:
                    </div>} value={`${DELIVERY_PRICE}`}
                />

                <Button
                    type="submit"
                    className="w-full h-14 rounded-2xl mt-6 text-base font-bold bg-[#B22222]">
                    Перейти к оплате
                    <ArrowRight className="w-5 ml-2" />
                </Button>
            </WhiteBlock>
        </div>
    )
};