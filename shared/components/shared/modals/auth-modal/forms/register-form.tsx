'use client';

import React from 'react';
import { FormProvider, useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { formRegisterSchema, TFormRegisterValues } from './schema';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { registerUserAction } from '@/app/actions/auth-actions';
import { Title } from '../../../title';

interface RegisterFormNewProps {
  onClose?: () => void;
  switchToLogin?: () => void;
}

export const RegisterForm: React.FC<RegisterFormNewProps> = ({ onClose, switchToLogin }) => {
  const form = useForm<TFormRegisterValues>({
    resolver: zodResolver(formRegisterSchema),
    defaultValues: { /* ... */ },
    mode: 'onBlur',
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = form;

  const onSubmit: SubmitHandler<TFormRegisterValues> = async (data) => {
    try {
      const result = await registerUserAction({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
      });

      if (result.success) {
        toast.success('Аккаунт успешно создан! 🎉', { icon: '✅' });
        onClose?.();
      } else {
        toast.error(result.message || 'Ошибка при регистрации.', { icon: '❌' });
      }
    } catch (error) {
      console.error("Register form submission error:", error);
      toast.error('Не удалось связаться с сервером. Попробуйте позже.', { icon: '❌' });
    }
  };

  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div className="text-center mb-2">
             <Title text="Регистрация" size="md" className="font-bold" />
             <p className="text-sm text-gray-500">Создайте аккаунт</p>
         </div>

        <div className="space-y-1">
          <Label htmlFor="fullName-register">Полное имя <span className="text-red-500">*</span></Label>
          <Input id="fullName-register" {...register('fullName')} />
          {errors.fullName && <p className="text-sm text-red-600">{errors.fullName.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="email-register">E-Mail <span className="text-red-500">*</span></Label>
          <Input id="email-register" type="email" {...register('email')} />
          {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="password-register">Пароль <span className="text-red-500">*</span></Label>
          <Input id="password-register" type="password" {...register('password')} />
          {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="confirmPassword-register">Подтвердите пароль <span className="text-red-500">*</span></Label>
          <Input id="confirmPassword-register" type="password" {...register('confirmPassword')} />
          {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>}
        </div>

        <Button type="submit" className="w-full h-11 mt-2" disabled={isSubmitting}>
          {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
        </Button>
        {switchToLogin && ( <Button type="button" variant="link" onClick={switchToLogin}> Уже есть аккаунт? Войти </Button> )}
      </form>
    </FormProvider>
  );
};