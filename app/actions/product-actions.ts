'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/prisma/prisma-client';
import { ProductWithRelations } from '@/@types/prisma';

const productItemSchema = z.object({
    // id не нужен для создания, но может быть нужен для обновления/удаления
    id: z.number().optional(),
    amount: z.coerce.number().int().min(0).optional().nullable(),
    price: z.coerce.number().int().min(0, 'Item price must be non-negative'),
});

const productSchemaBase = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    description: z.string().optional(),
    imageUrl: z.string().url('Invalid image URL').or(z.literal('')),
    price: z.coerce.number().int().min(0, 'Base price must be non-negative'),
    categoryId: z.coerce.number().int().positive('Category is required'),
    items: z.array(productItemSchema).min(1, 'Product must have at least one variation/item'),
    additionalIds: z.array(z.coerce.number().int().positive()).optional(),
});

const createProductSchema = productSchemaBase; // ID нет при создании

const updateProductSchema = productSchemaBase.extend({
    id: z.coerce.number().int().positive(), // ID обязателен для обновления
    // В items для обновления могут быть id существующих items
});


// Функции для получения данных

export async function getProducts(): Promise<ProductWithRelations[]> {
    try {
        return await prisma.product.findMany({
            include: {
                category: true,
                items: true,
                additionals: true,
            },
            orderBy: { name: 'asc' },
        });
    } catch (error) {
        console.error("Failed to fetch products:", error);
        return [];
    }
}

export async function getCategories() {
    try {
        return await prisma.category.findMany({ orderBy: { name: 'asc' } });
    } catch (error) {
        console.error("Failed to fetch categories:", error);
        return [];
    }
}

export async function getAllAdditionals() {
    try {
        return await prisma.additional.findMany({ orderBy: { name: 'asc' } });
    } catch (error) {
        console.error("Failed to fetch additionals:", error);
        return [];
    }
}

// Распарсить данные формы, включая JSON строки для items и additionals
function parseFormData(formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    let parsedData = { ...rawData };

    // Парсим items (если передается как JSON строка)
    if (rawData.items && typeof rawData.items === 'string') {
        try {
            parsedData.items = JSON.parse(rawData.items);
        } catch (e) {
            console.error("Failed to parse items JSON:", e);
             parsedData.items = null;
        }
    } else if (!rawData.items) {
         parsedData.items = [];
    }


    // Парсим additionalIds (если передается как JSON строка)
    if (rawData.additionalIds && typeof rawData.additionalIds === 'string') {
        try {
             const ids = JSON.parse(rawData.additionalIds);
             // Убедимся, что это массив чисел
             if(Array.isArray(ids) && ids.every(id => typeof id === 'number')) {
                 parsedData.additionalIds = ids;
             } else {
                 parsedData.additionalIds = null;
             }
        } catch (e) {
            console.error("Failed to parse additionalIds JSON:", e);
             parsedData.additionalIds = null;
        }
    } else if (!rawData.additionalIds) {
        parsedData.additionalIds = []; // Если не передано, считаем пустым массивом
    }


    // Приводим числовые поля к числам перед валидацией Zod
    if (rawData.id) parsedData.id = parseInt(rawData.id as string, 10);
    if (rawData.price) parsedData.price = parseInt(rawData.price as string, 10);
    if (rawData.categoryId) parsedData.categoryId = parseInt(rawData.categoryId as string, 10);
     if (parsedData.items && Array.isArray(parsedData.items)) {
         parsedData.items = parsedData.items.map((item: any) => ({
             ...item,
             id: item.id ? parseInt(item.id, 10) : undefined,
             price: item.price ? parseInt(item.price as string, 10) : 0,
             amount: item.amount ? parseInt(item.amount as string, 10) : null,
         }));
     }

    return parsedData;
}


