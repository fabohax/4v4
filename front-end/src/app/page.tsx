'use client';

import { Container, Button } from '@chakra-ui/react';

export default function BrowsePage() {
  return (
    <Container maxW="container.xl" py={8}>
      <Button as="a" href="/profile" colorScheme="blue" size="lg" px={8}>
        Mint your Avatar
      </Button>
    </Container>
  );
}
