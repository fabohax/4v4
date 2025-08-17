'use client';

import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import React from 'react';
import Marquee from 'react-fast-marquee';

export const Navbar = () => {

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 w-full bg-background/15 backdrop-blur supports-[backdrop-filter]:bg-background/10 z-100 select-none">
        <div className="mx-auto px-2 md:px-4">
          <div className="flex justify-between h-24 items-center">
            {/* Logo Section */}
            <div className="flex items-center">
              <Link href="/" className="no-underline">
                <Button className="text-foreground bg-transparent py-3 cursor-pointer text-2xl hover:bg-[#111]">
                  <Image 
                    src="/home.svg" 
                    height={27} 
                    width={27} 
                    alt="4v4-logo"
                    className="dark:invert-0 invert transition-all duration-200"
                  />
                </Button>
              </Link>
              <div className='md:flex hidden'>
                <div className="relative text-sm">
                  <Search className="absolute left-3 top-3 text-muted-foreground h-[14px]" />
                  <Input
                    type="text"
                    placeholder="Search for models, collections, or creators..."
                    className="w-[369px] bg-muted/10 border-border pl-12 py-3 text-lg rounded-lg"
                  />
                </div>  
              </div>
            </div>
          </div>
        </div>
      </nav>
      <div className="fixed hidden md:block h-9 py-[6px] items-center top-[30px] left-[444px] right-[36px] bg-transparent text-[#777] hover:text-[#999] z-100">
        <Marquee gradient={false} speed={60} pauseOnHover>
          <span className="mx-8 font-lg tracking-widest select-none" style={{ fontFamily: 'Chakra Petch, sans-serif' }}>
            --- CREATE - <Link href="/explore" className='hover:underline'>EXPLORE</Link> - <Link href="/mint" className='hover:underline'>MINT</Link> - SELL - 3D MODELS - BE A WORLDWIDE CREATOR - DO IT YOURSELF ---             --- CREATE - <Link href="/explore" className='hover:underline'>EXPLORE</Link> - <Link href="/mint" className='hover:underline'>MINT</Link> - SELL - 3D MODELS - BE A WORLDWIDE CREATOR - DO IT YOURSELF ---
                        --- CREATE - <Link href="/explore" className='hover:underline'>EXPLORE</Link> - <Link href="/mint" className='hover:underline'>MINT</Link> - SELL - 3D MODELS - BE A WORLDWIDE CREATOR - DO IT YOURSELF ---
          </span>
        </Marquee>
      </div>
    </>
  );
};
