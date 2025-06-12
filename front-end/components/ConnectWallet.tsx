'use client';

import { useContext, useState } from 'react';
import { HiroWalletContext } from './HiroWalletProvider';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';

interface ConnectWalletButtonProps {
  children?: React.ReactNode;
  [key: string]: unknown;
}

export const ConnectWalletButton = (buttonProps: ConnectWalletButtonProps) => {
  const { children } = buttonProps;
  const [buttonLabel] = useState(children || 'Connect');
  const {
    authenticate,
    isWalletConnected,
  } = useContext(HiroWalletContext);

  return (
    <>
      <TooltipProvider>
        {isWalletConnected ? (
          <div>
            Wallet Connected
          </div>
        ) : (
          <div>
            <Button
              onClick={authenticate}
              className="bg-white text-black w-full h-10 rounded-lg font-semibold text-base cursor-pointer hover:bg-white hover:text-black"
              {...buttonProps}
            >
              {buttonLabel}
            </Button>
          </div>
        )}
      </TooltipProvider>
    </>
  );
};
