'use client';

import React, { useEffect, useState } from 'react';
import { STACKS_TESTNET, STACKS_MAINNET } from '@stacks/network';
import { useCurrentAddress } from '@/hooks/useCurrentAddress';
import { fetchCallReadOnlyFunction, uintCV } from '@stacks/transactions';
import { cvToValue, cvToJSON } from '@stacks/transactions';
import axios from 'axios';
import Image from 'next/image';
import { User, Pen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getProfile } from '@/lib/profileApi';
import Link from 'next/link';

// Note: This page is for viewing existing NFTs from deprecated contracts
// For new NFT minting, use the /mint page which deploys contracts dynamically
const CONTRACT_ADDRESS = 'ST3ZFT624V70VXEYAZ51VPKRHXSEQRT6PA51T2SPS'; // Deprecated testnet address
const CONTRACT_NAME = 'avatar-minter'; // Deprecated contract name

type TokenMetadata = {
  name?: string;
  description?: string;
  image?: string;
  [key: string]: unknown;
};

export default function ProfilePage() {
  const address = useCurrentAddress();
  const [mintedTokens, setMintedTokens] = useState<{ tokenId: number, tokenUri: string }[]>([]);
  const [tokenMetadata, setTokenMetadata] = useState<Record<number, TokenMetadata>>({});
  const [loading, setLoading] = useState(false);
  // Define a type for the profile object
  type Profile = {
    display_name?: string;
    username?: string;
    tagline?: string;
    biography?: string;
    location?: string;
    website?: string;
    twitter?: string;
    [key: string]: unknown;
  };

  // Add state for profile
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!address) return;
    getProfile(address)
      .then((profile) => setProfile(profile))
      .catch(() => setProfile(null));
  }, [address]);

  useEffect(() => {
    if (!address) return;
    const fetchMints = async () => {
      setLoading(true);
      try {
        const networkEnv = process.env.NEXT_PUBLIC_STACKS_NETWORK || "testnet";
        const network =
          networkEnv === "mainnet"
            ? STACKS_MAINNET
            : STACKS_TESTNET;

        const lastTokenIdCV = await fetchCallReadOnlyFunction({
          contractAddress: CONTRACT_ADDRESS,
          contractName: CONTRACT_NAME,
          functionName: 'get-last-token-id',
          functionArgs: [],
          network,
          senderAddress: address,
        });
        console.log('lastTokenIdCV:', lastTokenIdCV);

        // FIX: Extract the ClarityValue from the response
        // Use cvToValue directly on lastTokenIdCV, not lastTokenIdCV.value
        const lastTokenId = Number(cvToValue(lastTokenIdCV));
        console.log('lastTokenId:', lastTokenId);

        if (!lastTokenId || isNaN(lastTokenId)) {
          setMintedTokens([]);
          setLoading(false);
          return;
        }

        const tokens: { tokenId: number, tokenUri: string }[] = [];
        for (let tokenId = 1; tokenId <= lastTokenId; tokenId++) {
          const ownerCV = await fetchCallReadOnlyFunction({
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: 'get-owner',
            functionArgs: [uintCV(tokenId)],
            network,
            senderAddress: address,
          });
          console.log(`Token ${tokenId} ownerCV:`, ownerCV);

          // Unwrap the .value.value before passing to cvToJSON
          const ownerJson = cvToJSON(ownerCV);
          const owner = ownerJson.value.value.value;
          let isOwned = false;
          console.log('owner:', ownerJson.value)
          console.log('address:', address)

          if (owner === address) {
            isOwned = true;
          } else {
            isOwned = false;
          }

          console.log(`Token ${tokenId} owner: |${owner}|, User address: |${address}|, isOwned: ${isOwned}`);

          if (isOwned) {
            console.log(`Token ${tokenId} is owned by the user.`);
            const uriCV = await fetchCallReadOnlyFunction({
              contractAddress: CONTRACT_ADDRESS,
              contractName: CONTRACT_NAME,
              functionName: 'get-token-uri',
              functionArgs: [uintCV(tokenId)],
              network,
              senderAddress: address,
            });
            console.log(`Token ${tokenId} uriCV:`, uriCV);
            let tokenUri = '';
            const uriJson = cvToJSON(uriCV);
            console.log('uriJson:', uriJson);
            tokenUri = uriJson.value.value.value;
            console.log(`Token ${tokenId} URI: ${tokenUri}`);
            tokens.push({ tokenId, tokenUri });
          } else {
            console.log(`Token ${tokenId} is NOT owned by the user.`);
          }
        }
        setMintedTokens(tokens);

        // Fetch metadata for IPFS CIDs (not https links)
        const metadataPromises = tokens.map(async (token) => {
          if (!token.tokenUri.startsWith('https')) {
            // Assume tokenUri is a CID or ipfs://CID
            let cid = token.tokenUri;
            if (cid.startsWith('ipfs://')) {
              cid = cid.replace('ipfs://', '');
            }
            // Use a public IPFS gateway
            const url = `https://ipfs.io/ipfs/${cid}`;
            try {
              const res = await axios.get<TokenMetadata>(url, { timeout: 5000 });
              return { tokenId: token.tokenId, metadata: res.data };
            } catch {
              return { tokenId: token.tokenId, metadata: null };
            }
          }
          return { tokenId: token.tokenId, metadata: null };
        });

        const metadatas = await Promise.all(metadataPromises);
        const metaMap: Record<number, TokenMetadata> = {};
        metadatas.forEach(({ tokenId, metadata }) => {
          if (metadata) metaMap[tokenId] = metadata;
        });
        setTokenMetadata(metaMap);

      } catch (err) {
        console.error('Error fetching mints:', err);
        setMintedTokens([]);
      }
      setLoading(false);
    };
    fetchMints();
  }, [address]);

  return (
    <div className='mx-auto w-full px-4 md:px-8 my-12 md:my-24'>
      <div className='text-center items-center justify-center'>
        <div className='mt-16 md:mt-36 mx-auto'>
          <div className='mx-auto my-8 bg-[#333] rounded-full h-20 w-20 md:h-24 md:w-24'>
            <User className='mx-auto h-20 md:h-24 text-[#777]'/></div>
        </div>
        {/* Show profile fields if available */}
        {profile && (
          <div className="mb-8">
            {profile.display_name && (
              <h2 className='text-2xl md:text-4xl mt-6 md:mt-8'>{profile.display_name}</h2>
            )}
            {profile.username && (
              <div className="text-base md:text-lg text-[#aaa]">@{profile.username}</div>
            )}
            {profile.tagline && (
              <div className="mt-2 text-[#bbb] italic">{profile.tagline}</div>
            )}
            {profile.biography && (
              <div className="mt-2 text-[#ccc] px-2 max-w-2xl mx-auto">{profile.biography}</div>
            )}
            {profile.location && (
              <div className="mt-2 text-[#888]">📍 {profile.location}</div>
            )}
            {profile.website && (
              <div className="mt-2">
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline break-all">{profile.website}</a>
              </div>
            )}
            {profile.twitter && (
              <div className="mt-2">
                <a href={`https://twitter.com/${profile.twitter.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                  @{profile.twitter.replace(/^@/, '')}
                </a>
              </div>
            )}
          </div>
        )}
        {!profile && (
          <h2 className='text-2xl md:text-4xl mt-6 md:mt-8'>40230</h2>
        )}
        <p className='mt-3 md:mt-4 mb-6 md:mb-8 text-sm text-[#777] break-all px-2'>{address}</p>
        <Button className="p-2 mb-8 cursor-pointer"><Pen/></Button>
      </div>
      {!address && <p>Please connect your wallet.</p>}
      {loading && <p>Loading...</p>}
      {!loading && mintedTokens.length === 0 && address && (
        <p className='text-center'>
          No mints found. <Link href="/mint" className="text-blue-400 underline">Mint here</Link>
        </p>
      )}

      {/* Grid of minted models (same pattern as address page) */}
      {mintedTokens.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mt-8 md:mt-12">
          {mintedTokens.map((mint) => (
            <div key={mint.tokenId} className="bg-gray-900 rounded-xl p-4 border border-gray-800 shadow">
              <div className="font-bold text-base md:text-lg mb-2">Token #{mint.tokenId}</div>

              {tokenMetadata[mint.tokenId]?.image ? (
                <Image
                  src={(() => {
                    const img = tokenMetadata[mint.tokenId]?.image as string;
                    if (!img) return '/4V4-DIY.png';
                    if (img.startsWith('ipfs://')) {
                      return `https://ipfs.io/ipfs/${img.replace('ipfs://', '')}`;
                    }
                    return img;
                  })()}
                  alt={tokenMetadata[mint.tokenId]?.name || 'NFT Image'}
                  width={600}
                  height={600}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="w-full h-[180px] md:h-[220px] object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-[180px] md:h-[220px] flex items-center justify-center bg-gray-800 rounded-lg text-gray-500">
                  No image
                </div>
              )}

              <div className="mt-4">
                <div className="font-semibold">{tokenMetadata[mint.tokenId]?.name || 'Unnamed NFT'}</div>
                <div className="text-xs text-gray-400 mb-2">{tokenMetadata[mint.tokenId]?.description}</div>
                <a
                  href={
                    mint.tokenUri.startsWith('https')
                      ? mint.tokenUri
                      : `https://ipfs.io/ipfs/${mint.tokenUri.replace('ipfs://', '')}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline text-xs"
                >
                  View Metadata
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}