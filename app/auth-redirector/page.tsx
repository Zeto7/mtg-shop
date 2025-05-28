import { getUserSession } from '@/shared/lib/get-user-session';
import { UserRole } from '@prisma/client';
import { redirect } from 'next/navigation';
import { NextPage } from 'next';

interface AuthRedirectorPageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

const AuthRedirectorPage: NextPage<AuthRedirectorPageProps> = async ({ searchParams }) => {
  const session = await getUserSession();
  const callbackUrl = typeof searchParams?.callbackUrl === 'string' ? searchParams.callbackUrl : null;

  if (session?.role === UserRole.ADMIN) {
    redirect('/dashboard');
  } else if (session) {
    if (callbackUrl) {
      redirect(callbackUrl);
    } else {
      redirect('/');
    }
  } else {
    redirect('/auth/signin');
  }

  return null;
};

export default AuthRedirectorPage;