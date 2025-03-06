import { cn } from "@/shared/lib/utils";
import React from "react";
import { ProductImage } from "./Product-Imange";
import { Title } from "./title";
import { Button } from "@/shared/components/ui/button";
import { GroupVariants } from "./group-variants";
import { kitAmount } from "@/shared/constants/kit";

interface Props {
    imageUrl: string;
    name: string;
    className?: string; 
    additionals: any[];
    items: any[];
    onClickAdd?: VoidFunction
}

export const ChooseKitForm: React.FC<Props> = ({ className, imageUrl, name, additionals, items, onClickAdd }) => {
    const textDetails = 'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Fugit, vel quis. Officia consequatur culpa velit repellat nesciunt';
    const totalPrice = 87;
  return (
    <div className={cn(className, 'flex flex-1')}>
        <ProductImage imageUrl={imageUrl} amount={1} />

        <div className="w-[490px] bg-[#F7F6F5] p-7">
            <Title text={name} size="md" className="font-extrabold mb-1"/>
            <p className="text-gray-400">{textDetails}</p>
            <GroupVariants items={kitAmount}/>
            <Button className="h-[55px] px-10 text-base rounded-[18px] w-full mt-10">Добавить в корзину за {totalPrice} Br</Button>
        </div>
    </div>
  )
};   