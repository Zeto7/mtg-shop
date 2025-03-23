import { prisma } from "@/prisma/prisma-client";
import { ChooseProductModals } from "@/shared/components/shared/modals/choose-product-modals";
import { notFound } from "next/navigation";

export default async function ProductModalPage({params: {id}}: {params: {id: string}}) {
    const product = await prisma.product.findFirst({ where: { id: Number(id), }, 
    include: {
         additionals: true, 
         items: true, 
        },
    });
    
    if (!product) {
        return notFound();
    }

    
    const mappedProduct = {
        ...product,
        additionals: product.additionals,
    };

    return <ChooseProductModals product={mappedProduct}/>

}