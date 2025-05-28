'use client';

import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ProductWithRelations, CategoryData, AdditionalData } from '@/@types/prisma';
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from '../ui/label';
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { toast } from 'react-hot-toast';
import { useState, useMemo, useEffect, ChangeEvent, useRef } from 'react';
import { addProductAction, updateProductAction } from '@/app/actions/product-actions';
import { Switch } from "@/shared/components/ui/switch";
import Image from 'next/image';
import { UploadCloud, Pencil, X } from 'lucide-react';

const formSchema = z.object({
    id: z.number().optional(),
    name: z.string().min(3),
    description: z.string().optional(),
    imageUrl: z.string().url().or(z.literal('')).optional(),
    categoryId: z.coerce.number().int().positive(),
    items: z.array(z.object({
        id: z.number().optional(),
        amount: z.coerce.number().int().min(0).max(1).optional().nullable(),
        price: z.coerce.number().int().min(0),
    })).length(1, "Product must have exactly one variation."),
    additionalIds: z.array(z.coerce.number().int().positive()).optional(),
});

type ProductFormData = z.infer<typeof formSchema>;

interface ProductFormProps {
    product?: ProductWithRelations | null;
    categories: CategoryData[];
    allAdditionals: AdditionalData[];
    className?: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function AdminProductForm({ product, categories, allAdditionals, className, onSuccess, onCancel }: ProductFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditMode = !!product;
    const [addonSearchTerm, setAddonSearchTerm] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(product?.imageUrl ?? null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { register, handleSubmit, formState: { errors }, control, reset, watch, setValue } = useForm<ProductFormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            id: product?.id,
            name: product?.name ?? '',
            description: product?.description ?? '',
            imageUrl: product?.imageUrl ?? '',
            categoryId: product?.categoryId ?? undefined,
            items: [
                product?.items?.length ?
                {
                    id: product.items[0].id,
                    price: product.items[0].price ?? product.price ?? 0,
                    amount: product.items[0].amount === 1 ? 1 : 0,
                }
                : { price: product?.price ?? 0, amount: 0 }
            ],
            additionalIds: product?.additionals?.map(add => add.id) ?? [],
        },
    });

    useEffect(() => {
        if (product?.imageUrl) {
            setImagePreview(product.imageUrl);
        } else {
            setImagePreview(null);
        }
        setImageFile(null);
    }, [product]);


    const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            setValue('imageUrl', '');
        } else {
            setImageFile(null);
            setImagePreview(product?.imageUrl ?? null);
            setValue('imageUrl', product?.imageUrl ?? '');
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setValue('imageUrl', '');
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const showAdditionalsSection = watch('items.0.amount') === 1;

    const filteredAdditionals = useMemo(() => {
        if (!addonSearchTerm) return allAdditionals;
        const lowerCaseSearch = addonSearchTerm.toLowerCase();
        return allAdditionals.filter(additional =>
            additional.name.toLowerCase().includes(lowerCaseSearch)
        );
    }, [allAdditionals, addonSearchTerm]);

    const onSubmit: SubmitHandler<ProductFormData> = async (data) => {
        setIsSubmitting(true);
        const formData = new FormData();
        const finalData = {
            ...data,
            price: data.items[0].price,
            additionalIds: data.items[0].amount === 1 ? data.additionalIds : [],
        };

        Object.entries(finalData).forEach(([key, value]) => {
            if (key !== 'items' && key !== 'additionalIds' && value !== undefined && value !== null) {
                 if (key === 'imageUrl' && imageFile) {
                    return;
                 }
                formData.append(key, String(value));
            }
        });
        formData.append('items', JSON.stringify(finalData.items));
        formData.append('additionalIds', JSON.stringify(finalData.additionalIds || []));

        if (imageFile) {
            formData.append('imageFile', imageFile);
        }

        try {
            let result;
            if (isEditMode && finalData.id) {
                if (!formData.has('id')) formData.append('id', String(finalData.id));
                result = await updateProductAction(formData);
            } else {
                result = await addProductAction(formData);
            }
            if (result.success) {
                toast.success(`Товар ${isEditMode ? 'обновлен' : 'добавлен'} успешно!`);
                const productFromResult = result.product;
                
                reset({
                    id: productFromResult?.id ?? finalData.id,
                    name: productFromResult?.name ?? finalData.name,
                    description: productFromResult?.description ?? finalData.description,
                    imageUrl: productFromResult?.imageUrl ?? finalData.imageUrl,
                    categoryId: productFromResult?.categoryId ?? finalData.categoryId,
                    items: [{
                        id: productFromResult?.items?.[0]?.id ?? finalData.items[0].id,
                        price: productFromResult?.items?.[0]?.price ?? finalData.items[0].price,
                        amount: productFromResult?.items?.[0]?.amount ?? finalData.items[0].amount,
                    }],
                    additionalIds: productFromResult?.additionals?.map(a => a.id) ?? finalData.additionalIds,
                });
                setImageFile(null);
                setImagePreview(productFromResult?.imageUrl ?? null);

                onSuccess?.();
            } else {
                if (result.errors) {
                    Object.entries(result.errors).forEach(([field, messages]) => {
                        if (messages) {
                            if (field === 'price' && messages) {
                                toast.error(`Цена: ${(messages as string[]).join(', ')}`);
                            } else if (field === 'imageFile' && messages) {
                                toast.error(`Файл изображения: ${(messages as string[]).join(', ')}`);
                            } else if (field === 'items' && typeof messages === 'object' && !Array.isArray(messages)) {
                                 Object.entries(messages as Record<string, any[]>).forEach(([index, itemMessagesObj]) => {
                                    if (itemMessagesObj && typeof itemMessagesObj === 'object') {
                                        const itemMessages = itemMessagesObj as unknown as Record<string, string[]>;
                                        if(itemMessages.price) toast.error(`Цена (вариация): ${itemMessages.price.join(', ')}`);
                                        if(itemMessages.amount) toast.error(`Настройка доп. товаров: ${itemMessages.amount.join(', ')}`);
                                    }
                                 });
                            } else {
                               toast.error(`${field}: ${(messages as string[]).join(', ')}`);
                            }
                        }
                    });
                } else {
                    toast.error(result.message || `Ошибка ${isEditMode ? 'обновления' : 'добавления'} продукта.`);
                }
            }
        } catch (error) {
            console.error("Ошибка отправки формы:", error);
            toast.error("Произошла неизвестная ошибка");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className={`space-y-6 ${className}`}>
            <div>
                <Label htmlFor="name">Название продукта</Label>
                <Input id="name" {...register('name')} aria-invalid={errors.name ? "true" : "false"} />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
                <Label htmlFor="items.0.price">Цена</Label>
                <Input
                    id="items.0.price"
                    type="number"
                    step="any"
                    {...register(`items.0.price`)}
                    aria-invalid={errors.items?.[0]?.price ? "true" : "false"}
                />
                {errors.items?.[0]?.price && <p className="text-red-500 text-sm mt-1">{errors.items[0].price.message}</p>}
                {/* @ts-ignore */}
                {errors.price && <p className="text-red-500 text-sm mt-1">{(errors.price as any).message}</p>}
            </div>

            <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                    <div>
                        <Label htmlFor="categoryId">Категория</Label>
                        <Select
                            onValueChange={(value) => field.onChange(parseInt(value, 10))}
                            defaultValue={field.value?.toString()}
                            value={field.value?.toString()}
                        >
                            <SelectTrigger id="categoryId" aria-invalid={errors.categoryId ? "true" : "false"}>
                                <SelectValue placeholder="Выберите категорию" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id.toString()}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.categoryId && <p className="text-red-500 text-sm mt-1">{errors.categoryId.message}</p>}
                    </div>
                )}
            />
            
            <div>
                <Label htmlFor="imageFile">Изображение продукта</Label>
                <div className="mt-2 flex justify-center">
                    {imagePreview ? (
                        <div className="relative group w-48 h-48 border border-gray-300 rounded-md overflow-hidden bg-gray-50">
                            <Image 
                                src={imagePreview} 
                                alt="Превью продукта" 
                                layout="fill" 
                                objectFit="contain"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 flex items-center justify-center space-x-3 transition-all duration-300">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-gray-700 bg-white hover:bg-gray-50 border-gray-300 p-2 rounded-full opacity-0 group-hover:opacity-100 transform group-hover:scale-110 transition-all duration-200"
                                    aria-label="Изменить изображение"
                                >
                                    <Pencil className="h-5 w-5" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive" 
                                    size="icon"
                                    onClick={handleRemoveImage}
                                    className="p-2 rounded-full opacity-0 group-hover:opacity-100 transform group-hover:scale-110 transition-all duration-200"
                                    aria-label="Удалить изображение"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
                            role="button"
                            tabIndex={0}
                            className="flex flex-col justify-center items-center w-48 h-48 p-4 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors duration-200"
                            aria-label="Загрузить изображение продукта"
                        >
                            <UploadCloud className="mx-auto h-10 w-10 text-gray-400 group-hover:text-blue-500 transition-colors" />
                            <p className="mt-2 text-sm text-center text-gray-600">
                                <span className="font-semibold text-blue-600 hover:text-blue-700">Нажмите, чтобы загрузить</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP</p>
                        </div>
                    )}
                </div>
                <Input
                    ref={fileInputRef}
                    id="imageFile" 
                    type="file" 
                    accept="image/png, image/jpeg, image/webp" 
                    onChange={handleImageChange}
                    className="hidden"
                />
                <input type="hidden" {...register('imageUrl')} /> 
                {errors.imageUrl && <p className="text-red-500 text-sm mt-1">{errors.imageUrl.message}</p>}
            </div>


            <div>
                <Label htmlFor="description">Описание</Label>
                <Textarea id="description" {...register('description')} />
            </div>

            <div className="space-y-2 border p-4 rounded">
                <Label className="text-lg font-medium">Дополнительные товары</Label>
                {watch('items.0.id') !== undefined && <input type="hidden" {...register(`items.0.id`)} />}

                <div className="flex items-center space-x-2 pt-1">
                    <Controller
                        name="items.0.amount"
                        control={control}
                        render={({ field }) => (
                            <Switch
                                id="show-additionals-toggle"
                                checked={field.value === 1}
                                onCheckedChange={(checked) => {
                                    const newValue = checked ? 1 : 0;
                                    field.onChange(newValue);
                                    if (!checked) {
                                        setValue('additionalIds', []);
                                    }
                                }}
                            />
                        )}
                    />
                    <Label htmlFor="show-additionals-toggle" className="cursor-pointer">
                        Добавить доп. товары на карточку?
                    </Label>
                </div>
                {errors.items?.[0]?.amount && <p className="text-red-500 text-sm mt-1">{errors.items[0].amount.message}</p>}
                {(errors.items?.root || errors.items?.message) && (
                    <p className="text-red-500 text-sm mt-1">
                        {errors.items?.root?.message || errors.items?.message}
                    </p>
                )}
            </div>

            {showAdditionalsSection && (
                <div className="space-y-4 border p-4 rounded">
                   <Label className="text-lg font-medium block mb-2">Доп. товары на карточке</Label>
                    <div className="mb-4">
                        <Label htmlFor="addon-search" className="sr-only">Поиск доп. товаров</Label>
                        <Input
                            id="addon-search"
                            type="text"
                            placeholder="Поиск доп. товаров по названию..."
                            value={addonSearchTerm}
                            onChange={(e) => setAddonSearchTerm(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <Controller
                        control={control}
                        name="additionalIds"
                        render={({ field }) => (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 max-h-60 overflow-y-auto pr-2">
                                {filteredAdditionals.length > 0 ? (
                                    filteredAdditionals.map((additional) => (
                                        <div key={additional.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`additional-${additional.id}`}
                                                checked={field.value?.includes(additional.id)}
                                                onCheckedChange={(checked) => {
                                                    const currentValues = field.value || [];
                                                    if (checked) {
                                                        field.onChange([...currentValues, additional.id]);
                                                    } else {
                                                        field.onChange(currentValues.filter(id => id !== additional.id));
                                                    }
                                                }}
                                            />
                                            <Label htmlFor={`additional-${additional.id}`} className="cursor-pointer text-sm">
                                                {additional.name} (+{additional.price} Br)
                                            </Label>
                                        </div>
                                    ))
                               ) : (
                                    <p className="text-gray-500 col-span-full">Доп. товары не найдены.</p>
                               )}
                            </div>
                        )}
                    />
                     {errors.additionalIds && <p className="text-red-500 text-sm mt-1">{errors.additionalIds.message}</p>}
                </div>
            )}

            <div className="flex justify-end space-x-2">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
                    Отмена
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Сохранение...' : (isEditMode ? 'Сохранить' : 'Добавить')}
                </Button>
            </div>
        </form>
    );
}