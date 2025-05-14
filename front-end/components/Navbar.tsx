'use client';

import { ConnectWalletButton } from './ConnectWallet';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import { ModeToggle } from './modeToggle';
import Link from 'next/link';

export const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 w-full bg-background/15 backdrop-blur supports-[backdrop-filter]:bg-background/10 z-100">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link href="/" className="no-underline">
              <Button variant="outline" className="text-white bg-black py-1 cursor-pointer">
                4v4
              </Button>
            </Link>
            <Link href="/mint" className='font-bold px-4 hover:underline'>Mint</Link>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            <ModeToggle />
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
