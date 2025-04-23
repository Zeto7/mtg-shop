'use client';

// Добавляем useState и useMemo
import { useForm, SubmitHandler, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ProductWithRelations, CategoryData, AdditionalData } from '@/@types/prisma';
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input"; // Input уже импортирован
import { Label } from '../ui/label';
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { toast } from 'react-hot-toast';
// Добавляем useState и useMemo
import { useState, useMemo } from 'react'; // <--- ДОБАВЛЕНО
import { addProductAction, updateProductAction } from '@/app/actions/product-actions';
import { Trash2 } from 'lucide-react';

// Схема Zod (как в вашем коде)
const formSchema = z.object({
    id: z.number().optional(),
    name: z.string().min(3),
    description: z.string().optional(),
    imageUrl: z.string().url().or(z.literal('')),
    price: z.coerce.number().int().min(0),
    categoryId: z.coerce.number().int().positive(),
    items: z.array(z.object({
        id: z.number().optional(),
        amount: z.coerce.number().int().min(0).optional().nullable(),
        price: z.coerce.number().int().min(0),
    })).min(1),
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

    // Состояние для поискового запроса дополнений
    const [addonSearchTerm, setAddonSearchTerm] = useState(''); // <--- ДОБАВЛЕНО

    // useForm (как в вашем коде)
    const { register, handleSubmit, formState: { errors }, control, reset, watch } = useForm<ProductFormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            id: product?.id,
            name: product?.name ?? '',
            description: product?.description ?? '',
            imageUrl: product?.imageUrl ?? '',
            price: product?.price ?? 0,
            categoryId: product?.categoryId ?? undefined,
            items: product?.items?.length ? product.items.map(item => ({
                id: item.id,
                price: item.price,
                amount: item.amount,
            })) : [{ price: 0, amount: null }],
            additionalIds: product?.additionals?.map(add => add.id) ?? [],
        },
    });

    // useFieldArray (как в вашем коде)
    const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
        control,
        name: "items",
        keyName: "fieldId"
    });

    // watch (как в вашем коде)
    const selectedAdditionalIds = watch('additionalIds') || [];

    // Фильтруем additional с использованием useMemo
    const filteredAdditionals = useMemo(() => {
        if (!addonSearchTerm) {
            return allAdditionals; // Показываем все, если поиск пуст
        }
        const lowerCaseSearch = addonSearchTerm.toLowerCase();
        return allAdditionals.filter(additional =>
            additional.name.toLowerCase().includes(lowerCaseSearch)
        );
    }, [allAdditionals, addonSearchTerm]);


    const onSubmit: SubmitHandler<ProductFormData> = async (data) => {
         // ... (логика отправки формы onSubmit - без изменений)
         setIsSubmitting(true);
         const formData = new FormData();
         Object.entries(data).forEach(([key, value]) => {
             if (key !== 'items' && key !== 'additionalIds' && value !== undefined && value !== null) {
                 formData.append(key, String(value));
             }
         });
         formData.append('items', JSON.stringify(data.items));
         formData.append('additionalIds', JSON.stringify(data.additionalIds || []));
         try {
             let result;
             if (isEditMode && data.id) {
                  if (!formData.has('id')) formData.append('id', String(data.id));
                 result = await updateProductAction(formData);
             } else {
                 result = await addProductAction(formData);
             }
            // ... (обработка результата success/error)
             if (result.success) {
                 toast.success(`Товар ${isEditMode ? 'обновлен' : 'добавлен'} успешно!`);
                 reset();
                 onSuccess?.();
             } else {
                  if (result.errors) {
                      Object.entries(result.errors).forEach(([field, messages]) => {
                           if (messages) {
                              toast.error(`${field}: ${messages.join(', ')}`);
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
            {/* Основные поля продукта (как в вашем коде) */}
             <div>
                 <Label htmlFor="name">Название продукта</Label>
                 <Input id="name" {...register('name')} aria-invalid={errors.name ? "true" : "false"} />
                 {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
             </div>
             <Controller
                 control={control}
                 name="categoryId"
                 render={({ field }) => (
                     <div>
                         <Label htmlFor="categoryId">Категория: </Label>
                         <Select
                             onValueChange={(value) => field.onChange(parseInt(value, 10))}
                             defaultValue={field.value?.toString()}
                             value={field.value?.toString()}
                         >
                             <SelectTrigger id="categoryId" aria-invalid={errors.categoryId ? "true" : "false"}>
                                 <SelectValue placeholder="Select category" />
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
                 <Label htmlFor="price">Цена на главном экране:</Label>
                 <Input id="price" type="number" {...register('price')} aria-invalid={errors.price ? "true" : "false"} />
                 {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>}
             </div>
             <div>
                 <Label htmlFor="imageUrl">URL изображения:</Label>
                 <Input id="imageUrl" {...register('imageUrl')} aria-invalid={errors.imageUrl ? "true" : "false"} />
                 {errors.imageUrl && <p className="text-red-500 text-sm mt-1">{errors.imageUrl.message}</p>}
             </div>
             <div>
                 <Label htmlFor="description">Описание:</Label>
                 <Textarea id="description" {...register('description')} />
             </div>


            {/* Динамические поля для ProductItem (как в вашем коде) */}
            <div className="space-y-4 border p-4 rounded">
                <Label className="text-lg font-medium">Вариации продукта</Label>
                {itemFields.map((field, index) => (
                    <div key={field.fieldId} className="flex items-end space-x-2 border-b pb-2">
                         {field.id && <input type="hidden" {...register(`items.${index}.id`)} />}
                        <div className="flex-1">
                            <Label htmlFor={`items.${index}.price`}>Цена на карточке </Label>
                            <Input
                                id={`items.${index}.price`}
                                type="number"
                                {...register(`items.${index}.price`)}
                                aria-invalid={errors.items?.[index]?.price ? "true" : "false"}
                            />
                             {errors.items?.[index]?.price && <p className="text-red-500 text-sm mt-1">{errors.items?.[index]?.price?.message}</p>}
                        </div>
                        <div className="flex-1">
                            <Label htmlFor={`items.${index}.amount`}>Amount/Stock (Optional)</Label>
                            <Input
                                id={`items.${index}.amount`}
                                type="number"
                                {...register(`items.${index}.amount`)}
                                aria-invalid={errors.items?.[index]?.amount ? "true" : "false"}
                            />
                            {errors.items?.[index]?.amount && <p className="text-red-500 text-sm mt-1">{errors.items?.[index]?.amount?.message}</p>}
                        </div>
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                             onClick={() => itemFields.length > 1 ? removeItem(index) : toast.error("Product must have at least one item.")}
                            disabled={itemFields.length <= 1}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                {errors.items?.root && <p className="text-red-500 text-sm mt-1">{errors.items.root.message}</p>}
                {errors.items?.message && <p className="text-red-500 text-sm mt-1">{errors.items.message}</p>}
                <Button type="button" variant="outline" size="sm" onClick={() => appendItem({ price: 0, amount: null })}>
                    Добавить вариацию
                </Button>
            </div>

             {/* Выбор доступных Additionals с поиском */}
             <div className="space-y-4 border p-4 rounded"> {/* <--- ДОБАВЛЕНО: space-y-4 */}
                 <Label className="text-lg font-medium block mb-2">Доп. товары на карточке</Label> {/* <--- ДОБАВЛЕНО: block mb-2 */}

                 {/* Строка поиска */}
                 <div className="mb-4"> {/* <--- ДОБАВЛЕНО */}
                     <Label htmlFor="addon-search" className="sr-only">Поиск доп. товаров</Label> {/* Скрытый лейбл */}
                     <Input
                         id="addon-search"
                         type="text"
                         placeholder="Поиск доп. товаров по названию..."
                         value={addonSearchTerm}
                         onChange={(e) => setAddonSearchTerm(e.target.value)}
                         className="w-full"
                     />
                 </div>

                 {/* Список дополнений */}
                 <Controller
                     control={control}
                     name="additionalIds"
                     render={({ field }) => (
                         <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2"> {/* <--- ИЗМЕНЕНИЕ: grid */}
                             {/* Используем отфильтрованный список */}
                             {filteredAdditionals.length > 0 ? (
                                 filteredAdditionals.map((additional) => ( // <--- ИЗМЕНЕНИЕ: итерация по filteredAdditionals
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
                                         {/* Отображение цены как в вашем исходном коде */}
                                         <Label htmlFor={`additional-${additional.id}`} className="cursor-pointer text-sm">
                                             {additional.name} (+{additional.price} Br) {/* <--- ОСТАВЛЕНО КАК БЫЛО */}
                                         </Label>
                                     </div>
                                 ))
                            ) : (
                                 // Сообщение если ничего не найдено
                                 <p className="text-gray-500 col-span-full">Доп. товары не найдены.</p> // <--- ДОБАВЛЕНО
                            )}
                         </div>
                     )}
                 />
                  {errors.additionalIds && <p className="text-red-500 text-sm mt-1">{errors.additionalIds.message}</p>}
             </div>


             {/* Кнопки Submit / Cancel (как в вашем коде) */}
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