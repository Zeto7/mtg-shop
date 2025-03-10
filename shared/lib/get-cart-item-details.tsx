import React from "react"
import { cn } from "@/shared/lib/utils"
import { KitAmount } from "../constants/kit"
import { Additional } from "@prisma/client"



export const getCartItemDetails = ( kitAmount: KitAmount[], additionals: Additional[] ): string => {
    const details = [];

    if (kitAmount) {
      details.push(`Наборов: ${kitAmount}`);
    }
  
    if (additionals) {
      details.push(...additionals.map((additional) => additional.name));
    }

    return details.join(', ')
}