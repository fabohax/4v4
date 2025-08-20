import React from 'react';
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

/**
 * Custom Image component that automatically handles IPFS URLs by using regular img tags
 * to avoid Next.js optimization authentication issues, while still using Next.js Image
 * optimization for regular URLs.
 */
export function OptimizedImage({
  src,
  alt,
  width = 96,
  height = 96,
  className,
  onError
}: OptimizedImageProps) {
  // Check if it's an IPFS URL (from our custom gateway that requires auth)
  const isIPFS = src.includes('mypinata.cloud/ipfs/') || src.includes('gateway.pinata.cloud/ipfs/');

  if (isIPFS) {
    // Use regular img tag for IPFS URLs to avoid Next.js optimization
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        onError={onError}
        style={{ width, height }}
      />
    );
  }

  // Use Next.js Image for regular URLs
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={onError}
    />
  );
}
