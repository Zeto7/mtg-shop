import { Order } from '@prisma/client';

interface OrderItemWithProductInfo {
    id: number;
    quantity: number;
    productItem?: {
        id: number;
        price: number;
        product?: {
            id: number;
            name: string;
            imageUrl?: string | null;
        } | null;
    } | null;
    additionals?: {
        id: number;
        name: string;
        price: number;
    }[];
}

function parseAndPrepareOrderItems(itemsJsonString: string): OrderItemWithProductInfo[] {
    try {
        const parsedItems = JSON.parse(itemsJsonString) as any[];
        return parsedItems.map(item => {
            const productItem = item.productItem ? {
                id: Number(item.productItem.id),
                price: Number(item.productItem.price),
                product: item.productItem.product ? {
                    id: Number(item.productItem.product.id),
                    name: String(item.productItem.product.name),
                    imageUrl: item.productItem.product.imageUrl || null,
                } : null,
            } : null;

            const additionals = Array.isArray(item.additionals) ? item.additionals.map((add: any) => ({
                id: Number(add.id),
                name: String(add.name),
                price: Number(add.price),
            })) : [];

            return {
                id: Number(item.id),
                quantity: Number(item.quantity),
                productItem,
                additionals,
            };
        });
    } catch (error) {
        console.error("Error parsing order items JSON for email:", error);
        return [];
    }
}


export function generateOrderConfirmationHtml(order: Order): string {
    const orderItems = parseAndPrepareOrderItems(order.items as string);

    const itemsHtml = orderItems.map(item => {
        const baseItemPrice = item.productItem?.price ?? 0;
        const additionalsPricePerUnit = item.additionals?.reduce((sum, add) => sum + add.price, 0) ?? 0;
        const pricePerUnitWithAdditionals = baseItemPrice + additionalsPricePerUnit;
        const totalItemPrice = pricePerUnitWithAdditionals * item.quantity;

        let additionalsHtml = '';
        if (item.additionals && item.additionals.length > 0) {
            additionalsHtml = `
                <ul style="margin: 0; padding-left: 15px; font-size: 0.85em; color: #555;">
                    ${item.additionals.map(add => `<li>${add.name} (+${add.price.toFixed(2)} Br)</li>`).join('')}
                </ul>
            `;
        }

        return `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px; text-align: left;">${item.productItem?.product?.name || 'Неизвестный товар'}</td>
                <td style="padding: 10px; text-align: center;">${item.quantity}</td>
                <td style="padding: 10px; text-align: right;">${pricePerUnitWithAdditionals.toFixed(2)} Br</td>
                <td style="padding: 10px; text-align: right;">${totalItemPrice.toFixed(2)} Br</td>
            </tr>
            ${additionalsHtml ? `<tr><td colspan="4" style="padding: 0 10px 10px 10px;">${additionalsHtml}</td></tr>` : ''}
        `;
    }).join('');

    return `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 5px; padding: 20px;">
            <h1 style="color: #333; text-align: center; border-bottom: 2px solid #eee; padding-bottom: 10px;">Спасибо за ваш заказ, ${order.fullName}!</h1>
            <p>Ваш заказ <strong>#${order.id}</strong> в магазине MTG Shop успешно оформлен и принят в обработку.</p>
            
            <h2 style="color: #333; margin-top: 20px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Детали заказа:</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                    <tr style="background-color: #f9f9f9;">
                        <th style="padding: 10px; text-align: left;">Название товара</th>
                        <th style="padding: 10px; text-align: center;">Кол-во</th>
                        <th style="padding: 10px; text-align: right;">Цена за ед.</th>
                        <th style="padding: 10px; text-align: right;">Сумма</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>

            <p style="text-align: right; font-size: 1.2em; font-weight: bold; margin-top: 20px;">
                Общая сумма заказа: ${order.totalAmount.toFixed(2)} Br
            </p>
            
            <p>Мы свяжемся с вами в ближайшее время для подтверждения деталей по телефону: <strong>${order.phone}</strong>.</p>
            <p>Адрес доставки: <strong>${order.address}</strong></p>
            ${order.comment ? `<p>Комментарий к заказу: <em>${order.comment}</em></p>` : ''}
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            
            <p style="font-size: 0.9em; text-align: center; color: #777;">
                С уважением,<br/>Команда MTG Shop
            </p>
        </div>
    `;
}

export function generateOrderConfirmationText(order: Order): string {
    const orderItems = parseAndPrepareOrderItems(order.items as string);

    const itemsText = orderItems.map(item => {
        const baseItemPrice = item.productItem?.price ?? 0;
        const additionalsPricePerUnit = item.additionals?.reduce((sum, add) => sum + add.price, 0) ?? 0;
        const pricePerUnitWithAdditionals = baseItemPrice + additionalsPricePerUnit;
        const totalItemPrice = pricePerUnitWithAdditionals * item.quantity;
        let additionalsText = '';
        if (item.additionals && item.additionals.length > 0) {
            additionalsText = ` (Допы: ${item.additionals.map(add => `${add.name} (+${add.price.toFixed(2)} Br)`).join(', ')})`;
        }

        return `\n- ${item.productItem?.product?.name || 'Неизвестный товар'}${additionalsText}\n  Количество: ${item.quantity}, Цена за ед.: ${pricePerUnitWithAdditionals.toFixed(2)} Br, Сумма: ${totalItemPrice.toFixed(2)} Br`;
    }).join('');

    return `
Спасибо за ваш заказ, ${order.fullName}!

Ваш заказ #${order.id} в магазине MTG Shop успешно оформлен и принят в обработку.

Детали заказа:${itemsText}

Общая сумма заказа: ${order.totalAmount.toFixed(2)} Br.

Мы свяжемся с вами в ближайшее время для подтверждения деталей по телефону: ${order.phone}.
Адрес доставки: ${order.address}
${order.comment ? `Комментарий к заказу: ${order.comment}` : ''}

С уважением,
Команда MTG Shop
    `.trim(); // trim() чтобы убрать лишние пробелы в начале/конце
}