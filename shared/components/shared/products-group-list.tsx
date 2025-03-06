'use client';

import { cn } from "@/shared/lib/utils";
import React from "react"
import { Title } from "./title";
import { ProductCard } from "./product-card";
import { useIntersection } from "react-use";
import { useCategoryStore } from "@/shared/store/category";

interface Props {
    title: string;
    products: any[];
    classname?: string;
    listClassName?: string;
    categoryId: number;
}

export const ProductsGroupList: React.FC<Props> = ({title, products, classname, listClassName, categoryId }) => {  
    const setActivCategoryId = useCategoryStore((state) => state.setActiveId);
    const intersectionRef = React.useRef(null);
    const intersection = useIntersection(intersectionRef as any, {
        threshold: 0.4,
      });

    React.useEffect(() => {
        if (intersection?.isIntersecting) {
            setActivCategoryId(categoryId);
        }
    }, [categoryId, intersection?.isIntersecting, title]);
    //console.log(products)
    return (
        <div className={classname} id={title} ref={intersectionRef}>
            <Title text={title} size="lg" className="font-extrabold mb-5"/>
            <div className={cn('grid grid-cols-3 gap-[50px]', listClassName)}>
            {products.map((product, i) => (
                <ProductCard key={product.id} id={product.id} name={product.name} imageUrl={product.imageUrl} price={product.price || 0} />
            ))}
            </div>
        </div>
    );
};