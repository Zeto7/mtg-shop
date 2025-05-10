'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/prisma/prisma-client';
import { ProductWithRelations } from '@/@types/prisma';
import { Prisma } from '@prisma/client';

const productItemSchema = z.object({
    id: z.number().optional(),
    amount: z.coerce.number().int().min(0).max(1, "Amount must be 0 or 1").optional().nullable(),
    price: z.coerce.number().int().min(0, 'Item price must be non-negative'),
});

const productSchemaBase = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    description: z.string().optional(),
    imageUrl: z.string().url('Invalid image URL').or(z.literal('')),
    price: z.coerce.number().int().min(0, 'Base price must be non-negative'),
    categoryId: z.coerce.number().int().positive('Category is required'),
    items: z.array(productItemSchema).length(1, 'Product must have exactly one variation.'),
    additionalIds: z.array(z.coerce.number().int().positive()).optional(),
});

const createProductSchema = productSchemaBase;
const updateProductSchema = productSchemaBase.extend({
    id: z.coerce.number().int().positive(),
});

const updateProductStockSchema = z.object({
    productId: z.number().int().positive(),
    newAmount: z.coerce.number().int().min(0),
});

export async function getProducts(): Promise<ProductWithRelations[]> {
    try {
        return await prisma.product.findMany({
            include: { category: true, items: true, additionals: true, },
            orderBy: { name: 'asc' },
        });
    } catch (error) { console.error("Failed to fetch products:", error); return []; }
}
export async function getCategories() {
    try { return await prisma.category.findMany({ orderBy: { name: 'asc' } }); }
    catch (error) { console.error("Failed to fetch categories:", error); return []; }
}
export async function getAllAdditionals() {
    try { return await prisma.additional.findMany({ orderBy: { name: 'asc' } }); }
    catch (error) { console.error("Failed to fetch additionals:", error); return []; }
}

function parseFormData(formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    let parsedData: any = { ...rawData };

    if (rawData.items && typeof rawData.items === 'string') {
        try { parsedData.items = JSON.parse(rawData.items); }
        catch (e) { console.error("Failed to parse items JSON:", e); parsedData.items = null; }
    } else if (!rawData.items) { parsedData.items = []; }

    if (rawData.additionalIds && typeof rawData.additionalIds === 'string') {
        try {
            const ids = JSON.parse(rawData.additionalIds);
            if (Array.isArray(ids) && ids.every(id => typeof id === 'number')) {
                parsedData.additionalIds = ids;
            } else { parsedData.additionalIds = null; }
        } catch (e) { console.error("Failed to parse additionalIds JSON:", e); parsedData.additionalIds = null; }
    } else if (!rawData.additionalIds) { parsedData.additionalIds = []; }

    if (rawData.id) parsedData.id = parseInt(rawData.id as string, 10);

    if (rawData.price) parsedData.price = parseInt(rawData.price as string, 10);

    if (rawData.categoryId) parsedData.categoryId = parseInt(rawData.categoryId as string, 10);

    if (parsedData.items && Array.isArray(parsedData.items)) {
        parsedData.items = parsedData.items.map((item: any) => ({
            id: item.id !== undefined ? parseInt(String(item.id), 10) : undefined,
            price: item.price !== undefined ? parseInt(String(item.price), 10) : 0,
            amount: (item.amount !== undefined && item.amount !== null && !isNaN(parseInt(String(item.amount), 10)))
                    ? parseInt(String(item.amount), 10) : 0,
        }));
    }
    return parsedData;
}

