import React from "react"
import { cn } from "@/shared/lib/utils"
import { CartItemProps } from "./cart-item-details/cart-item-details.types"
import * as CartItem from './cart-item-details'
import { CountButton } from "./count-button"
import { Trash2Icon } from "lucide-react"
interface Props extends CartItemProps {
    onClickCountButton?: (type: 'plus' | 'minus') => void;
    onClickRemove?: () => void;
    className?: string;
}

export const CartDrawerItem: React.FC<Props> = ({ imageUrl, name, price, quantity, details, onClickCountButton, onClickRemove, className,}) => {
    return (
        <div className={cn('flex bg-white p-5 gap-6 items-center rounded-2xl', className)}>
            <CartItem.Image src={imageUrl} />
            <div>
                <CartItem.Info name={name} details={details} />
                <hr className="my-3" />
                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                        <CountButton onClick={onClickCountButton} value={quantity} />
                    </div>
                    <div className="flex items-center gap-3">
                        <CartItem.Price value={price} />
                        <Trash2Icon onClick={onClickRemove} className="text-gray-400 cursor-pointer hover:text-gray-600" size={16}/>
                    </div>
                </div>
            </div>
        </div>
    )
}