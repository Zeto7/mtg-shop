import { cn } from "@/shared/lib/utils";
import { ArrowUpDown } from "lucide-react";
import React from "react"

interface Props {
    classname?: string
}

export const SortPopup: React.FC<Props> = ({ classname }) => {  
    return (
        <div className={cn('inline-flex items-center gap-1 bg-gray-50 px-5 h-[52px] rounded-2xl cursor-pointer', classname)}>
            <ArrowUpDown size={16} />
            <b>Сортировка:</b>
            <b className="text-primary text-[#D0311F]">популярное</b>
        </div>
    );
};