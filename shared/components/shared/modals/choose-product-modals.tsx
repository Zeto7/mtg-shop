'use client';

import { Dialog, DialogContent, DialogTitle } from "@/shared/components/ui/dialog";
import { cn } from "@/shared/lib/utils";
import React from "react";
import { useRouter } from "next/navigation";
import { ProductWithRelations } from "@/@types/prisma";
import { ProductForm } from "../product-form";

interface Prors {
    product: ProductWithRelations;
    className?: string;
}

export const ChooseProductModals: React.FC<Prors> = ({ className, product }) => {
    const router = useRouter();
    return (
        <Dialog open={Boolean(product)} onOpenChange={() => router.back()}>
            <DialogContent className={cn("p-0 w-[1160px]` max-w-[1160px] min-h-[700px] bg-white overflow-hidden", className)}>
                <DialogTitle className="hidden"/>
                    <ProductForm product={product} onSubmit={() => router.back()}/>
            </DialogContent>
        </Dialog>
    )
};