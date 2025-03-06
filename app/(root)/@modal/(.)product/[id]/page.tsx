import { Container } from "@/shared/components/shared/container";
import { prisma } from "@/prisma/prisma-client"
import { notFound } from "next/navigation";
import { ProductImage } from "@/shared/components/shared/Product-Imange";
import { Title } from "@/shared/components/shared/title";
import { GroupVariants } from "@/shared/components/shared/group-variants";
import { ChooseProductModals } from "@/shared/components/shared/modals/choose-product-modals";


export default async function ProductModalPage({params: {id}}: {params: {id: string}}) {
    const product = await prisma.product.findFirst({ where: { id: Number(id), }, include: { Additionals: true, items: true, },});
    
    if (!product) {
        return notFound();
    }

    return <ChooseProductModals product={product}/>

}