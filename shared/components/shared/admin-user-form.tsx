'use client';

import React, { useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { UserRole } from '@prisma/client';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { addUserAction, updateUserAction } from '@/app/actions/user-actions';
import { SafeUser } from '@/app/actions/user-actions';

const userFormSchemaBase = z.object({
  fullName: z.string().min(2).trim(),
  email: z.string().email(),
  role: z.nativeEnum(UserRole),
  id: z.number().optional(),
});

const addUserFormClientSchema = userFormSchemaBase.extend({
  password: z.string().min(8),
});

const updateUserFormClientSchema = userFormSchemaBase;
type AddUserFormData = z.infer<typeof addUserFormClientSchema>;
type UpdateUserFormData = z.infer<typeof updateUserFormClientSchema>;
type UserFormData = AddUserFormData | UpdateUserFormData; 

interface UserFormProps {
    user?: SafeUser | null;
    onSuccess?: () => void;
    onCancel?: () => void;
    className?: string;
}

export function UserForm({ user, onSuccess, onCancel, className }: UserFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditMode = !!user;

    const currentSchema = isEditMode ? updateUserFormClientSchema : addUserFormClientSchema;

    const form = useForm<UserFormData>({
        resolver: zodResolver(currentSchema),
        defaultValues: {
            id: user?.id,
            fullName: user?.fullName ?? '',
            email: user?.email ?? '',
            role: user?.role ?? UserRole.USER,
            password: '',
        },
    });
    const { register, handleSubmit, formState: { errors }, control, reset } = form;

    const onSubmit: SubmitHandler<UserFormData> = async (data) => {
        setIsSubmitting(true);
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formData.append(key, String(value));
            }
        });

        try {
            let result;
            if (isEditMode) {
                 if (!user?.id) throw new Error("User ID missing for update");
                 if (!formData.has('id')) formData.append('id', String(user.id));
                result = await updateUserAction(formData);
            } else {
                result = await addUserAction(formData);
            }

            if (result.success) {
                toast.success(`Пользователь ${isEditMode ? 'обновлен' : 'добавлен'} успешно!`);
                reset();
                onSuccess?.();
            } else {
                 if (result.errors) {
                     Object.entries(result.errors).forEach(([field, messages]) => {
                          if (messages) toast.error(`${field}: ${messages.join(', ')}`);
                          // TODO: использовать setError из react-hook-form для подсветки полей
                      });
                 } else {
                    toast.error(result.message || `Не удалось ${isEditMode ? 'обновить' : 'добавить'} пользователя.`);
                 }
            }
        } catch (error) {
            console.error("User form submission error:", error);
            toast.error("Произошла непредвиденная ошибка.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        // <FormProvider {...form}> // Не обязателен здесь
        <form noValidate onSubmit={handleSubmit(onSubmit)} className={`space-y-4 ${className}`}>
            {isEditMode && user?.id && <input type="hidden" {...register('id')} value={user.id} />}

            <div className="space-y-1">
                <Label htmlFor="fullName-user">Полное имя</Label>
                <Input id="fullName-user" {...register('fullName')} aria-invalid={!!errors.fullName} />
                {errors.fullName && <p className="text-sm text-red-600">{errors.fullName.message}</p>}
            </div>

            <div className="space-y-1">
                <Label htmlFor="email-user">Email</Label>
                <Input id="email-user" type="email" {...register('email')} aria-invalid={!!errors.email} />
                {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
            </div>

            {!isEditMode && (
                <div className="space-y-1">
                    <Label htmlFor="password-user">Пароль (мин. 8 симв.)</Label>
                    <Input id="password-user" type="password" {...register('password')} aria-invalid={!!errors.password} />
                    {errors.password && <p className="text-sm text-red-600">{errors.password?.message}</p>}
                </div>
            )}

            {/* Выбор Роли */}
             <Controller
                 control={control}
                 name="role"
                 render={({ field }) => (
                      <div className="space-y-1">
                         <Label htmlFor="role-user">Роль</Label>
                         <Select
                             onValueChange={field.onChange}
                             value={field.value}
                             defaultValue={field.value}
                         >
                             <SelectTrigger id="role-user" aria-invalid={!!errors.role}>
                                 <SelectValue placeholder="Выберите роль" />
                             </SelectTrigger>
                             <SelectContent>
                                 {Object.values(UserRole).map((roleValue) => (
                                     <SelectItem key={roleValue} value={roleValue}>
                                         {roleValue}
                                     </SelectItem>
                                 ))}
                             </SelectContent>
                         </Select>
                         {errors.role && <p className="text-sm text-red-600">{errors.role.message}</p>}
                     </div>
                 )}
             />

            <div className="flex justify-end space-x-3 pt-3">
                 <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
                     Отмена
                 </Button>
                 <Button type="submit" disabled={isSubmitting}>
                     {isSubmitting ? 'Сохранение...' : (isEditMode ? 'Сохранить изменения' : 'Добавить пользователя')}
                 </Button>
            </div>
        </form>
        // </FormProvider>
    );
}