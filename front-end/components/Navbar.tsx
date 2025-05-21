'use client';

import { ConnectWalletButton } from './ConnectWallet';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 w-full bg-background/15 backdrop-blur supports-[backdrop-filter]:bg-background/10 z-100">
      <div className="mx-auto px-2 md:px-8">
        <div className="flex justify-between h-24 items-center">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link href="/" className="no-underline">
              <Button className="title text-white bg-black py-1 mr-2 cursor-pointer">
                <Image src="/4V4.svg" height={18} width={18} alt="4v4-logo"></Image>
                4V4
              </Button>
            </Link>
            <div className='md:flex hidden'>
              <div className="relative text-sm">
                <Search className="absolute left-4 top-4 text-gray-500 h-[19px]" />
                <Input
                  type="text"
                  placeholder="Search for models, collections, or creators..."
                  className="w-[360px] bg-gray-900/10 border-gray-700 pl-12 py-6 text-lg rounded-full"
                />
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4 px-2 z-100">
            <Link href="/mint" className='font-bold px-4 hover:underline'>Mint</Link>
            <Link href="/profile" className="no-underline">
              <div>
                <User className="text-white" />
              </div>
            </Link>
            <ConnectWalletButton />
          </div>
        </div>
      </div>
    </nav>
  );
};
