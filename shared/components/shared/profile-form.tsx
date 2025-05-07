'use client';

import React, { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm, SubmitHandler } from 'react-hook-form';
import { formRegisterSchema, TFormRegisterValues } from './modals/auth-modal/forms/schema';
import toast from 'react-hot-toast';
import { signOut, useSession } from 'next-auth/react';
import { Container } from './container';
import { Title } from './title';
import { FormInput } from './form-components/form-input';
import { Button } from '../ui/button';
import { updateMyProfile, getCurrentUserProfile, SafeUser } from '@/app/actions/user-actions';
import OrderHistoryList from './order-history-list';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

export const ProfileForm: React.FC = () => {
    const [profileData, setProfileData] = useState<SafeUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { status: sessionStatus } = useSession();

    const form = useForm<TFormRegisterValues>({
        resolver: zodResolver(formRegisterSchema),
        defaultValues: {
            fullName: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
        mode: 'onBlur',
    });
    const { reset, handleSubmit, formState } = form;

    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const result = await getCurrentUserProfile();
                if (result.success && result.user) {
                    setProfileData(result.user);
                    reset({
                        fullName: result.user.fullName ?? '',
                        email: result.user.email ?? '',
                        password: '',
                        confirmPassword: '',
                    });
                } else {
                    setError(result.message || 'Не удалось загрузить профиль.');
                    toast.error(result.message || 'Не удалось загрузить профиль.');
                }
            } catch (err) {
                console.error("Failed to fetch profile:", err);
                const message = 'Ошибка при загрузке данных профиля.';
                setError(message);
                toast.error(message);
            } finally {
                setIsLoading(false);
            }
        };

        if (sessionStatus === 'authenticated') {
            fetchProfile();
        } else if (sessionStatus === 'unauthenticated') {
            setError("Вы не авторизованы для просмотра этой страницы.");
            setIsLoading(false);
        }
    }, [sessionStatus, reset]);

    const onSubmit: SubmitHandler<TFormRegisterValues> = async (formData) => {
        const dataToUpdate: { fullName: string; password?: string } = {
            fullName: formData.fullName,
        };
        if (formData.password && formData.password.length > 0) {
            dataToUpdate.password = formData.password;
        }

        try {
            const result = await updateMyProfile(dataToUpdate);

            if (result.success) {
                toast.success('Данные успешно обновлены! 📝', { icon: '✅' });
                setProfileData(prev => prev ? { ...prev, fullName: formData.fullName } : null);
                reset({ ...formData, password: '', confirmPassword: '' });
            } else {
                toast.error(result.message || 'Ошибка при обновлении данных', { icon: '❌' });
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error('Ошибка при сохранении данных.', { icon: '❌' });
        }
    };

    const onClickSignOut = () => {
        signOut({ callbackUrl: '/' });
    };

    if (sessionStatus === 'loading' || isLoading) {
        return (
            <Container className='my-10 text-center'>
                <p>Загрузка данных профиля...</p>
            </Container>
        );
    }

    if (error || !profileData) {
        return (
            <Container className='my-10'>
                <div className="p-4 text-center border border-red-300 bg-red-50 rounded-md">
                    <p className="font-medium text-red-700">{error || 'Не удалось загрузить профиль или вы не авторизованы.'}</p>
                    {sessionStatus === 'unauthenticated' && (
                        <Button onClick={() => {
                        }} className="mt-4">Войти</Button>
                    )}
                </div>
            </Container>
        );
    }

    return (
        <Container className='my-10'>
            <div className="flex flex-col lg:flex-row lg:gap-8 xl:gap-12">
                <div className="lg:w-1/3 xl:w-2/5 mb-10 lg:mb-0">
                    <Title text={`Личные данные | #${profileData.id}`} size="md" className="font-bold" />
                    <FormProvider {...form}>
                        <form noValidate className="flex flex-col gap-5 w-full max-w-md mt-6" onSubmit={handleSubmit(onSubmit)}>
                            <div className="space-y-1">
                                <Label htmlFor="profile-email">E-Mail</Label>
                                <Input id="profile-email" readOnly disabled value={profileData.email || ''} className="bg-gray-100 cursor-not-allowed" />
                            </div>

                            <FormInput name="fullName" label="Полное имя" required />
                            <FormInput name="password" type="password" label="Новый пароль (оставьте пустым, чтобы не менять)" />
                            <FormInput name="confirmPassword" type="password" label="Повторите новый пароль" />

                            <div className="flex flex-col sm:flex-row gap-3 mt-6">
                                <Button className="flex-1 h-11" type="submit" disabled={formState.isSubmitting || !formState.isDirty || !formState.isValid}>
                                    {formState.isSubmitting ? 'Сохранение...' : 'Сохранить'}
                                </Button>
                                <Button className="flex-1 h-11" onClick={onClickSignOut} variant="secondary" disabled={formState.isSubmitting} type="button">
                                    Выйти
                                </Button>
                            </div>
                        </form>
                    </FormProvider>
                </div>

                <div className="lg:w-2/3 xl:w-3/5">
                    <Title text="История заказов" size="md" className="font-bold mb-6" />
                    <OrderHistoryList />
                </div>

            </div>
        </Container>
    );
};