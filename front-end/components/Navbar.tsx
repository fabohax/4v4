'use client';

import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import React from 'react';

export const Navbar = () => {

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 w-full bg-background/15 backdrop-blur supports-[backdrop-filter]:bg-background/10 z-100">
        <div className="mx-auto px-2 md:px-4">
          <div className="flex justify-between h-24 items-center">
            {/* Logo Section */}
            <div className="flex items-center">
              <Link href="/" className="no-underline">
                <Button className="text-white bg-black py-3 mr-2 cursor-pointer text-2xl">
                  <Image src="/delta-logo.svg" height={27} width={27} alt="delta-logo"></Image>
                  
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


          </div>
        </div>
      </nav>
    </>
  );
};
