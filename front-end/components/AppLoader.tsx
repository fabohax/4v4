'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

interface AppLoaderProps {
  isLoading: boolean;
}

export default function AppLoader({ isLoading }: AppLoaderProps) {
  if (!isLoading) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-background flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <Image
          src="/loader.gif"
          alt="Loading..."
          width={120}
          height={120}
          priority
          unoptimized
          className="rounded-lg"
        />
      </motion.div>
    </motion.div>
  );
}
