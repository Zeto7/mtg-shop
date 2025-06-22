import { cn } from "@/shared/lib/utils";
import React from "react";
import { Title } from "./title";
import { Button } from "@/shared/components/ui/button";

interface Props {
    imageUrl: string;
    name: string;
    className?: string;
    description: string;
    price: number;
    onSubmit?: VoidFunction
}

export const ChooseProductForm: React.FC<Props> = ({ className, imageUrl, name, description, price, onSubmit }) => {
  return (
    <div className={cn(className, 'flex flex-1')}>
        <div className="flex items-center justify-center flex-1 relative w-full">
          <img src={imageUrl} alt="Logo" className="relative left-2 top-2 transition-all z-10 duration-300"   />
        </div>


        <div className="w-[490px] bg-[#FCFCFC] p-7">
            <Title text={name} size="md" className="font-extrabold mb-1"/>
            <p className="text-sm text-[#5C6370] mb-4 overflow-hidden break-words flex-grow whitespace-pre-line">
                {description || 'Описание отсутствует.'}
            </p>
            <Button onClick={() => onSubmit?.()} className="h-[55px] px-10 text-base rounded-[18px] w-full mt-10 bg-[#B22222]">Добавить в корзину за {price} Br</Button>
        </div>
    </div>
  )
};   