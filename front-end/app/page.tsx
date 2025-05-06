'use client';

import { useState } from 'react';
import CenterPanel from '@/components/features/avatar/CenterPanel';

export default function Home() {
  const [secondaryColor] = useState<string>('#ffffff');
  const [background] = useState<string>('#212121');
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
    </>
      
  );
}
