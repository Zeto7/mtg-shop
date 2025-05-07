import { Package, Car, ArrowRight, MapPin } from "lucide-react";
import React from "react";
import { Button } from "../ui/button";
import { CheckoutItemDetails } from "./checkout-item-details";
import { WhiteBlock } from "./white-block";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { Label } from "@/shared/components/ui/label";
import { DELIVERY_PRICE, PICKUP_PRICE, PICKUP_ADDRESS } from "@/shared/constants/shippings";



export type ShippingMethod = 'pickup' | 'delivery';

interface Props {
    totalAmount: number;
    shippingMethod: ShippingMethod;
    onShippingChange: (method: ShippingMethod) => void;
    className?: string;
    submitting?: boolean;
}

export const CheckoutSidebar: React.FC<Props> = ({
    className,
    totalAmount,
    shippingMethod,
    onShippingChange,
    submitting
}) => {

    const shippingCost = shippingMethod === 'delivery' ? DELIVERY_PRICE : PICKUP_PRICE;
    const finalTotalPrice = totalAmount + shippingCost;

    return (
        <div className={`w-full lg:w-[450px] ${className}`}>
            <WhiteBlock className="p-6 sticky top-4">
                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Способ получения</h3>
                    <RadioGroup
                        value={shippingMethod}
                        onValueChange={(value) => onShippingChange(value as ShippingMethod)}
                        className="space-y-3"
                    >
                        <div className="flex items-center space-x-3 p-3 border rounded-md has-[:checked]:border-primary">
                            <RadioGroupItem value="pickup" id="pickup" />
                            <Label htmlFor="pickup" className="cursor-pointer flex flex-col flex-grow">
                                <span>Самовывоз</span>
                                <span className="text-xs text-green-600 font-medium">Бесплатно</span>
                            </Label>
                        </div>

                        {shippingMethod === 'pickup' && (
                            <div className="text-xs text-gray-600 pl-8 -mt-1 flex items-start">
                               <MapPin className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                               <span>{PICKUP_ADDRESS}</span>
                            </div>
                        )}

                        <div className="flex items-center space-x-3 p-3 border rounded-md has-[:checked]:border-primary">
                            <RadioGroupItem value="delivery" id="delivery" />
                            <Label htmlFor="delivery" className="cursor-pointer flex flex-col flex-grow">
                                <span>Доставка курьером</span>
                                <span className="text-xs text-gray-600 font-medium">{DELIVERY_PRICE} Br</span>
                            </Label>
                        </div>
                    </RadioGroup>
                </div>

                <hr className="my-4"/>

                <div className="flex flex-col gap-1 mb-3">
                    <span className="text-xl">Итого:</span>
                    <span className="text-3xl font-extrabold">{finalTotalPrice}</span>
                </div>


                <CheckoutItemDetails title={<div className="flex items-center">
                    <Package className="mr-2 h-4 w-4 text-gray-400"/> Стоимость товаров:
                    </div>} value={String(totalAmount)}
                />
                <CheckoutItemDetails title={<div className="flex items-center">
                    <Car className="mr-2 h-4 w-4 text-gray-400"/> Доставка:
                    </div>} value={String(shippingCost)}
                />

                <Button
                    type="submit" 
                    className="w-full h-14 rounded-2xl mt-6 text-base font-bold bg-[#B22222] hover:bg-[#9d1e1e] disabled:opacity-60"
                    disabled={submitting}
                >
                    {submitting ? 'Оформление...' : 'Оформить заказ'}
                    <ArrowRight className="w-5 ml-2" />
                </Button>
            </WhiteBlock>
        </div>
    )
};