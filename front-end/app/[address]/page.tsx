'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useCurrentAddress } from '@/hooks/useCurrentAddress';
import { fetchCallReadOnlyFunction, uintCV, cvToJSON } from '@stacks/transactions';
import { STACKS_TESTNET, STACKS_MAINNET } from '@stacks/network';
import axios from 'axios';
import Image from 'next/image';
import { User, Pen } from 'lucide-react';
import { Button } from '@/components/ui/button';


type TokenMetadata = {
  name?: string;
  description?: string;
  image?: string;
  [key: string]: unknown;
};

// Helper: extract uint from cvToJSON output that may be wrapped in (ok ...)
function extractOkUint(input: unknown): number | null {
  if (typeof input !== 'object' || input === null) return null;
  const outer = input as { value?: unknown };
  const v = outer.value;
  if (typeof v === 'object' && v !== null) {
    const inner = (v as { value?: unknown }).value;
    if (typeof inner === 'string' || typeof inner === 'number') {
      const n = Number(inner);
      return Number.isNaN(n) ? null : n;
    }
  }
  if (typeof v === 'string' || typeof v === 'number') {
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

// MintedTokensGrid: reusable grid for displaying minted tokens
function MintedTokensGrid({ mintedTokens, tokenMetadata }: {
  mintedTokens: Array<{ contractAddress: string, contractName: string, tokenId: number, tokenUri: string }>;
  tokenMetadata: Record<string, TokenMetadata>;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mt-8 md:mt-12">
      {mintedTokens.map(mint => {
        const metaKey = `${mint.contractAddress}:${mint.contractName}:${mint.tokenId}`;
        const meta = tokenMetadata[metaKey];
        return (
          <Link 
            key={metaKey} 
            href={`/${mint.contractAddress}/${mint.contractName}/${mint.tokenId}`}
            className="block transition-transform hover:scale-[1.02]"
          >
            <div className="bg-[#111] rounded-xl p-4 border border-[#111] shadow cursor-pointer">
              {/* Square cover image */}
              {meta?.image ? (
                <div className="relative w-full pt-[100%]">
                  <Image
                    src={(() => {
                      const img = meta?.image as string;
                      if (!img) return '/4V4-DIY.png';
                      let out = img;
                      if (img.startsWith('ipfs://')) {
                        out = `https://ipfs.io/ipfs/${img.replace('ipfs://', '')}`;
                      }
                      // Normalize common IPFS gateways to ipfs.io to reduce 500s
                      out = out.replace('https://gateway.pinata.cloud/ipfs/', 'https://ipfs.io/ipfs/');
                      out = out.replace('.mypinata.cloud/ipfs/', '://ipfs.io/ipfs/');
                      return out;
                    })()}
                    alt={meta?.name || 'NFT Image'}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="absolute inset-0 object-cover rounded-lg"
                    unoptimized
                    onError={(e) => {
                      const imgEl = e.currentTarget as HTMLImageElement;
                      if (imgEl && imgEl.src !== window.location.origin + '/4V4-DIY.png') {
                        imgEl.src = '/4V4-DIY.png';
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="relative w-full pt-[100%]">
                  <div className="absolute inset-0 flex items-center justify-center bg-[#101010] border-[1px] border-[#222] rounded-lg text-gray-500">
                    No image
                  </div>
                </div>
              )}
              <div className="mt-4">
                <div className="font-semibold">{meta?.name || 'Unnamed NFT'}</div>
                <div className="text-xs text-gray-400 mb-2">{meta?.description}</div>
                <div className="text-xs text-gray-500">Token #{mint.tokenId}</div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ProfilePage: shows connected wallet's profile and NFTs in a grid
function ProfilePage() {
  const address = useCurrentAddress();
  const [mintedTokens, setMintedTokens] = useState<Array<{ contractAddress: string, contractName: string, tokenId: number, tokenUri: string }>>([]);
  const [tokenMetadata, setTokenMetadata] = useState<Record<string, TokenMetadata>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) return;
    const fetchMints = async () => {
      setLoading(true);
      try {
        // 1. Fetch all smart_contract transactions by this address
        const networkEnv = process.env.NEXT_PUBLIC_STACKS_NETWORK || "testnet";
        const apiBase = networkEnv === "mainnet"
          ? "https://api.hiro.so/extended/v1"
          : "https://api.testnet.hiro.so/extended/v1";
        // Get all smart_contract transactions
        const txRes = await axios.get(`${apiBase}/address/${address}/transactions?type=smart_contract&limit=50`);
        const txs = txRes.data?.results || [];
        console.log('Txs length:', txs.length);
        type SmartContractTx = {
          tx_type: string;
          smart_contract?: { contract_id?: string };
          contract_call?: unknown;
          contract_id?: string;
        };
        (txs as SmartContractTx[]).forEach((tx, idx) => {
          console.log(`TX[${idx}] smart_contract:`, tx.smart_contract);
        });
        // Filter for contract deployments (prefer tx.smart_contract.contract_id)
        const contracts = (txs as SmartContractTx[])
          .filter((tx) => tx.tx_type === 'smart_contract' && tx.contract_call === undefined && (tx.smart_contract?.contract_id || tx.contract_id))
          .map((tx) => {
            const cid = tx.smart_contract?.contract_id || tx.contract_id!;
            const [contractAddress, contractName] = cid.split('.');
            return { contractAddress, contractName };
          });
        console.log('Contracts found:', contracts);

        // 2. For each contract, try to enumerate tokens
        const allTokens: Array<{ contractAddress: string, contractName: string, tokenId: number, tokenUri: string }> = [];
        for (const contract of contracts) {
          const { contractAddress, contractName } = contract;
          // Try to get last token id
          let lastTokenId = 0;
          try {
            const lastTokenIdCV = await fetchCallReadOnlyFunction({
              contractAddress,
              contractName,
              functionName: 'get-last-token-id',
              functionArgs: [],
              network: networkEnv === "mainnet" ? STACKS_MAINNET : STACKS_TESTNET,
              senderAddress: address,
            });
            const lastJson = cvToJSON(lastTokenIdCV);
            const parsed = extractOkUint(lastJson);
            lastTokenId = parsed ?? 0;
            console.log(`Contract ${contractAddress}.${contractName} lastTokenId:`, lastTokenId);
          } catch (err) {
            console.log(`Error getting lastTokenId for ${contractAddress}.${contractName}:`, err);
          }
          if (!lastTokenId || isNaN(lastTokenId)) continue;
          for (let tokenId = 1; tokenId <= lastTokenId; tokenId++) {
            try {
              const ownerCV = await fetchCallReadOnlyFunction({
                contractAddress,
                contractName,
                functionName: 'get-owner',
                functionArgs: [uintCV(tokenId)],
                network: networkEnv === "mainnet" ? STACKS_MAINNET : STACKS_TESTNET,
                senderAddress: address,
              });
              const ownerJson = cvToJSON(ownerCV);
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
              console.log(`Token ${tokenId} owner for ${contractAddress}.${contractName}:`, owner);
              if (owner && owner === address) {
                // Get token URI
                let tokenUri = '';
                try {
                  const uriCV = await fetchCallReadOnlyFunction({
                    contractAddress,
                    contractName,
                    functionName: 'get-token-uri',
                    functionArgs: [uintCV(tokenId)],
                    network: networkEnv === "mainnet" ? STACKS_MAINNET : STACKS_TESTNET,
                    senderAddress: address,
                  });
                  const uriJson = cvToJSON(uriCV);
                  if (uriJson.value && uriJson.value.value && typeof uriJson.value.value.value === 'string') {
                    tokenUri = uriJson.value.value.value;
                  } else if (typeof uriJson.value === 'string') {
                    tokenUri = uriJson.value;
                  } else if (typeof uriJson.value?.value === 'string') {
                    tokenUri = uriJson.value.value;
                  }
                } catch (err) {
                  console.log(`Error getting tokenUri for token ${tokenId} in ${contractAddress}.${contractName}:`, err);
                }
                allTokens.push({ contractAddress, contractName, tokenId, tokenUri });
              }
            } catch (err) {
              console.log(`Error getting owner for token ${tokenId} in ${contractAddress}.${contractName}:`, err);
            }
          }
        }
        console.log('All minted tokens:', allTokens);
        setMintedTokens(allTokens);
        // Fetch metadata for IPFS CIDs (not https links)
        const metadataPromises = allTokens.map(async (token) => {
          if (!token.tokenUri.startsWith('https')) {
            let cid = token.tokenUri;
            if (cid.startsWith('ipfs://')) {
              cid = cid.replace('ipfs://', '');
            }
            const url = `https://ipfs.io/ipfs/${cid}`;
            try {
              const res = await axios.get<TokenMetadata>(url, { timeout: 5000 });
              return { key: `${token.contractAddress}:${token.contractName}:${token.tokenId}`, metadata: res.data };
            } catch {
              return { key: `${token.contractAddress}:${token.contractName}:${token.tokenId}`, metadata: null };
            }
          }
          return { key: `${token.contractAddress}:${token.contractName}:${token.tokenId}`, metadata: null };
        });
        const metadatas = await Promise.all(metadataPromises);
        const metaMap: Record<string, TokenMetadata> = {};
        metadatas.forEach(({ key, metadata }) => {
          if (metadata) metaMap[key] = metadata;
        });
        setTokenMetadata(metaMap);
      } catch (err) {
        console.log('Error in fetchMints:', err);
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
          <div className='mx-auto my-8 bg-[#111] rounded-full h-20 w-20 md:h-24 md:w-24'>
            <User className='mx-auto h-20 md:h-24 text-[#777]'/>
          </div>
        </div>
        <h2 className='text-2xl md:text-4xl mt-6 md:mt-8 hidden'></h2>
        <p className='title mt-3 md:mt-4 mb-6 md:mb-8 text-lg text-[#777]'>{address}</p>
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
      <MintedTokensGrid mintedTokens={mintedTokens} tokenMetadata={tokenMetadata} />
    </div>
  );
}

// AddressPage: shows profile for a given address param
function AddressPage({ address }: { address: string }) {
  // List minted NFTs for the given address using Hiro API
  const [mintedTokens, setMintedTokens] = useState<Array<{ contractAddress: string, contractName: string, tokenId: number, tokenUri: string }>>([]);
  const [tokenMetadata, setTokenMetadata] = useState<Record<string, TokenMetadata>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) return;
    const fetchMints = async () => {
      setLoading(true);
      try {
        // 1. Fetch all smart_contract transactions by this address
        const networkEnv = process.env.NEXT_PUBLIC_STACKS_NETWORK || "testnet";
        const apiBase = networkEnv === "mainnet"
          ? "https://api.hiro.so/extended/v1"
          : "https://api.testnet.hiro.so/extended/v1";
        // Get all smart_contract transactions
        const txRes = await axios.get(`${apiBase}/address/${address}/transactions?type=smart_contract&limit=50`);
        const txs = txRes.data?.results || [];
        console.log('Txs length:', txs.length);
        type SmartContractTx = {
          tx_type: string;
          smart_contract?: { contract_id?: string };
          contract_call?: unknown;
          contract_id?: string;
        };
        (txs as SmartContractTx[]).forEach((tx, idx) => {
          console.log(`TX[${idx}] smart_contract:`, tx.smart_contract);
        });
        // Filter for contract deployments (prefer tx.smart_contract.contract_id)
        const contracts = (txs as SmartContractTx[])
          .filter((tx) => tx.tx_type === 'smart_contract' && tx.contract_call === undefined && (tx.smart_contract?.contract_id || tx.contract_id))
          .map((tx) => {
            const cid = tx.smart_contract?.contract_id || tx.contract_id!;
            const [contractAddress, contractName] = cid.split('.');
            return { contractAddress, contractName };
          });

        // 2. For each contract, try to enumerate tokens
        const allTokens: Array<{ contractAddress: string, contractName: string, tokenId: number, tokenUri: string }> = [];
        for (const contract of contracts) {
          const { contractAddress, contractName } = contract;
          // Try to get last token id
          let lastTokenId = 0;
          try {
            const lastTokenIdCV = await fetchCallReadOnlyFunction({
              contractAddress,
              contractName,
              functionName: 'get-last-token-id',
              functionArgs: [],
              network: networkEnv === "mainnet" ? STACKS_MAINNET : STACKS_TESTNET,
              senderAddress: address,
            });
            const lastJson = cvToJSON(lastTokenIdCV);
            const parsed = extractOkUint(lastJson);
            lastTokenId = parsed ?? 0;
          } catch {}
          if (!lastTokenId || isNaN(lastTokenId)) continue;
          for (let tokenId = 1; tokenId <= lastTokenId; tokenId++) {
            try {
              const ownerCV = await fetchCallReadOnlyFunction({
                contractAddress,
                contractName,
                functionName: 'get-owner',
                functionArgs: [uintCV(tokenId)],
                network: networkEnv === "mainnet" ? STACKS_MAINNET : STACKS_TESTNET,
                senderAddress: address,
              });
              const ownerJson = cvToJSON(ownerCV);
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
              if (owner && owner === address) {
                // Get token URI
                let tokenUri = '';
                try {
                  const uriCV = await fetchCallReadOnlyFunction({
                    contractAddress,
                    contractName,
                    functionName: 'get-token-uri',
                    functionArgs: [uintCV(tokenId)],
                    network: networkEnv === "mainnet" ? STACKS_MAINNET : STACKS_TESTNET,
                    senderAddress: address,
                  });
                  const uriJson = cvToJSON(uriCV);
                  if (uriJson.value && uriJson.value.value && typeof uriJson.value.value.value === 'string') {
                    tokenUri = uriJson.value.value.value;
                  } else if (typeof uriJson.value === 'string') {
                    tokenUri = uriJson.value;
                  } else if (typeof uriJson.value?.value === 'string') {
                    tokenUri = uriJson.value.value;
                  }
                } catch {}
                allTokens.push({ contractAddress, contractName, tokenId, tokenUri });
              }
            } catch {}
          }
        }
        setMintedTokens(allTokens);
        // Fetch metadata for IPFS CIDs (not https links)
        const metadataPromises = allTokens.map(async (token) => {
          if (!token.tokenUri.startsWith('https')) {
            let cid = token.tokenUri;
            if (cid.startsWith('ipfs://')) {
              cid = cid.replace('ipfs://', '');
            }
            const url = `https://ipfs.io/ipfs/${cid}`;
            try {
              const res = await axios.get<TokenMetadata>(url, { timeout: 5000 });
              return { key: `${token.contractAddress}:${token.contractName}:${token.tokenId}`, metadata: res.data };
            } catch {
              return { key: `${token.contractAddress}:${token.contractName}:${token.tokenId}`, metadata: null };
            }
          }
          return { key: `${token.contractAddress}:${token.contractName}:${token.tokenId}`, metadata: null };
        });
        const metadatas = await Promise.all(metadataPromises);
        const metaMap: Record<string, TokenMetadata> = {};
        metadatas.forEach(({ key, metadata }) => {
          if (metadata) metaMap[key] = metadata;
        });
        setTokenMetadata(metaMap);
      } catch {
        setMintedTokens([]);
      }
      setLoading(false);
    };
    fetchMints();
  }, [address]);

  return (
    <div className="my-12 md:my-24 mx-auto w-full px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col items-center gap-6 md:gap-8 my-10 md:my-16" >
          {/* Avatar */}
          <div className="flex-shrink-0 mt-6 md:mt-8">
            <div className="bg-gradient-to-br from-[#111] to-[#333] rounded-full h-24 w-24 md:h-32 md:w-32 flex items-center justify-center overflow-hidden mx-auto">
            </div>
          </div>
          {/* Name, address */}
          <div className="flex flex-col items-center">
            <h1 className="title text-3xl md:text-4xl font-bold text-center">Profile</h1>
            <div className="title text-[#fff] mt-1 text-lg md:text-sm text-center break-all max-w-full px-2">{address}</div>
          </div>
        </div>
        {/* NFT grid for this address */}
        {loading && <p>Loading...</p>}
        {!loading && mintedTokens.length === 0 && address && (
          <p className='text-center'>
            No Minted Models yet. <Link href="/mint" className="text-blue-400 underline">Mint here</Link>
          </p>
        )}
      <MintedTokensGrid mintedTokens={mintedTokens} tokenMetadata={tokenMetadata} />
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
