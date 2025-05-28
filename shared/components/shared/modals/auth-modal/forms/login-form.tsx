import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { formLoginSchema, TFormLoginValues } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Title } from "../../../title";
import { FormInput } from "../../../form-components/form-input";
import { Button } from "@/shared/components/ui/button";
import toast from "react-hot-toast";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

interface Props {
    onClose?: () => void;
}

export const LoginForm: React.FC<Props> = ({ onClose }) => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const form = useForm<TFormLoginValues>({
        resolver: zodResolver(formLoginSchema),
        defaultValues: {
            email: '',
            password: '',
        }
    });

    const onSubmit = async (data: TFormLoginValues) => {
        try {
            const resp = await signIn('credentials', {
                ...data,
                redirect: false,
            });

            if (resp?.ok) {
                toast.success('Вы вошли в аккаунт!', {
                    icon: '✅',
                });
                onClose?.();

                const callbackUrl = searchParams.get('callbackUrl');
                let redirectPath = '/auth-redirector';

                if (callbackUrl) {
                    redirectPath += `?callbackUrl=${encodeURIComponent(callbackUrl)}`;
                }
                router.push(redirectPath);

            } else {
                throw new Error(resp?.error || "Неверные учетные данные");
            }

        } catch (error: any) {
            console.error('Error [LOGIN]', error);
            toast.error(error.message || 'Не удалось войти', {
                icon: '❌',
            });
        }
    }

    return (
        <FormProvider {...form}>
            <form noValidate className="flex flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)}>
                <div className="flex justify-between items-center">
                    <div className="mr-2">
                        <Title text="Вход в аккаунт" size="md" className="font-bold" />
                        <p className="text-gray-400">Введите свою почту, чтобы войти в свой аккаунт</p>
                    </div>
                </div>

                <FormInput name="email" label="E-Mail" required />
                <FormInput type="password" name="password" label="Пароль" required />

                <Button className="h-12 text-base" type="submit" disabled={form.formState.isSubmitting}>
                    { form.formState.isSubmitting ? 'Вход...' : 'Войти' }
                </Button>
            </form>
        </FormProvider>
    );
}