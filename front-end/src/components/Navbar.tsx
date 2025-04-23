'use client';

import { Box, Container, Flex, Link } from '@chakra-ui/react';
import { useContext, useCallback } from 'react';
import { HiroWalletContext } from './HiroWalletProvider';
import { ConnectWalletButton } from './ConnectWallet';
import { isDevnetEnvironment, useNetwork } from '@/lib/use-network';
import { Button } from "@/components/ui/button";

export const Navbar = () => {
  const { isWalletConnected } = useContext(HiroWalletContext);
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
              <Button variant="outline" className='text-white bg-black'>
                4v4
              </Button>
            </Link>
          </Flex>
          <Flex align="center" gap={4}>
            <Link href="/profile">
              <Box>Profile</Box>
            </Link>
            <ConnectWalletButton />
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
};
