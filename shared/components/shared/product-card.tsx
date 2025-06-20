import { cn } from "@/shared/lib/utils";
import Link from "next/link";
import React from "react"
import { Title } from "./title";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import { Additional } from "@prisma/client";


interface Props {
    id: number;
    name: string;
    price: number;
    imageUrl: string;
    additionals: Additional[];
    classname?: string;
}

export const ProductCard: React.FC<Props> = ({id, name, price, imageUrl, additionals, classname }) => {  
    return (
        <div className={cn(classname)}>
            <Link href={`/product/${id}`}>
                <div className="flex justify-center p-6 bg-secondary rounded-lg h-[260px]">
                    <img className="" src={imageUrl} alt={name}/>
                </div>

                <Title text={name} size="sm" className="mb-1 mt-3 font-bold"/>

                <div className="flex justify-between items-center mt-15">
                    <span className="text-[20px]">
                        <b>{price} Br</b>
                    </span>

                    <Button variant={"secondary"} className="text-base font-bold rounded-xl bg-[#f4eeee] text-[#B22222]">
                        <Plus size={20} className="mr-1"/>
                        Добавить
                    </Button>
                </div>
            </Link>
        </div>
    );
};