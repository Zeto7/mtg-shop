'use client';

import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import { cn } from "@/shared/lib/utils";
import React from "react";
import { useRouter } from "next/navigation";
import { ChooseProductForm } from "../choose-product-form";
import { ProductWithRelations } from "@/@types/prisma";
import { ChooseKitForm } from "../choose-kit-form";

interface Prors {
    product: ProductWithRelations;
    className?: string;
}

export const ChooseProductModals: React.FC<Prors> = ({ className, product }) => {
    const router = useRouter();
    const isKitForm = Boolean(product.items[0])

    return (
        <Dialog open={Boolean(product)} onOpenChange={() => router.back()}>
            <DialogContent className={cn("p-0 w-[1160px] max-w-[1160px] min-h-[700px] bg-white overflow-hidden", className)}>
                { isKitForm ? ( <ChooseKitForm imageUrl={product.imageUrl} name={product.name} additionals={[]} items={[]}/> ) : 
                    ( <ChooseProductForm imageUrl={product.imageUrl} name={product.name} items={[]}/> )
                }
            </DialogContent>
        </Dialog>
    )
};