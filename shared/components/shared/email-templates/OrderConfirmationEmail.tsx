import React from 'react';
import { Order } from '@prisma/client';

interface OrderJsonItem {
    id: number; quantity: number; productItemId: number;
    productItem?: {
        id: number; price: number; productId: number;
        product?: { id: number; name: string; imageUrl?: string; }
    }
    additionals?: { id: number; name: string; price: number }[];
}

interface OrderConfirmationEmailProps {
    orderId: number; orderDate: Date; totalAmount: number;
    fullName: string; items: OrderJsonItem[]; address: string;
    comment?: string;
}

const formatCurrency = (amount: number) => (amount / 100).toFixed(2).replace('.', ',') + ' Br';

const OrderConfirmationEmail: React.FC<OrderConfirmationEmailProps> = ({
    orderId, orderDate, totalAmount, fullName, items, address, comment
}) => (
    <html lang="ru">
      <head>
        <meta charSet="UTF-8" />
        <title>Подтверждение Заказа #{orderId}</title>
        <style>{/* ... Стили ... */}</style>
      </head>
      <body>
        <div className="container" style={{maxWidth: '600px', margin: '20px auto', padding: '20px', border: '1px solid #eee', borderRadius: '5px', fontFamily: 'sans-serif', lineHeight: 1.5, color: '#333'}}>
          <h1 style={{color: '#000'}}>Спасибо за ваш заказ, {fullName}!</h1>
          <p>Ваш заказ #{orderId} от {new Date(orderDate).toLocaleDateString('ru-RU')} успешно принят.</p>
          <h2 style={{color: '#000'}}>Детали заказа:</h2>
          <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '20px'}}>
            <thead><tr><th style={{border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2'}}>Товар</th><th>Кол-во</th><th>Цена</th><th>Сумма</th></tr></thead>
            <tbody>
              {items.map((item, index) => {
                 const productName = item.productItem?.product?.name ?? `Товар (ID: ${item.productItemId})`;
                 const itemPrice = item.productItem?.price ?? 0;
                 const additionalsTotal = item.additionals?.reduce((sum, add) => sum + (add?.price ?? 0), 0) ?? 0;
                 const displayPrice = itemPrice + additionalsTotal;
                 const itemTotal = displayPrice * item.quantity;
                 return (<tr key={`${item.id}-${index}`}><td>{productName} {item.additionals && item.additionals.length > 0 && `(+ ${item.additionals.map(a => a?.name).join(', ')})`}</td><td>{item.quantity}</td><td>{formatCurrency(displayPrice)}</td><td>{formatCurrency(itemTotal)}</td></tr>);
              })}
            </tbody>
          </table>
          <p style={{fontWeight: 'bold', fontSize: '1.1em'}}>Итого к оплате: {formatCurrency(totalAmount)}</p>
          <h2 style={{color: '#000'}}>Информация о доставке:</h2>
          <p><strong>Получатель:</strong> {fullName}</p>
          <p><strong>Адрес:</strong> {address}</p>
          {comment && <p><strong>Комментарий:</strong> {comment}</p>}
          <p>Мы свяжемся с вами для подтверждения деталей.</p>
          <p>С уважением,<br/>Команда MTG Shop</p>
        </div>
      </body>
    </html>
);

export default OrderConfirmationEmail; // Убедитесь, что экспорт по умолчанию