'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HiroWalletProvider } from '../HiroWalletProvider';
import { DevnetWalletProvider } from '../DevnetWalletProvider';
import { EncryptedWalletProvider } from '../EncryptedWalletProvider';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <HiroWalletProvider>
        <DevnetWalletProvider>
          <EncryptedWalletProvider>
            {children}
          </EncryptedWalletProvider>
        </DevnetWalletProvider>
      </HiroWalletProvider>
    </QueryClientProvider>
  );
}