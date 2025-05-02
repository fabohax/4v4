'use client';

import { useState } from 'react';
import Link from 'next/link';
import CenterPanel from '@/components/features/avatar/CenterPanel';
import { Plus } from 'lucide-react';

export default function Home() {
  const [secondaryColor] = useState<string>('#ffffff');
  const [background] = useState<string>('#f5f5f5');
  const [modelUrl] = useState<string | null>('/models/default.glb');
  const [lightIntensity] = useState<number>(11);
  
  return (
    <>
      <div className="h-full">
        <CenterPanel
          background={background}
          secondaryColor={secondaryColor}
          modelUrl={modelUrl}
          lightIntensity={lightIntensity}
        />
      </div>
      <Link href="/mint" className='fixed bottom-6 right-6 p-3 rounded-full border-1 border-[#000]'>
        <Plus color="#000"/> 
      </Link>
    </>
      
  );
}
