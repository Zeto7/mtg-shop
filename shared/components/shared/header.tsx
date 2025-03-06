import React from 'react'
import { cn } from '@/shared/lib/utils'
import Image from 'next/image'
import { Container } from './container'
import { ArrowRight, ShoppingCart, User } from 'lucide-react'
import { Button } from '../ui/button'
import Link from 'next/link'
import { SearchInput } from './search-input'

interface Props {
    classname?: string
}

export const Header: React.FC<Props> = ({ classname }) => {
    return (
        <header className={cn('border border-b', classname)}>
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

                <div className="mx-10 flex-1">
                    <SearchInput/>
                </div>

                <div className='flex items-center gap-3 '>
                    <Button variant={"outline"} className='flex items-center gap-1 rounded-xl'> 
                        <User size={16} /> Войти 
                    </Button>

                    <div>
                        <Button className='group relative rounded-xl'>
                            <b>144 Br</b>         
                            <span className="h-full w-[1px] bg-white/30 mx-1" />
                            <div className='flex items-center gap-1 transition durating-300 group-hover:opacity-0'>
                                <ShoppingCart className='h-4 w-4 realitive' strokeWidth={2}/>
                                <b>2</b>
                            </div>
                            <ArrowRight className="w-5 absolute right-5 transition duration-300 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0" />  
                        </Button>
                    </div>
                </div>
            </Container>
        </header>
    );
};