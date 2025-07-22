'use client';

import React, { useEffect, useState } from 'react';
import { useCurrentAddress } from '@/hooks/useCurrentAddress';
import { fetchCallReadOnlyFunction, uintCV } from '@stacks/transactions';
import { getNftContract } from '@/constants/contracts';
import { cvToValue, cvToJSON } from '@stacks/transactions';
import axios from 'axios';
import Image from 'next/image';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pen } from 'lucide-react';
import { getProfile } from '@/lib/profileApi';

const contract = getNftContract();
const CONTRACT_ADDRESS = contract.contractAddress;
const CONTRACT_NAME = contract.contractName;

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
        const network = "testnet";

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
          } else if (isOwned = false) 

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
    <div className='my-24 mx-auto w-full px-8'>
      <div className='text-center items-center justify-center'>
        <div className='mt-36 mx-auto'>
          <div className='mx-auto my-8 bg-[#333] rounded-full h-24 w-24'>
            <User className='mx-auto h-24 text-[#777]'/></div>
        </div>
        {/* Show profile fields if available */}
        {profile && (
          <div className="mb-8">
            {profile.display_name && (
              <h2 className='text-4xl mt-8'>{profile.display_name}</h2>
            )}
            {profile.username && (
              <div className="text-lg text-[#aaa]">@{profile.username}</div>
            )}
            {profile.tagline && (
              <div className="mt-2 text-[#bbb] italic">{profile.tagline}</div>
            )}
            {profile.biography && (
              <div className="mt-2 text-[#ccc]">{profile.biography}</div>
            )}
            {profile.location && (
              <div className="mt-2 text-[#888]">📍 {profile.location}</div>
            )}
            {profile.website && (
              <div className="mt-2">
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">{profile.website}</a>
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
          <h2 className='text-4xl mt-8'>40230</h2>
        )}
        <p className='mt-4 mb-8 text-sm text-[#777]'>{address}</p>
        <Button className="p-2 mb-8 cursor-pointer"><Pen/></Button>
      </div>
      {!address && <p>Please connect your wallet.</p>}
      {loading && <p>Loading...</p>}
      {!loading && mintedTokens.length === 0 && address && <p className='text-center'>No mints found.</p>}
      <ul>
        {mintedTokens.map((mint) => (
          <li key={mint.tokenId} className="mb-8">
            Token ID: {mint.tokenId}
            <br />
            {mint.tokenUri.startsWith('https') ? (
              <>
                Token URI: <a href={mint.tokenUri} target="_blank" rel="noopener noreferrer">{mint.tokenUri}</a>
              </>
            ) : (
              <>
                Token URI: <a href={`https://ipfs.io/ipfs/${mint.tokenUri.replace('ipfs://', '')}`} target="_blank" rel="noopener noreferrer">{mint.tokenUri}</a>
                {tokenMetadata[mint.tokenId] && (
                  <div className="mt-2 p-2 border rounded bg-gray-900">
                    <div><b>Name:</b> {tokenMetadata[mint.tokenId].name}</div>
                    <div><b>Description:</b> {tokenMetadata[mint.tokenId].description}</div>
                    {tokenMetadata[mint.tokenId].image && (
                      <div>
                        <b>Image:</b><br />
                        <Image
                          src={
                            tokenMetadata[mint.tokenId].image
                              ? (
                                  tokenMetadata[mint.tokenId].image?.startsWith('ipfs://')
                                    ? `https://ipfs.io/ipfs/${tokenMetadata[mint.tokenId].image?.replace('ipfs://', '')}`
                                    : tokenMetadata[mint.tokenId].image as string
                                )
                              : '/placeholder.png'
                          }
                          alt={tokenMetadata[mint.tokenId].name || 'NFT image'}
                          width={200}
                          height={200}
                          style={{ maxWidth: 200, marginTop: 8, height: 'auto' }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}