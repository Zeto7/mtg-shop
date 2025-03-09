'use client';

import { cn } from "@/shared/lib/utils";
import { CircleCheck } from "lucide-react";
import React from "react";

interface Prors {
    className?: string;
    imageUrl: string;
    name: string;
    price: number;
    active?: boolean;
    onClick?: () => void;
}

export const AdditionalItem: React.FC<Prors> = ({ className, imageUrl, name, price, active, onClick }) => {
    return <div className={cn('flex items-center flex-col p-1 rounded-md w-32 text-center relative cursor-pointer shadow-md bg-white', 
    {'border border-primary': active}, className)} onClick={onClick}> 
        {active && <CircleCheck className="absolute top-2 right-2 text-primary"/>}
        <img width={100} height={100} src={imageUrl}/>
        <span className="text-xs mb-1">{name}. Booster</span>
        <span className="font-bold mt-auto">{price} Br</span>
    </div>
}   