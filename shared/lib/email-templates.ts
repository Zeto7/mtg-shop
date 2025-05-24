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
                <ul style="margin: 5px 0 0 0; padding-left: 20px; font-size: 0.95em; color: #444;">
                    ${item.additionals.map(add => `<li style="margin-bottom: 3px;">${add.name} (+${add.price.toFixed(2)} Br)</li>`).join('')}
                </ul>
            `;
        }

        return `
            <tr style="border-bottom: 1px solid #eaeaea;">
                <td style="padding: 12px 10px; text-align: left; font-size: 1.05em;">${item.productItem?.product?.name || 'Неизвестный товар'}</td>
                <td style="padding: 12px 10px; text-align: center; font-size: 1.05em;">${item.quantity}</td>
                <td style="padding: 12px 10px; text-align: right; font-size: 1.05em;">${pricePerUnitWithAdditionals.toFixed(2)} Br</td>
                <td style="padding: 12px 10px; text-align: right; font-size: 1.05em;">${totalItemPrice.toFixed(2)} Br</td>
            </tr>
            ${additionalsHtml ? `<tr><td colspan="4" style="padding: 0px 10px 12px 15px;">${additionalsHtml}</td></tr>` : ''}
        `;
    }).join('');

    return `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.7; color: #333333; max-width: 700px; /* Увеличена ширина */ margin: 25px auto; border: 1px solid #dddddd; border-radius: 8px; padding: 25px 30px; background-color: #ffffff; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
            <h1 style="color: #2c3e50; text-align: center; border-bottom: 2px solid #eeeeee; padding-bottom: 15px; font-size: 1.8em; /* Увеличен заголовок */ margin-bottom: 20px;">Спасибо за ваш заказ, ${order.fullName}!</h1>
            <p style="font-size: 1.1em; /* Увеличен текст параграфа */ margin-bottom: 10px;">Ваш заказ <strong>#${order.id}</strong> в магазине MTG Shop успешно оформлен и принят в обработку.</p>
            <p style="font-size: 1.1em; margin-bottom: 25px;">Состояние вашего заказа можно просмотреть в вашем профиле на сайте.</p>
            
            <h2 style="color: #2c3e50; margin-top: 25px; border-bottom: 1px solid #eeeeee; padding-bottom: 8px; font-size: 1.5em; /* Увеличен подзаголовок */">Детали заказа:</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 1.05em; /* Увеличен текст таблицы */">
                <thead>
                    <tr style="background-color: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                        <th style="padding: 12px 10px; text-align: left; font-weight: 600;">Название товара</th>
                        <th style="padding: 12px 10px; text-align: center; font-weight: 600;">Кол-во</th>
                        <th style="padding: 12px 10px; text-align: right; font-weight: 600;">Цена за ед.</th>
                        <th style="padding: 12px 10px; text-align: right; font-weight: 600;">Сумма</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>

            <p style="text-align: right; font-size: 1.3em; /* Увеличена общая сумма */ font-weight: bold; margin-top: 25px; color: #2c3e50;">
                Общая сумма заказа: ${order.totalAmount.toFixed(2)} Br
            </p>
            
            <p style="font-size: 1.1em; margin-top: 20px;">Если у вас будут какие-то вопросы можете связаться с нами по этому номеру телефона: <strong>+375291112233</strong>.</p>
            <p style="font-size: 1.1em;">Адрес доставки: <strong>${order.address}</strong></p>
            ${order.comment ? `<p style="font-size: 1.1em;">Комментарий к заказу: <em style="color: #555;">${order.comment}</em></p>` : ''}
            
            <hr style="border: none; border-top: 1px solid #eeeeee; margin: 25px 0;" />
            
            <p style="font-size: 1em; /* Увеличен текст подписи */ text-align: center; color: #777777;">
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