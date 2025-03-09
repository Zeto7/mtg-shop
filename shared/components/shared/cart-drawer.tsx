import React from "react"
import { cn } from "@/shared/lib/utils"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger, } from "@/shared/components/ui/sheet"

interface Props {
    className?: string
}

export const CartDrawer: React.FC<React.PropsWithChildren<Props>> = ({children, className}) => {
    return (
        <Sheet>
            <SheetTrigger asChild>{children}</SheetTrigger>
        </Sheet>
    )
}