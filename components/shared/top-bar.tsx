import { cn } from "@/lib/utils";
import React from "react"
import { Container } from "./container";
import { Categories } from "./categories";
import { SortPopup } from "./sort-popup";
import { Category } from "@prisma/client";

interface Props {
    categories: Category[];
    classname?: string;
}

export const TopBar: React.FC<Props> = ({ classname, categories }) => {  
    return (
        <div className={cn('sticky top-0 bg-white py-5 shadow-lg shadow-[rgba(0,_0,_0,_0.1)_0px_10px_10px_-7px] z-10', classname)}>
            <Container className="flex items-center justify-between">
                <Categories items={categories}/>
                <SortPopup/>
            </Container>
        </div>
    );
};