export async function addProductAction(formData: FormData) {
    const parsedData = parseFormData(formData);

    const validationResult = createProductSchema.safeParse(parsedData);

    if (!validationResult.success) {
        console.error("Validation failed (create):", validationResult.error.errors);
        return { success: false, errors: validationResult.error.flatten().fieldErrors };
    }

    const { items, additionalIds, ...productData } = validationResult.data;

    try {
        const newProduct = await prisma.product.create({
            data: {
                ...productData,
                imageUrl: productData.imageUrl || '', // Prisma ожидает строку, не null по схеме
                description: productData.description,
                items: {
                    create: items.map(item => ({
                        price: item.price,
                        amount: item.amount,
                    })),
                },
                additionals: {
                    // Связываем с существующими Additional по их ID
                    connect: additionalIds?.map(id => ({ id })) ?? [],
                },
            },
            include: { items: true, additionals: true, category: true }, // Возвращаем с связями
        });
        revalidatePath('/dashboard');
        return { success: true, product: newProduct };
    } catch (error) {
        console.error("Failed to create product:", error);
        return { success: false, message: "Database error: Failed to create product." };
    }
}

export async function updateProductAction(formData: FormData) {
    const parsedData = parseFormData(formData);

    const validationResult = updateProductSchema.safeParse(parsedData);

    if (!validationResult.success) {
        console.error("Validation failed (update):", validationResult.error.errors);
        return { success: false, errors: validationResult.error.flatten().fieldErrors };
    }

    const { id, items, additionalIds, ...productData } = validationResult.data;

    try {
        // Логика обновления items сложнее.
        // Простой вариант: удалить старые, создать новые.
        // Сложный: найти какие создать, какие обновить, какие удалить.
        // Используем сложный вариант с upsert/delete для items.

        const existingProduct = await prisma.product.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!existingProduct) {
            return { success: false, message: "Product not found." };
        }

        const existingItemIds = existingProduct.items.map(item => item.id);
        const submittedItemIds = items.map(item => item.id).filter(itemId => !!itemId); // ID из формы

        const itemIdsToDelete = existingItemIds.filter(existingId => !submittedItemIds.includes(existingId));
        const itemsToCreate = items.filter(item => !item.id); // Новые, без ID
        const itemsToUpdate = items.filter(item => item.id && existingItemIds.includes(item.id)); // Существующие для обновления

        const updatedProduct = await prisma.product.update({
            where: { id },
            data: {
                ...productData,
                imageUrl: productData.imageUrl || '',
                description: productData.description,
                items: {
                     // Удаляем те, что не пришли в запросе
                     deleteMany: itemIdsToDelete.length > 0 ? { id: { in: itemIdsToDelete } } : undefined,
                     // Создаем новые
                     create: itemsToCreate.map(item => ({
                         price: item.price,
                         amount: item.amount,
                     })),
                     // Обновляем существующие
                     update: itemsToUpdate.map(item => ({
                         where: { id: item.id },
                         data: {
                             price: item.price,
                             amount: item.amount,
                         },
                     })),
                },
                additionals: {
                    // Заменяем все связи на новый набор ID
                    set: additionalIds?.map(addId => ({ id: addId })) ?? [],
                },
            },
            include: { items: true, additionals: true, category: true }, // Возвращаем с связями
        });

        revalidatePath('/dashboard');
        revalidatePath(`/products/${id}`); // Если есть страница деталей
        return { success: true, product: updatedProduct };
    } catch (error) {
        console.error("Failed to update product:", error);
        return { success: false, message: "Database error: Failed to update product." };
    }
}


export async function deleteProductAction(productId: number) {
    if (!productId) {
        return { success: false, message: "Product ID is required." };
    }

    try {
        await prisma.product.delete({
            where: { id: productId },
        });
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete product:", error);
         if (error instanceof Prisma.PrismaClientKnownRequestError) {
             if (error.code === 'P2003') { // Foreign key constraint failed
                 return { success: false, message: "Cannot delete product. It might be referenced elsewhere." };
             }
              if (error.code === 'P2025') { // Record to delete not found
                 return { success: false, message: "Product not found." };
             }
         }
        return { success: false, message: "Failed to delete product." };
    }
}