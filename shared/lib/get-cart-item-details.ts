import React from "react"
import { cn } from "@/shared/lib/utils"
import { KitAmount } from "../constants/kit"
import { Additional } from "@prisma/client"
import { CartStateItem } from "./get-cart-details"



export const getCartItemDetails = (additionals: CartStateItem['additionals'] | null, kitAmount?: KitAmount[] | null ): string => {
    const details = [];

    if (kitAmount) {
      details.push(`Наборов: ${kitAmount}`);
    }
  
    if (additionals) {
      details.push(...additionals.map((additional) => additional.name));
    }

    return details.join(', ')
}