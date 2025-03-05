import { cn } from "@/lib/utils";
import React from "react";

interface Props {
    className?: string;
    imageUrl: string;
    amount: 1 | 2 | 3;
}

export const ProductImage: React.FC<Props> = ({ className, imageUrl, amount }: Props) => {
    return (
        <div className={cn('flex items-center justify-center flex-1 relative w-full', className)}>
            <img src={imageUrl} alt="Logo" 
                className={cn('relative left-2 top-2 transition-all z-10 duration-300', {
                    '': amount === 1,
                    '': amount === 2,
                    '': amount === 3,
                })}
            />

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-dashed border-2 rounded-full border-gray-200 w-[450px] h-[450px]" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-dotted border-2 rounded-full border-gray-100 w-[370px] h-[370px]" />
        </div>

        
    );
};