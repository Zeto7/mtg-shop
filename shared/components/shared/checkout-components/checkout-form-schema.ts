import { z } from "zod";
import { ShippingMethod } from "../checkout-sidebar";

export const checkoutFormSchema = z.object({
  firstName: z.string().min(1, { message: "Введите имя" }),
  lastName: z.string().min(1, { message: "Введите фамилию" }),
  email: z.string().email({ message: "Введите корректный email" }),
  phone: z.string().min(5, { message: "Введите телефон" }),
  address: z.string().optional(),
  comment: z.string().optional(),

  shippingMethod: z.custom<ShippingMethod>(),
})
// refine для условной валидации адреса
.refine((data) => {
    if (data.shippingMethod === 'delivery') {
        return !!data.address && data.address.trim().length > 0;
    }
    // если самовывоз
    return true;
}, {
    message: "Введите адрес для доставки",
    path: ["address"],
});


export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;