'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function Home() {
  return (
      <Link href="/mint" className='fixed bottom-6 right-6 p-3 rounded-full border border-1 border-[#000]'>
          <Plus color="#000"/> 
      </Link>
  );
}
