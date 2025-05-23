import { Order } from '@prisma/client';

const formatCurrencyForEmail = (amount: number) => (amount).toFixed(2).replace('.', ',') + ' Br';

interface OrderItemDetailForEmail {
    id: number;
    quantity: number;
    productItemId: number;
    unitPrice?: number;
    productName?: string | null;
    productImageUrl?: string | null;
    additionals?: { id: number; name: string; price: number }[];
    totalPriceForItem: number;
}

interface GenerateOrderConfirmationEmailParams {
    order: Order;
}

interface EmailContent {
    html: string;
    text: string;
    subject: string;
}

export function generateOrderConfirmationEmail({
    order,
}: GenerateOrderConfirmationEmailParams): EmailContent {
    let parsedOrderItems: OrderItemDetailForEmail[] = [];
    if (typeof order.items === 'string') {
        try {
            parsedOrderItems = JSON.parse(order.items);
        } catch (e) {
            console.error("Failed to parse order.items for email generation:", e);
        }
    } else if (Array.isArray(order.items)) {
        parsedOrderItems = order.items as unknown as OrderItemDetailForEmail[];
    }


    const subject = `[MTG Shop] Ваш заказ #${order.id} успешно оформлен`;

    const itemsHtmlList = parsedOrderItems.map(item => `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px; vertical-align: top;">
                ${item.productName || 'Неизвестный товар'}
                ${item.additionals && item.additionals.length > 0 ?
                    `<br><small style="color: #555;">Допы: ${item.additionals.map(a => `${a.name} (+${formatCurrencyForEmail(a.price)})`).join(', ')}</small>` : ''}
            </td>
            <td style="padding: 10px; text-align: center; vertical-align: top;">${item.quantity}</td>
            <td style="padding: 10px; text-align: right; vertical-align: top;">${formatCurrencyForEmail(item.unitPrice || 0)}</td>
            <td style="padding: 10px; text-align: right; vertical-align: top;">${formatCurrencyForEmail(item.totalPriceForItem)}</td>
        </tr>
    `).join('');

    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                <h2 style="color: #2c3e50; text-align: center;">Спасибо за ваш заказ, ${order.fullName}!</h2>
                <p>Ваш заказ <strong>#${order.id}</strong> в магазине MTG Shop успешно оформлен и принят в обработку.</p>
                
                <h3 style="color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 30px;">Детали заказа:</h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 0.9em;">
                    <thead>
                        <tr style="background-color: #f9f9f9;">
                            <th style="padding: 10px; text-align: left; border-bottom: 1px solid #eee;">Товар</th>
                            <th style="padding: 10px; text-align: center; border-bottom: 1px solid #eee;">Кол-во</th>
                            <th style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">Цена за шт.</th>
                            <th style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">Сумма</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtmlList}
                    </tbody>
                </table>
                
                <div style="text-align: right; margin-top: 20px;">
                    <p style="font-size: 1.2em; font-weight: bold; color: #333;">Общая сумма заказа: ${formatCurrencyForEmail(order.totalAmount)}</p>
                </div>
                
                ${order.address ? `<p><strong>Адрес доставки:</strong> ${order.address}</p>` : '<p><strong>Способ получения:</strong> Самовывоз</p>'}
                ${order.comment ? `<p><strong>Комментарий к заказу:</strong> ${order.comment}</p>` : ''}
                
                <p style="margin-top: 30px;">Мы свяжемся с вами в ближайшее время для подтверждения деталей.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 0.9em; color: #777; text-align: center;">С уважением,<br/>Команда MTG Shop</p>
            </div>
        </div>
    `;

    const itemsTextList = parsedOrderItems.map(item =>
        `- ${item.productName || 'Неизвестный товар'}\n` +
        `  Количество: ${item.quantity}\n` +
        `  Цена за шт.: ${formatCurrencyForEmail(item.unitPrice || 0)}\n` +
        `  Сумма по позиции: ${formatCurrencyForEmail(item.totalPriceForItem)}\n` +
        `${item.additionals && item.additionals.length > 0 ? `  Допы: ${item.additionals.map(a => `${a.name} (+${formatCurrencyForEmail(a.price)})`).join(', ')}\n` : ''}`
    ).join('\n');

    const text = `
Спасибо за ваш заказ, ${order.fullName}!

Ваш заказ #${order.id} в магазине MTG Shop успешно оформлен и принят в обработку.

ДЕТАЛИ ЗАКАЗА:
-----------------------------------
${itemsTextList}
-----------------------------------

ОБЩАЯ СУММА ЗАКАЗА: ${formatCurrencyForEmail(order.totalAmount)}

${order.address ? `АДРЕС ДОСТАВКИ: ${order.address}` : 'СПОСОБ ПОЛУЧЕНИЯ: Самовывоз'}
${order.comment ? `КОММЕНТАРИЙ К ЗАКАЗУ: ${order.comment}` : ''}

Мы свяжемся с вами в ближайшее время для подтверждения деталей.

С уважением,
Команда MTG Shop
    `;

    return { html, text, subject };
}