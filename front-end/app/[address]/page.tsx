'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useCurrentAddress } from '@/hooks/useCurrentAddress';
import { fetchCallReadOnlyFunction, uintCV } from '@stacks/transactions';
import { getNftContract } from '@/constants/contracts';
import { cvToValue, cvToJSON } from '@stacks/transactions';
import { STACKS_TESTNET, STACKS_MAINNET } from '@stacks/network';
import axios from 'axios';
import Image from 'next/image';
import { User, Pen } from 'lucide-react';
import { Button } from '@/components/ui/button';

const contract = getNftContract();
const CONTRACT_ADDRESS = contract.contractAddress;
const CONTRACT_NAME = contract.contractName;

type TokenMetadata = {
  name?: string;
  description?: string;
  image?: string;
  [key: string]: unknown;
};

// ProfilePage: shows connected wallet's profile and NFTs in a grid
function ProfilePage() {
  const address = useCurrentAddress();
  const [mintedTokens, setMintedTokens] = useState<{ tokenId: number, tokenUri: string }[]>([]);
  const [tokenMetadata, setTokenMetadata] = useState<Record<number, TokenMetadata>>({});
  const [loading, setLoading] = useState(false);

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
        const lastTokenId = Number(cvToValue(lastTokenIdCV));
        console.log('lastTokenId:', lastTokenId); // <-- Add this line for debugging

        if (!lastTokenId || isNaN(lastTokenId)) {
          setMintedTokens([]);
          setLoading(false);
          return;
        }
        const tokens: { tokenId: number, tokenUri: string }[] = [];
        for (let tokenId = 1; tokenId <= lastTokenId; tokenId++) {
          console.log(`Checking tokenId: ${tokenId}`); // Debug
          const ownerCV = await fetchCallReadOnlyFunction({
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: 'get-owner',
            functionArgs: [uintCV(tokenId)],
            network,
            senderAddress: address,
          });
          console.log(`Token ${tokenId} ownerCV:`, ownerCV); // Debug
          const ownerJson = cvToJSON(ownerCV);
          console.log(`Token ${tokenId} ownerJson:`, ownerJson); // Debug

          // Print the full structure for debugging
          try {
            console.log(`Token ${tokenId} ownerJson.value:`, JSON.stringify(ownerJson.value, null, 2));
          } catch {
            console.log(`Token ${tokenId} ownerJson.value:`, ownerJson.value);
          }

          // Defensive: handle possible structure differences
          let owner: string | undefined;
          if (
            ownerJson.value &&
            ownerJson.value.value &&
            typeof ownerJson.value.value.value === 'string'
          ) {
            owner = ownerJson.value.value.value;
          } else if (typeof ownerJson.value === 'string') {
            owner = ownerJson.value;
          } else if (typeof ownerJson.value?.value === 'string') {
            owner = ownerJson.value.value;
          } else {
            owner = undefined;
          }
          console.log(`Token ${tokenId} owner extracted:`, owner, '| expected address:', address);

          let isOwned = false;
          if (owner && owner === address) {
            isOwned = true;
          }
          if (isOwned) {
            const uriCV = await fetchCallReadOnlyFunction({
              contractAddress: CONTRACT_ADDRESS,
              contractName: CONTRACT_NAME,
              functionName: 'get-token-uri',
              functionArgs: [uintCV(tokenId)],
              network,
              senderAddress: address,
            });
            let tokenUri = '';
            const uriJson = cvToJSON(uriCV);
            // Print the full structure for debugging
            try {
              console.log(`Token ${tokenId} uriJson.value:`, JSON.stringify(uriJson.value, null, 2));
            } catch {
              console.log(`Token ${tokenId} uriJson.value:`, uriJson.value);
            }
            // Defensive: handle possible structure differences
            if (uriJson.value && uriJson.value.value && typeof uriJson.value.value.value === 'string') {
              tokenUri = uriJson.value.value.value;
            } else if (typeof uriJson.value === 'string') {
              tokenUri = uriJson.value;
            } else if (typeof uriJson.value?.value === 'string') {
              tokenUri = uriJson.value.value;
            }
            console.log(`Token ${tokenId} tokenUri extracted:`, tokenUri);
            tokens.push({ tokenId, tokenUri });
          }
        }
        setMintedTokens(tokens);

        // Log if the current address already had models or not
        if (tokens.length > 0) {
          console.log(`Address ${address} has ${tokens.length} minted models.`);
        } else {
          console.log(`Address ${address} has no minted models.`);
        }

        // Fetch metadata for IPFS CIDs (not https links)
        const metadataPromises = tokens.map(async (token) => {
          if (!token.tokenUri.startsWith('https')) {
            let cid = token.tokenUri;
            if (cid.startsWith('ipfs://')) {
              cid = cid.replace('ipfs://', '');
            }
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
            <User className='mx-auto h-24 text-[#777]'/>
          </div>
        </div>
        <h2 className='text-4xl mt-8'>_</h2>
        <p className='mt-4 mb-8 text-sm text-[#777]'>{address}</p>
        <Button className="p-2 mb-8 cursor-pointer"><Pen/></Button>
      </div>
      {!address && <p>Please connect your wallet.</p>}
      {loading && <p>Loading...</p>}
      {!loading && mintedTokens.length === 0 && address && (
        <p className='text-center'>
          No Minted Models yet. <Link href="/mint" className="text-blue-400 underline">Mint here</Link>
        </p>
      )}
      {/* Grid of minted models */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-12">
        {mintedTokens.map((mint) => (
          <div key={mint.tokenId} className="bg-gray-900 rounded-xl p-4 border border-gray-800 shadow">
            <div className="font-bold text-lg mb-2">Token #{mint.tokenId}</div>
            {/* Debug: Show raw tokenUri (CID/hash) */}
            <div className="text-xs text-gray-400 break-all mb-2">
              <b>Raw tokenUri:</b> {mint.tokenUri}
            </div>
            {/* Debug: Show resolved IPFS URL */}
            <div className="text-xs text-gray-400 break-all mb-2">
              <b>IPFS URL:</b>{" "}
              {mint.tokenUri.startsWith('https')
                ? mint.tokenUri
                : `https://ipfs.io/ipfs/${mint.tokenUri.replace('ipfs://', '')}`}
            </div>
            {tokenMetadata[mint.tokenId]?.image ? (
              <Image
                src="default.png"
                alt={tokenMetadata[mint.tokenId]?.name || 'NFT Image'}
                width={220}
                height={220}
                className="w-full h-[220px] object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-[220px] flex items-center justify-center bg-gray-800 rounded-lg text-gray-500">
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
    </div>
  );
}

// AddressPage: shows profile for a given address param
function AddressPage({ address }: { address: string }) {
  // Check session for address
  if (typeof window !== 'undefined' && address) {
    try {
      const session = localStorage.getItem('ezstx_session');
      if (session) {
        // You can add logic here if you need to use session info
      }
    } catch {}
  }

  // Dummy profile data for demonstration (replace with real data as needed)
  const displayName = "UNAME";
  const bio =
    "BIO DESCRIPTION HERE";
  const floorValue = 523;
  const totalBought = 8;
  const followers = 1;
  const following = 8;

  return (
    <div className="my-24 mx-auto w-full px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col items-center gap-8 my-16" >
          {/* Avatar */}
          <div className="flex-shrink-0 mt-8">
            <div className="bg-[#222] rounded-full h-32 w-32 flex items-center justify-center overflow-hidden mx-auto">
              {/* Replace with user image if available */}
              <Image
                src="/default.png"
                alt="-"
                width={128}
                height={128}
                className="h-32 w-32 object-cover"
                priority
              />
            </div>
          </div>
          {/* Name, address, bio, buttons */}
          <div className="flex flex-col items-center">
            <h1 className="title text-4xl font-bold text-center">{displayName}</h1>
            <div className="text-[#aaa] mt-1 text-sm text-center">{address}</div>
            <div className="mt-4 text-[#ccc] max-w-2xl text-center">{bio}</div>
            <div className="flex gap-2 mt-4 justify-center">
              <button className="px-4 py-2 rounded-lg bg-[#222] border border-[#333] text-white text-sm hover:bg-[#333] transition">Edit Showcase</button>
              <button className="px-4 py-2 rounded-lg bg-[#222] border border-[#333] text-white text-sm hover:bg-[#333] transition">Edit profile</button>
              <button className="px-4 py-2 rounded-lg bg-[#222] border border-[#333] text-white text-sm hover:bg-[#333] transition">Link wallets</button>
            </div>
          </div>
        </div>
        {/* Stats */}
        <div className="flex flex-row gap-6 items-center justify-center mt-8">
          <div>
            <span className="font-semibold">{floorValue} STX</span>{" "}
            <span className="text-[#aaa]">Floor value</span>
          </div>
          <div>
            <span className="font-semibold">{totalBought} STX</span>{" "}
            <span className="text-[#aaa]">Total bought</span>
          </div>
          <div>
            <span className="font-semibold">{followers}</span>{" "}
            <span className="text-[#aaa]">Followers</span>
            {"  "}
            <span className="font-semibold ml-4">{following}</span>{" "}
            <span className="text-[#aaa]">Following</span>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex gap-2 mt-12 mb-8 items-center justify-center">
          <button className="px-6 py-2 rounded-xl bg-[#ff006a] text-white font-semibold text-base shadow hover:bg-[#e6005c] transition relative">
            Showcase <span className="ml-2 bg-[#222] text-white text-xs px-2 py-0.5 rounded-full">22</span>
          </button>
          <button className="px-6 py-2 rounded-xl bg-[#222] text-white font-semibold text-base hover:bg-[#333] transition">
            Collected <span className="ml-2 bg-[#111] text-white text-xs px-2 py-0.5 rounded-full">28</span>
          </button>
          <button className="px-6 py-2 rounded-xl bg-[#222] text-white font-semibold text-base hover:bg-[#333] transition">
            Created <span className="ml-2 bg-[#111] text-white text-xs px-2 py-0.5 rounded-full">1</span>
          </button>
          <button className="px-6 py-2 rounded-xl bg-[#222] text-white font-semibold text-base hover:bg-[#333] transition">
            Offers received
          </button>
          <button className="px-6 py-2 rounded-xl bg-[#222] text-white font-semibold text-base hover:bg-[#333] transition">
            Offers made
          </button>
          <button className="px-6 py-2 rounded-xl bg-[#222] text-white font-semibold text-base hover:bg-[#333] transition">
            Activity
          </button>
        </div>
        {/* Placeholder grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-8">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="bg-[#111] rounded-xl w-full aspect-square"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Main export: decide which page to show based on params
export default function Page() {
  const params = useParams();
  const currentAddress = useCurrentAddress();
  const address =
    params && typeof params.address === 'string'
      ? params.address
      : params && Array.isArray(params.address)
      ? params.address[0]
      : null;

  // If no address param, show ProfilePage (current user)
  if (!address) {
    return <ProfilePage />;
  }

  // If address param matches current user, show ProfilePage (with grid)
  if (currentAddress && address && currentAddress.toLowerCase() === address.toLowerCase()) {
    return <ProfilePage />;
  }

  // Otherwise, show AddressPage (public profile)
  return <AddressPage address={address} />;
}
