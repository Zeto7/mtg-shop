import { cn } from "@/shared/lib/utils";
import React from "react";
import { Title } from "./title";
import { Button } from "@/shared/components/ui/button";

interface Props {
    imageUrl: string;
    name: string;
    className?: string; 
    items: any[];
    onClickAdd?: VoidFunction
}

export const ChooseProductForm: React.FC<Props> = ({ className, imageUrl, name, items, onClickAdd }) => {
    const textDetails = 'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Fugit, vel quis. Officia consequatur culpa velit repellat nesciunt';
    const totalPrice = 56;
  return (
    <div className={cn(className, 'flex flex-1')}>
        <div className="flex items-center justify-center flex-1 relative w-full">
          <img src={imageUrl} alt="Logo" className="relative left-2 top-2 transition-all z-10 duration-300"   />
        </div>


        <div className="w-[490px] bg-[#F7F6F5] p-7">
            <Title text={name} size="md" className="font-extrabold mb-1"/>
            <p className="text-gray-400">{textDetails}</p>
            <Button className="h-[55px] px-10 text-base rounded-[18px] w-full mt-10">Добавить в корзину за {totalPrice} Br</Button>
        </div>
    </div>
  )
};   