export async function addProductAction(formData: FormData) {
    const parsedData = parseFormData(formData);
    const validationResult = createProductSchema.safeParse(parsedData);

    if (!validationResult.success) {
        console.error("Validation failed (create):", validationResult.error.format());
        return { success: false, errors: validationResult.error.flatten().fieldErrors };
    }

    const { items, additionalIds, ...productData } = validationResult.data;
    const showAdditionals = items[0].amount === 1;

    try {
        const newProduct = await prisma.product.create({
            data: {
                ...productData,
                imageUrl: productData.imageUrl || '',
                description: productData.description || null,
                items: {
                    create: items.map(item => ({
                        price: item.price,
                        amount: item.amount ?? 0,
                    })),
                },
                additionals: {
                    connect: (showAdditionals && additionalIds && additionalIds.length > 0)
                        ? additionalIds.map(id => ({ id }))
                        : [],
                },
            },
            include: { items: true, additionals: true, category: true },
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
        console.error("Validation failed (update):", validationResult.error.format());
        return { success: false, errors: validationResult.error.flatten().fieldErrors };
    }

    const { id, items, additionalIds, ...productData } = validationResult.data;
    const submittedItem = items[0];
    const showAdditionals = submittedItem.amount === 1;

    try {
        const existingProduct = await prisma.product.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!existingProduct) return { success: false, message: "Product not found." };

        const itemOperations: any = {};
        if (existingProduct.items.length > 0) {
            itemOperations.update = [{
                where: { id: existingProduct.items[0].id },
                data: { price: submittedItem.price, amount: submittedItem.amount ?? 0 },
            }];
            if (existingProduct.items.length > 1) {
                 itemOperations.deleteMany = { id: { in: existingProduct.items.slice(1).map(item => item.id) } };
            }
        } else {
            itemOperations.create = [{ price: submittedItem.price, amount: submittedItem.amount ?? 0 }];
        }

        const updatedProduct = await prisma.product.update({
            where: { id },
            data: {
                ...productData,
                imageUrl: productData.imageUrl || '',
                description: productData.description || null,
                items: itemOperations,
                additionals: {
                    set: (showAdditionals && additionalIds && additionalIds.length > 0)
                        ? additionalIds.map(addId => ({ id: addId }))
                        : [],
                },
            },
            include: { items: true, additionals: true, category: true },
        });

        revalidatePath('/dashboard');
        revalidatePath(`/products/${id}`);
        return { success: true, product: updatedProduct };
    } catch (error) {
        console.error("Failed to update product:", error);
        return { success: false, message: "Database error: Failed to update product." };
    }
}


export async function deleteProductAction(productId: number) {
    console.log(`[DEL_PROD_START] Attempting to delete product ID: ${productId}`);

    if (!productId || typeof productId !== 'number' || isNaN(productId)) {
        console.error(`[DEL_PROD_ERROR] Invalid productId: ${productId}`);
        return { success: false, message: "Product ID is invalid or missing." };
    }

    let productBeforeDelete = null;
    try {
        console.log(`[DEL_PROD_INFO] Fetching product before delete. ID: ${productId}`);
        productBeforeDelete = await prisma.product.findUnique({ where: { id: productId } });
        if (!productBeforeDelete) {
            console.log(`[DEL_PROD_INFO] Product not found for ID: ${productId}. Cannot delete.`);
            return { success: false, message: "Product not found." };
        }
        console.log(`[DEL_PROD_INFO] Product found:`, JSON.stringify(productBeforeDelete));
    } catch (fetchError: any) {
        console.error(`[DEL_PROD_ERROR] Error fetching product before delete. ID: ${productId}`, fetchError);
        return { success: false, message: "Error checking product existence." };
    }


    try {
        console.log(`[DEL_PROD_INFO] Calling prisma.product.delete for ID: ${productId}`);
        let deleteResult;
        try {
            deleteResult = await prisma.product.delete({
                where: { id: productId },
            });
            console.log(`[DEL_PROD_SUCCESS_DB] Product deleted from DB. Result:`, JSON.stringify(deleteResult));
        } catch (prismaDeleteError: any) {
            console.error(`[DEL_PROD_ERROR_PRISMA_DELETE] Prisma.delete failed for ID: ${productId}. Error:`, prismaDeleteError);
            throw prismaDeleteError;
        }

        console.log(`[DEL_PROD_INFO] Attempting to revalidate path /dashboard. ID: ${productId}`);
        revalidatePath('/dashboard');
        console.log(`[DEL_PROD_SUCCESS_REVALIDATE] Path /dashboard revalidated. ID: ${productId}`);

        return { success: true, message: "Product deleted successfully." };

    } catch (error: any) {
        console.error(`[DEL_PROD_ERROR_MAIN_CATCH] Error during product deletion process. ID: ${productId}.`);
        console.error("[DEL_PROD_ERROR_MAIN_CATCH_RAW_ERROR_OBJECT]", error);
        console.error("[DEL_PROD_ERROR_MAIN_CATCH_STACK_TRACE]", error.stack);
    
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            console.error(`[DEL_PROD_ERROR_MAIN_CATCH] Prisma Error Code: ${error.code}. ID: ${productId}`);
            if (error.code === 'P2003') {
                return { success: false, message: "Cannot delete product. It might be referenced in orders or elsewhere." };
            }
            if (error.code === 'P2025') {
                return { success: false, message: "Product not found (error during delete)." };
            }
        }
        const errorMessage = error.message || "An unexpected error occurred while deleting the product.";
        return { success: false, message: errorMessage };
    }
}

type UpdateStockResult = {
    success: boolean;
    message?: string;
    product?: { id: number; amount: number | null };
};

export async function updateProductStock(
    data: { productId: number; newAmount: number }
): Promise<UpdateStockResult> {
    const validation = updateProductStockSchema.safeParse(data);

    if (!validation.success) {
        console.error("Update stock validation failed:", validation.error.format());
        return { success: false, message: "Неверные данные для обновления остатка." };
    }

    const { productId, newAmount } = validation.data;

    try {
        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: { amount: newAmount },
            select: { id: true, amount: true },
        });

        console.log(`Stock updated for product ID ${productId} to ${newAmount}`);
        revalidatePath('/dashboard', 'layout');

        return { success: true, product: updatedProduct, message: `Остаток товара #${productId} обновлен.` };
    } catch (error: any) {
        console.error(`Error updating stock for product ID ${productId}:`, error);
        let message = 'Ошибка сервера при обновлении остатка.';
        if (error.code === 'P2025') {
            message = 'Товар для обновления остатка не найден.';
        } else if (error.message) {
            message = error.message;
        }
        return { success: false, message };
    }
}