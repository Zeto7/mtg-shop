'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/prisma/prisma-client';
import { ProductWithRelations } from '@/@types/prisma';
import { Prisma } from '@prisma/client';
import { ActionResult } from 'next/dist/server/app-render/types';

import fs from 'fs/promises';
import path from 'path';
import { stat, mkdir, rm } from 'fs/promises';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'products');

async function ensureUploadDirExists() {
    try {
        await stat(UPLOAD_DIR);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            await mkdir(UPLOAD_DIR, { recursive: true });
            console.log(`Created upload directory: ${UPLOAD_DIR}`);
        } else {
            console.error("Error checking/creating upload directory:", error);
            throw error;
        }
    }
}


const productItemSchema = z.object({
    id: z.number().optional(),
    amount: z.coerce.number().int().min(0).max(1, "Amount must be 0 or 1").optional().nullable(),
    price: z.coerce.number().int().min(0, 'Item price must be non-negative'),
});

const productSchemaBase = z.object({
    name: z.string().min(3, 'Имя должно содержать хотя бы 3 символа'),
    description: z.string().optional(),
    imageUrl: z.string().url('Неверный URL изображения').or(z.literal('')).optional(),
    price: z.coerce.number().int().min(0, 'Цена не должна быть атрицательной'),
    categoryId: z.coerce.number().int().positive('Категория обязательна'),
    items: z.array(productItemSchema).length(1, 'Product must have exactly one variation.'),
    additionalIds: z.array(z.coerce.number().int().positive()).optional(),
});

const createProductSchema = productSchemaBase;
const updateProductSchema = productSchemaBase.extend({
    id: z.coerce.number().int().positive(),
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
    delete parsedData.imageFile;


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


const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];


async function handleImageUpload(imageFile: File | null, existingImageUrl?: string | null): Promise<{ imageUrl?: string; error?: string }> {
    if (!imageFile) {
        return { imageUrl: existingImageUrl || '' };
    }

    if (imageFile.size > MAX_FILE_SIZE) {
        return { error: 'Размер файла не должен превышать 5MB.' };
    }
    if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
        return { error: 'Недопустимый тип файла. Разрешены: JPG, PNG, WEBP, GIF.' };
    }

    await ensureUploadDirExists();

    if (existingImageUrl) {
        const oldFileName = path.basename(existingImageUrl);
        const oldFilePath = path.join(UPLOAD_DIR, oldFileName);
        if (existingImageUrl.startsWith('/uploads/products/')) {
            try {
                await stat(oldFilePath);
                await rm(oldFilePath);
                console.log(`Deleted old image: ${oldFilePath}`);
            } catch (e: any) {
                if (e.code !== 'ENOENT') {
                     console.error(`Could not delete old image ${oldFilePath}:`, e);
                }
            }
        }
    }


    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const fileExtension = path.extname(imageFile.name) || `.${imageFile.type.split('/')[1]}`;
    const filename = `${imageFile.name.replace(/\.[^/.]+$/, "")}-${uniqueSuffix}${fileExtension}`;
    const filePath = path.join(UPLOAD_DIR, filename);
    
    try {
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        await fs.writeFile(filePath, buffer);
        return { imageUrl: `/uploads/products/${filename}` };
    } catch (e) {
        console.error("Error saving image:", e);
        return { error: "Не удалось сохранить изображение." };
    }
}


