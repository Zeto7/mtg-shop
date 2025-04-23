'use client';

import { cn } from "@/shared/lib/utils";
import { useCategoryStore } from "@/shared/store/category";
import { Category } from "@prisma/client";
import React from "react"

interface Props {
    items: Category[];
    classname?: string;
}

export const Categories: React.FC<Props> = ({ classname, items }) => {  
    const categoryActiveId = useCategoryStore((state) => state.activeId);
    return (
        <div className={cn('inline-flex gap-1 bg-gray-50 p-1 rounded-2xl', classname)}>
            {
                items.map(({id, name}, index) => (
                    <a key={index} href={`/#${name}`} className={cn(
                        'flex items-center font-bold h-11 rounded-2xl px-5 justify-center',
                        categoryActiveId === id && 'bg-white shadow-md shadow-gray-200 text-primary'
                    )}>
                        <button>{name}</button>
                    </a>
                ))
            }
        </div>
    );
};