'use client';

import { Box, Button, Container, Flex, Link } from '@chakra-ui/react';
import { useContext, useCallback } from 'react';
import { HiroWalletContext } from './HiroWalletProvider';
import { useDevnetWallet } from '@/lib/devnet-wallet-context';
import { DevnetWalletButton } from './DevnetWalletButton';
import { ConnectWalletButton } from './ConnectWallet';
import { NetworkSelector } from './NetworkSelector';
import { isDevnetEnvironment, useNetwork } from '@/lib/use-network';

export const Navbar = () => {
  const { isWalletConnected } = useContext(HiroWalletContext);
  const { currentWallet, wallets, setCurrentWallet } = useDevnetWallet();
  const network = useNetwork();

  const handleConnect = useCallback(async () => {
    if (!isWalletConnected) {
      try {
        const { showConnect } = await import('@stacks/connect');
        showConnect({
          appDetails: {
            name: 'NFT Marketplace',
            icon: 'https://freesvg.org/img/1541103084.png',
          },
          onFinish: () => {
            window.location.reload();
          },
          onCancel: () => {
          },
        });
      } catch (error) {
        console.error('Failed to load @stacks/connect:', error);
      }
    }
  }, [isWalletConnected]);

  return (
    <Box as="nav" bg="white" boxShadow="sm">
      <Container maxW="container.xl">
        <Flex justify="space-between" h={16} align="center">
          <Flex align="center">
            <Link href="/" textDecoration="none">
              <Box fontSize="lg" fontWeight="bold" color="gray.900" ml={4}>
                4v4
              </Box>
            </Link>
          </Flex>
          <Flex align="center" gap={4}>
            <Link href="/my-nfts">
              <Box>Profile</Box>
            </Link>
            <NetworkSelector />
            {isDevnetEnvironment() ? (
              <DevnetWalletButton
                currentWallet={currentWallet}
                wallets={wallets}
                onWalletSelect={setCurrentWallet}
              />
            ) : (
              <ConnectWalletButton />
            )}
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
};
