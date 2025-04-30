'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HiroWalletProvider } from '../HiroWalletProvider';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
        <HiroWalletProvider>{children}</HiroWalletProvider>
    </QueryClientProvider>
  );
}