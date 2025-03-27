'use client';

import React from 'react'
import { cn } from '@/shared/lib/utils'
import Image from 'next/image'
import { Container } from './container'
import Link from 'next/link'
import { SearchInput } from './search-input'
import { CartButton } from './cart-button'
import { useSession, signIn } from 'next-auth/react'
import { ProfileButton } from './profile-button';
import { AuthModal } from './modals/auth-modal/auth-modal';

interface Props {
    hasSearch?: boolean
    hasCart?: boolean
    classname?: string
}

export const Header: React.FC<Props> = ({ classname, hasSearch = true, hasCart = true }) => {
    const [openAuthModal, setOpenAuthModal] = React.useState(false);
    return (
        <header className={cn('border-b', classname)}>
            <Container className='flex items-center justify-between py-8'>
                <Link href='/'>
                    <div className='flex items-center gap-4'>
                        <Image src="/logo.png" alt="logo" width={35} height={35}/>
                        <div>
                            <h1 className='text-2xl uppercase font-black'>MTG shop</h1>
                            <p className='text-sm text-gray-600 leading-3'>Best play - best price</p>
                        </div>
                    </div>
                </Link>

                { hasSearch && <div className="mx-10 flex-1 rounded-3xl">
                    <SearchInput/>
                </div> }

                <div className='flex items-center gap-3 rounded-3xl'>
                    <AuthModal open={openAuthModal} onClose={() => setOpenAuthModal}/>

                    <ProfileButton onClickSignIn={() => setOpenAuthModal(true)}/>

                    { hasCart && <CartButton/>}
                </div>
            </Container>
        </header>
    );
};