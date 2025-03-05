import { Container } from "@/components/shared/container";
import { prisma } from "@/prisma/prisma-client"
import { notFound } from "next/navigation";
import { ProductImage } from "@/components/shared/Product-Imange";
import { Title } from "@/components/shared/title";
import { GroupVariants } from "@/components/shared/group-variants";
import { ChooseProductModals } from "@/components/shared/modals/choose-product-modals";


export default async function ProductModalPage({params: {id}}: {params: {id: string}}) {
    const product = await prisma.product.findFirst({ where: { id: Number(id), }, include: { Additionals: true, items: true, },});

    if (!product) {
        return notFound();
    }

    return <ChooseProductModals product={product}/>

}