'use client';

import { useParams } from 'next/navigation';
import React from 'react';

export default function AddressPage() {
  const params = useParams();
  const address =
    params && typeof params.address === 'string'
      ? params.address
      : params && Array.isArray(params.address)
      ? params.address[0]
      : null;

  if (!address) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[60vh]'>
        <div className='bg-[#333] rounded-full h-24 w-24 flex items-center justify-center mb-8'></div>
        <h2 className='text-2xl mb-2'>Profile</h2>
        <p className='text-sm text-[#777]'>No address provided.</p>
      </div>
    );
  }

  // Check session for address
  let isLoggedIn = false;
  if (typeof window !== 'undefined' && address) {
    try {
      const session = localStorage.getItem('ezstx_session');
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed.address === address) {
          isLoggedIn = true;
        }
      }
    } catch {}
  }

  return (
    <div className='my-24 mx-auto w-full px-8'>
      <div className='text-center items-center justify-center'>
        <div className='mt-36 mx-auto'>
          <div className='mx-auto my-8 bg-[#333] rounded-full h-24 w-24 cursor-pointer select-none'></div>
        </div>
        <h2 className='text-4xl mt-8 text-gray-700'></h2>
        <p className='mt-4 mb-8 text-sm text-[#777]'>
          {address}
          {isLoggedIn && <span className="ml-2 text-green-500 font-semibold select-none">•</span>}
        </p>
      </div>
    </div>
  );
}
