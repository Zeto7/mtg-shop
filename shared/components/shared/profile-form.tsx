// ФАЙЛ: components/shared/ProfileForm.tsx (или ваш путь)
'use client';

import React, { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm, SubmitHandler } from 'react-hook-form';
// Используем схему регистрации, так как она содержит все нужные поля для формы (включая пароли)
import { formRegisterSchema, TFormRegisterValues } from './modals/auth-modal/forms/schema'; // Убедитесь, что путь верный
import toast from 'react-hot-toast';
import { signOut, useSession } from 'next-auth/react'; // <-- Импортируем useSession
import { Container } from './container'; // Убедитесь, что путь верный
import { Title } from './title'; // Убедитесь, что путь верный
import { FormInput } from './form-components/form-input'; // Убедитесь, что путь верный
import { Button } from '../ui/button'; // Убедитесь, что путь верный
// Импортируем actions и тип SafeUser из вашего user-actions
import { updateMyProfile, getCurrentUserProfile, SafeUser } from '@/app/actions/user-actions'; // <-- УБЕДИТЕСЬ, ЧТО ПУТЬ ВЕРНЫЙ
// Импортируем компонент истории заказов
import OrderHistoryList from './order-history-list';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

// Интерфейс Props больше не нужен, так как data не передается
// interface Props {
//   data: User;
// }

export const ProfileForm: React.FC = () => {
    // Состояние для данных профиля, загрузки и ошибок
    const [profileData, setProfileData] = useState<SafeUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // Получаем статус сессии для начальной проверки
    const { status: sessionStatus } = useSession();

    // Инициализация формы react-hook-form
    const form = useForm<TFormRegisterValues>({
        resolver: zodResolver(formRegisterSchema), // Используем схему с confirmPassword для валидации
        defaultValues: {
            fullName: '',
            email: '',
            password: '',       // Изначально пустые
            confirmPassword: '',// Изначально пустые
        },
        mode: 'onBlur', // Валидировать при потере фокуса
    });
    const { reset, handleSubmit, formState, register } = form; // Получаем register

    // Эффект для загрузки данных профиля при монтировании или изменении статуса сессии
    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const result = await getCurrentUserProfile();
                if (result.success && result.user) {
                    setProfileData(result.user);
                    // Устанавливаем значения формы ПОСЛЕ загрузки данных
                    reset({
                        fullName: result.user.fullName ?? '',
                        email: result.user.email ?? '',
                        password: '', // Пароли всегда пустые при загрузке
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

        // Загружаем только если пользователь аутентифицирован
        if (sessionStatus === 'authenticated') {
            fetchProfile();
        } else if (sessionStatus === 'unauthenticated') {
            setError("Вы не авторизованы для просмотра этой страницы.");
            setIsLoading(false);
            // Здесь можно добавить редирект, если нужно
            // import { useRouter } from 'next/navigation';
            // const router = useRouter(); router.push('/');
        }
        // Зависим от статуса сессии
    }, [sessionStatus, reset]);

    // Обработчик сохранения изменений профиля
    const onSubmit: SubmitHandler<TFormRegisterValues> = async (formData) => {
         const dataToUpdate = {
             fullName: formData.fullName,
             // Пароль добавляем только если он введен (проверка на пустую строку не обязательна, т.к. Zod это сделает)
             ...(formData.password && { password: formData.password }),
         };

        try {
            // Вызываем Action для обновления "моего" профиля
            const result = await updateMyProfile(dataToUpdate);

            if (result.success) {
                toast.success('Данные успешно обновлены! 📝', { icon: '✅' });
                // Обновляем локальное состояние И сбрасываем поля пароля
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

    // Обработчик выхода
    const onClickSignOut = () => {
        signOut({ callbackUrl: '/' });
    };

    // --- Отображение Состояний ---
    // Пока статус сессии определяется
    if (sessionStatus === 'loading' || isLoading) {
        return (
            <Container className='my-10 text-center'>
                <p>Загрузка данных профиля...</p>
                {/* Можно добавить спиннер */}
            </Container>
        );
    }

    // Если ошибка загрузки или пользователь не аутентифицирован
    if (error || !profileData) {
        return (
            <Container className='my-10'>
                 <div className="p-4 text-center border border-red-300 bg-red-50 rounded-md">
                     <p className="font-medium text-red-700">{error || 'Не удалось загрузить профиль или вы не авторизованы.'}</p>
                     {/* Можно добавить кнопку "Войти", если пользователь не аутентифицирован */}
                      {sessionStatus === 'unauthenticated' && (
                          <Button onClick={() => {/* Открыть модалку логина */}} className="mt-4">Войти</Button>
                      )}
                 </div>
            </Container>
        );
    }

    return (
        <Container className='my-10 space-y-10'>
             <div>
                 <Title text={`Личные данные | #${profileData.id}`} size="md" className="font-bold" />
                 <FormProvider {...form}>
                     <form noValidate className="flex flex-col gap-5 w-full max-w-md mt-6" onSubmit={handleSubmit(onSubmit)}>
                          <div className="space-y-1">
                             <Label htmlFor="profile-email">E-Mail</Label>
                             <Input id="profile-email" readOnly disabled value={profileData.email || ''} />
                          </div>

                          <FormInput name="fullName" label="Полное имя" required />
                          <FormInput name="password" type="password" label="Новый пароль (оставьте пустым, чтобы не менять)" />
                          <FormInput name="confirmPassword" type="password" label="Повторите новый пароль" />

                         {/* Кнопки */}
                         <div className="flex flex-col sm:flex-row gap-3 mt-6">
                            <Button className="flex-1 h-11" type="submit" disabled={formState.isSubmitting || !formState.isDirty}>
                                {formState.isSubmitting ? 'Сохранение...' : 'Сохранить'}
                            </Button>
                            <Button className="flex-1 h-11" onClick={onClickSignOut} variant="secondary" disabled={formState.isSubmitting} type="button">
                                Выйти
                            </Button>
                         </div>
                     </form>
                 </FormProvider>
             </div>

             <div className="border-t pt-10">
                 <Title text="История заказов" size="md" className="font-bold mb-4" />
                 <OrderHistoryList />
             </div>
        </Container>
    );
};