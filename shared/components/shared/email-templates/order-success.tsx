import { CartItemDTO } from '@/shared/services/dto/cart.dto';
import React from 'react';

interface Props {
    orderId: number;
    items: CartItemDTO[];
}

export const OrderSuccessTemplate: React.FC<Props> = ({ orderId, items }) => (
    <div>
        <h1>Спасибо за покупку! 😀</h1>
        <p>Ваш заказ #{orderId} оплачен. Список товаров:</p>
        <ul> 
            { items.map((item) =>(
                <li key={item.id}>
                    {item.productItem.product.name} | {item.productItem.price} Br
                </li>
            ))};
        </ul>
    </div>
);