import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react"
import { Title } from "./title";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";


interface Props {
    id: number;
    name: string;
    price: number;
    imageUrl: string;
    classname?: string
}

export const ProductCard: React.FC<Props> = ({id, name, price, imageUrl, classname }) => {  
    return (
        <div className={cn(classname)}>
            <Link href={`/product/${id}`}>
                <div className="flex justify-center p-6 bg-secondary rounded-lg h-[260px]">
                    <img className="" src={imageUrl} alt={name}/>
                </div>

                <Title text={name} size="sm" className="mb-1 mt-3 font-bold"/>
                <p className="text-sm text-gray-400">Какое-то описание подукта</p>

                <div className="flex justify-between items-center mt-4">
                    <span className="text-[20px]">
                        <b>{price} Br</b>
                    </span>

                    <Button variant={"secondary"} className="text-base font-bold rounded-xl">
                        <Plus size={20} className="mr-1"/>
                        Добавить
                    </Button>
                </div>
            </Link>
        </div>
    );
};