export async function addProductAction(formData: FormData) {
    const parsedData = parseFormData(formData);
    const imageFile = formData.get('imageFile') as File | null;

    const validationResult = createProductSchema.safeParse(parsedData);
    if (!validationResult.success) {
        console.error("Validation failed (create):", validationResult.error.format());
        return { success: false, errors: validationResult.error.flatten().fieldErrors };
    }

    const imageUploadResult = await handleImageUpload(imageFile);
    if (imageUploadResult.error) {
        return { success: false, errors: { imageFile: [imageUploadResult.error] } };
    }
    
    const finalImageUrl = imageUploadResult.imageUrl || validationResult.data.imageUrl || '';


    const { items, additionalIds, ...productDataFromZod } = validationResult.data;
    const showAdditionals = items[0].amount === 1;

    try {
        const newProduct = await prisma.product.create({
            data: {
                ...productDataFromZod,
                imageUrl: finalImageUrl,
                description: productDataFromZod.description || null,
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
    const imageFile = formData.get('imageFile') as File | null;

    const validationResult = updateProductSchema.safeParse(parsedData);

    if (!validationResult.success) {
        console.error("Validation failed (update):", validationResult.error.format());
        return { success: false, errors: validationResult.error.flatten().fieldErrors };
    }

    const { id, items, additionalIds, ...productDataFromZod } = validationResult.data;

    const existingProduct = await prisma.product.findUnique({
        where: { id },
        select: { imageUrl: true, items: true }
    });

    if (!existingProduct) return { success: false, message: "Product not found." };

    const imageUploadResult = await handleImageUpload(imageFile, existingProduct.imageUrl);
    if (imageUploadResult.error) {
        return { success: false, errors: { imageFile: [imageUploadResult.error] } };
    }
    
    const finalImageUrl = imageUploadResult.imageUrl !== undefined ? imageUploadResult.imageUrl : (productDataFromZod.imageUrl || '');


    const submittedItem = items[0];
    const showAdditionals = submittedItem.amount === 1;

    try {
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
                ...productDataFromZod,
                imageUrl: finalImageUrl,
                description: productDataFromZod.description || null,
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
        if (error instanceof Error && error.message.includes("ENOENT")) {
            console.warn("Attempted to delete a non-existent old image, proceeding with update.");
        }
        return { success: false, message: "Database error: Failed to update product." };
    }
}


export async function deleteProductAction(productId: number): Promise<ActionResult> {
    console.log(`[DEL_PROD_START] Attempting to delete product ID: ${productId}`);

    if (!productId || typeof productId !== 'number' || isNaN(productId)) {
        const msg = `Invalid productId: ${productId}`;
        console.error(`[DEL_PROD_ERROR] ${msg}`);
        return { success: false, message: "ID товара недействителен или отсутствует." };
    }

    try {
        const productToDelete = await prisma.product.findUnique({
            where: { id: productId },
            select: { imageUrl: true }
        });

        if (!productToDelete) {
            console.log(`[DEL_PROD_INFO] Product with ID: ${productId} not found for deletion.`);
            return { success: false, message: "Товар не найден." };
        }


        const result = await prisma.$transaction(async (tx) => {
            const productItemsToDelete = await tx.productItem.findMany({
                where: { productId: productId },
                select: { id: true }
            });
            const productItemIds = productItemsToDelete.map(item => item.id);

            if (productItemIds.length > 0) {
                console.log(`[DEL_PROD_TX] Found ProductItem IDs to check in carts:`, productItemIds);
                const deletedCartItemsCount = await tx.cartItem.deleteMany({
                    where: { productItemId: { in: productItemIds } }
                });
                console.log(`[DEL_PROD_TX] Deleted ${deletedCartItemsCount.count} CartItems associated with product ${productId}.`);
            } else {
                console.log(`[DEL_PROD_TX] No ProductItems found for product ${productId}, skipping CartItem deletion.`);
            }

            if (productItemIds.length > 0) {
                console.log(`[DEL_PROD_TX] Deleting related ProductItems for Product ID: ${productId}`);
                await tx.productItem.deleteMany({ where: { productId: productId } });
                console.log(`[DEL_PROD_TX] Related ProductItems deleted.`);
            }

            console.log(`[DEL_PROD_TX] Deleting Product ID: ${productId}`);
            const deletedProduct = await tx.product.delete({
                where: { id: productId },
            });
            return deletedProduct;
        });

        if (productToDelete.imageUrl && productToDelete.imageUrl.startsWith('/uploads/products/')) {
            const filename = path.basename(productToDelete.imageUrl);
            const filePath = path.join(UPLOAD_DIR, filename);
            try {
                await ensureUploadDirExists();
                await rm(filePath);
                console.log(`[DEL_PROD_SUCCESS] Deleted image file: ${filePath}`);
            } catch (e: any) {
                if (e.code !== 'ENOENT') {
                    console.error(`[DEL_PROD_WARN] Could not delete image file ${filePath}:`, e);
                } else {
                    console.log(`[DEL_PROD_INFO] Image file ${filePath} not found, likely already deleted.`);
                }
            }
        }

        console.log(`[DEL_PROD_SUCCESS] Product ID: ${result.id}, its items, and related cart items deleted.`);
        revalidatePath('/dashboard');
        revalidatePath('/');
        return { success: true, message: "Товар и все связанные с ним записи (включая изображение) успешно удалены." };

    } catch (error: unknown) {
        console.error(`[DEL_PROD_ERROR_MAIN_CATCH] ID: ${productId}.`);
        let errorMessage = "Произошла непредвиденная ошибка при удалении товара.";

        if (error instanceof Error) {
            console.error("[DEL_PROD_ERROR_MAIN_CATCH_MESSAGE]", error.message);
            errorMessage = error.message;
        } else {
            console.error("[DEL_PROD_ERROR_MAIN_CATCH_RAW_STRINGIFIED]", String(error));
        }

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            console.error(`[DEL_PROD_ERROR_MAIN_CATCH] Prisma Error Code: ${error.code}.`);
            if (error.code === 'P2003') {
                errorMessage = "Невозможно удалить товар, он связан с другими важными записями (кроме корзин).";
            } else if (error.code === 'P2025') {
                errorMessage = "Товар или связанные с ним элементы не найдены для удаления.";
            } else {
                errorMessage = `Ошибка базы данных (код: ${error.code}) при удалении товара.`;
            }
        }
        return { success: false, message: errorMessage };
    }
}


type UpdateStockResult = {
    success: boolean;
    message?: string;
    product?: { id: number; amount: number | null };
};
const updateProductStockSchema = z.object({
    productId: z.number().int().positive(),
    newAmount: z.coerce.number().int().min(0),
});
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