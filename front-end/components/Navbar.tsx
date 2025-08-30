
'use client';

import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { Search } from 'lucide-react';

import { useState, useCallback } from 'react';
import { SearchModal } from './SearchModal';
import GetInModal from './GetInModal';
import { useWallet } from './WalletProvider';
import { useEncryptedWallet } from './EncryptedWalletProvider';
import { useRouter } from 'next/navigation';

export const Navbar = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [getInOpen, setGetInOpen] = useState(false);
  const { address } = useWallet();
  const { isAuthenticated } = useEncryptedWallet();
  const router = useRouter();

  // Helper to check if any wallet is connected
  const isWalletConnected = !!address || isAuthenticated;

  // Intercept navigation for /mint and /settings
  const handleProtectedNav = useCallback((e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (!isWalletConnected) {
      e.preventDefault();
      setGetInOpen(true);
    } else {
      router.push(path);
    }
  }, [isWalletConnected, router]);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 w-full z-100 select-none">
        <div className="mx-auto px-2 md:px-4">
          <div className="flex justify-between h-24 items-center relative">
            {/* Logo Section */}
            <div className="flex items-center">
              <Link href="/" className="no-underline">
                <Button className="bg-background text-foreground border-none shadow-none outline-0 py-3 cursor-pointer text-2xl hover:bg-background">
                  <Image 
                    src="/home.svg" 
                    height={27} 
                    width={27} 
                    alt="4v4-logo"
                    className="dark:invert-0 invert transition-all duration-200"
                  />
                </Button>
              </Link>
            </div>
            {/* Search Button (always visible) */}
            <button
              className="md:hidden p-2 rounded hover:bg-background transition-colors cursor-pointer"
              aria-label="Open search"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="text-foreground h-[12px] w-[12px] cursor-pointer" />
            </button>
            {/* Options Bar (centered) */}
            <div
              id="options-bar"
              className="md:flex hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background/15 backdrop-blur supports-[backdrop-filter]:bg-background/10 px-9 py-1 border border-[#dbdbdb] dark:border-[#444] rounded-full"
            >
              <button
                className="flex items-center mr-4 p-1 rounded hover:bg-background transition-colors cursor-pointer"
                aria-label="Open search"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="my-1 text-foreground h-[18px] w-[18px] cursor-pointer" />
              </button>
              <div className='flex gap-4 m-4 text-sm'>
                <Link href="/explore" className='mx-3'>
                  EXPLORE
                </Link>
                <Link href="/mint" className='mx-3' onClick={e => handleProtectedNav(e, '/mint')}>
                  MINT
                </Link>
                <Link
                  href={address ? `/${address}` : '/'}
                  className='mx-3'
                  onClick={e => {
                    if (!isWalletConnected) {
                      e.preventDefault();
                      setGetInOpen(true);
                    }
                  }}
                >
                  MANAGE
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      {getInOpen && <GetInModal onClose={() => setGetInOpen(false)} />}
    </>
  );
};
