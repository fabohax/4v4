'use client';

import { useContext, useState } from 'react';
import { HiroWalletContext } from './HiroWalletProvider';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { RiFileCopyLine, RiCloseLine } from 'react-icons/ri';

interface ConnectWalletButtonProps {
  children?: React.ReactNode;
  [key: string]: unknown;
}

export const ConnectWalletButton = (buttonProps: ConnectWalletButtonProps) => {
  const { children } = buttonProps;
  const [didCopyAddress, setDidCopyAddress] = useState(false);
  const { authenticate, isWalletConnected, mainnetAddress, testnetAddress, network, disconnect } =
    useContext(HiroWalletContext);

  const currentAddress = network === 'testnet' ? testnetAddress : mainnetAddress;

  const copyAddress = () => {
    if (currentAddress) {
      navigator.clipboard.writeText(currentAddress);
      setDidCopyAddress(true);
      setTimeout(() => {
        setDidCopyAddress(false);
      }, 1000);
    }
  };

  const truncateMiddle = (str: string | null) => {
    if (!str) return '';
    if (str.length <= 12) return str;
    return `${str.slice(0, 6)}...${str.slice(-4)}`;
  };

  return (
    <TooltipProvider>
      {isWalletConnected ? (
        <div className="flex items-center gap-2 px-2 rounded-md bg-gray-200">
          <span className="text-sm text-gray-800">{truncateMiddle(currentAddress)}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                aria-label="Copy address"
                className="p-1 text-gray-600 hover:text-gray-800"
                onClick={copyAddress}
              >
                <RiFileCopyLine size={16} />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{didCopyAddress ? 'Copied!' : 'Copy address'}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                aria-label="Disconnect wallet"
                className="p-1 text-gray-600 hover:text-gray-800"
                onClick={disconnect}
              >
                <RiCloseLine size={16} />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Disconnect</p>
            </TooltipContent>
          </Tooltip>
        </div>
      ) : (
        <Button
          onClick={authenticate}
          className="bg-blue-500 hover:bg-blue-600 text-white"
          {...buttonProps}
        >
          {children || 'Connect Wallet'}
        </Button>
      )}
    </TooltipProvider>
  );
};
