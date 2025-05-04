import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { getUserSession } from "@/shared/lib/get-user-session";
import { ProfileForm } from '@/shared/components/shared/profile-form';
import { Container } from '@/shared/components/shared/container';
import { Title } from '@/shared/components/shared/title';

export const metadata: Metadata = {
  title: 'Мой профиль | MTG Shop',
  description: 'Управление данными профиля и история заказов',
};

export default async function ProfilePage() {
    const user = await getUserSession();
    if (!user) {
        redirect('/');
    }

    return (
        <Container className='mt-10 mb-10'>
             <Title text="Личный кабинет" size="lg" className="font-bold mb-8" />
            <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
                <div className="w-full lg:w-1/3 flex-shrink-0">
                    <ProfileForm />
                </div>
            </div>
        </Container>
    );
}