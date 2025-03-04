import { Container } from "@/components/shared/container";
import { prisma } from "@/prisma/prisma-client"
import { notFound } from "next/navigation";
import { ProductImage } from "@/components/shared/Product-Imange";
import { Title } from "@/components/shared/title";
import { GroupVariants } from "@/components/shared/group-variants";


export default async function ProductPage({params: {id}}: {params: {id: string}}) {
    const product = await prisma.product.findFirst({where: {id: Number(id)}});

    if (!product) {
        return notFound();
    }

    return <Container className="flex flex-col mt-10">
        <div className="flex flex-1">
            <ProductImage imageUrl={product.imageUrl} amount={1} />

            <div className="w-[490px] bg-[#FCFCFC] p-7">
                <Title text={product.name} size="md" className="font-extrabold mb-1"/>
                <p className="text-gray-400">Lorem, ipsum dolor sit amet consectetur adipisicing elit. Fugit, vel quis. Officia consequatur culpa velit repellat nesciunt</p>
                <GroupVariants selectedValue="2" items={[
                    {
                        name: '1x',
                        value: '1',
                    },
                    {
                        name: '2x',
                        value: '2',
                    },
                    {
                        name: '3x',
                        value: '3',
                    }
                ]}/>
            </div>
        </div>
    </Container>
}