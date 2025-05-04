
import { Order } from '@prisma/client';
import React from 'react';
import { CartStateItem } from '@/shared/lib/get-cart-details';

interface OrderItemData {
    id: number;
    quantity: number;
    productItemId: number;
    productItem?: {
        id: number;
        price: number;
        amount: number | null;
        productId: number;
        product?: {
            id: number;
            name: string;
            imageUrl: string;
        }
    }
    additionals?: { id: number; name: string; price: number }[];
}


interface OrderConfirmationEmailProps {
    orderId: number;
    orderDate: Date;
    totalAmount: number;
    fullName: string;
    items: OrderItemData[];
    address: string;
    comment?: string;
}

const formatCurrency = (amount: number) => {
  return (amount / 100).toFixed(2).replace('.', ',');
};

const OrderConfirmationEmail: React.FC<OrderConfirmationEmailProps> = ({
    orderId,
    orderDate,
    totalAmount,
    fullName,
    items,
    address,
    comment
}) => {
  return (
    <html lang="ru">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Подтверждение Заказа #{orderId}</title>
        <style>{`
          body { font-family: sans-serif; line-height: 1.5; color: #333; }
          .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #eee; border-radius: 5px; }
          h1, h2 { color: #000; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total { font-weight: bold; font-size: 1.1em; }
        `}</style>
      </head>
      <body>
        <div className="container">
          <h1>Спасибо за ваш заказ, {fullName}!</h1>
          <p>Ваш заказ #{orderId} от {new Date(orderDate).toLocaleDateString('ru-RU')} успешно принят.</p>

          <h2>Детали заказа:</h2>
          <table>
            <thead>
              <tr>
                <th>Товар</th>
                <th>Кол-во</th>
                <th>Цена за шт.</th>
                <th>Сумма</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                 const productInfo = item.productItem?.product;
                 const itemPrice = item.productItem?.price ?? 0;
                 const itemName = productInfo?.name ?? `Товар #${item.productItemId}`;
                 const itemTotal = itemPrice * item.quantity;

                 return (
                      <tr key={item.id}>
                          <td>{itemName}</td>
                          <td>{item.quantity}</td>
                          <td>{formatCurrency(itemPrice)} Br</td>
                          <td>{formatCurrency(itemTotal)} Br</td>
                      </tr>
                  );
              })}
            </tbody>
          </table>

          <p className="total">Итого к оплате: {formatCurrency(totalAmount)} Br</p>

          <h2>Информация о доставке:</h2>
          <p><strong>Получатель:</strong> {fullName}</p>
          <p><strong>Адрес:</strong> {address}</p>
          {comment && <p><strong>Комментарий:</strong> {comment}</p>}

          <p>Мы свяжемся с вами для подтверждения деталей доставки.</p>
          <p>С уважением,<br/>Команда MTG Shop</p>
        </div>
      </body>
    </html>
  );
};

export default OrderConfirmationEmail;