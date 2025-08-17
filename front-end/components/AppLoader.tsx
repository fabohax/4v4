'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface AppLoaderProps {
  isLoading: boolean;
  message?: string;
  subMessage?: string;
}

export default function AppLoader({ 
  isLoading, 
  message = "Loading", 
  subMessage = "Preparing app..." 
}: AppLoaderProps) {
  const [dots, setDots] = useState('');

  // Animated dots for loading text
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  if (!isLoading) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-transparent flex flex-col items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col items-center space-y-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="relative"
        >
          <Image
            src="/loader.gif"
            alt="Loading..."
            width={120}
            height={120}
            unoptimized
            className="rounded-lg"
          />
          {/* Subtle pulsing glow effect */}
          <div className="absolute inset-0 rounded-lg animate-pulse" />
        </motion.div>
        
        <motion.div
          className="text-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {message}{dots}
          </h2>
          <p className="text-muted-foreground">
            {subMessage}
          </p>
        </motion.div>
        
        {/* Progress indicator */}
        <motion.div
          className="w-64 h-1 bg-muted rounded-full overflow-hidden"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 256, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <motion.div
            className="h-full bg-transparent rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ delay: 0.8, duration: 2, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
