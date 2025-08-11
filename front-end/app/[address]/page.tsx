'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useCurrentAddress } from '@/hooks/useCurrentAddress';
import { fetchCallReadOnlyFunction, uintCV } from '@stacks/transactions';
import { cvToValue, cvToJSON } from '@stacks/transactions';
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
        console.log('Fetched smart_contract txs:', txs);
        // Filter for contract deployments
        type SmartContractTx = {
          tx_type: string;
          contract_call?: unknown;
          contract_id?: string;
        };
        txs.forEach((tx, idx) => {
          console.log(`Tx[${idx}]`, tx);
          if (tx.tx_type === 'smart_contract') {
            console.log(`Tx[${idx}] smart_contract:`, tx.smart_contract);
          }
        });
        // Try to extract contract info from smart_contract property
        const contracts = txs
          .filter((tx) => tx.tx_type === 'smart_contract' && tx.smart_contract && tx.smart_contract.contract_id)
          .map((tx) => ({
            contractAddress: tx.smart_contract.contract_id.split('.')[0],
            contractName: tx.smart_contract.contract_id.split('.')[1],
          }));
        console.log('Filtered contracts:', contracts);

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
            console.log(`Raw get-last-token-id response for ${contractAddress}.${contractName}:`, lastTokenIdCV);
            // Hiro API returns { type: 'ok', value: { type: 'uint', value: <number> } }
            if (lastTokenIdCV && lastTokenIdCV.type === 'ok' && lastTokenIdCV.value && lastTokenIdCV.value.type === 'uint') {
              lastTokenId = Number(lastTokenIdCV.value.value);
            } else {
              lastTokenId = 0;
            }
            console.log(`Contract ${contractAddress}.${contractName} lastTokenId:`, lastTokenId);
          } catch (err) {
            console.log(`Error fetching lastTokenId for ${contractAddress}.${contractName}:`, err);
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
          <div className='mx-auto my-8 bg-[#333] rounded-full h-20 w-20 md:h-24 md:w-24'>
            <User className='mx-auto h-20 md:h-24 text-[#777]'/>
          </div>
        </div>
        <h2 className='text-2xl md:text-4xl mt-6 md:mt-8'>_</h2>
        <p className='mt-3 md:mt-4 mb-6 md:mb-8 text-sm text-[#777]'>{address}</p>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mt-8 md:mt-12">
        {mintedTokens.map((mint) => (
          <div key={mint.tokenId} className="bg-gray-900 rounded-xl p-4 border border-gray-800 shadow">
            <div className="font-bold text-base md:text-lg mb-2">Token #{mint.tokenId}</div>
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
        // Filter for contract deployments
        type SmartContractTx = {
          tx_type: string;
          contract_call?: unknown;
          contract_id?: string;
        };
        const contracts = (txs as SmartContractTx[])
          .filter((tx) => tx.tx_type === 'smart_contract' && tx.contract_call === undefined && tx.contract_id)
          .map((tx) => ({
            contractAddress: tx.contract_id!.split('.')[0],
            contractName: tx.contract_id!.split('.')[1],
          }));

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
            lastTokenId = Number(cvToValue(lastTokenIdCV));
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
            <div className="text-[#aaa] mt-1 text-xs md:text-sm text-center break-all max-w-full px-2">{address}</div>
          </div>
        </div>
        {/* NFT grid for this address */}
        {loading && <p>Loading...</p>}
        {!loading && mintedTokens.length === 0 && address && (
          <p className='text-center'>
            No Minted Models yet. <Link href="/mint" className="text-blue-400 underline">Mint here</Link>
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 mt-6 md:mt-8">
          {mintedTokens.map((mint) => {
            const metaKey = `${mint.contractAddress}:${mint.contractName}:${mint.tokenId}`;
            const meta = tokenMetadata[metaKey];
            return (
              <div key={metaKey} className="bg-[#111] rounded-xl w-full aspect-square p-4 border border-gray-800 shadow flex flex-col justify-between">
                <div>
                  <div className="font-bold text-base md:text-lg mb-2">Token #{mint.tokenId}</div>
                  <div className="text-xs text-gray-400 mb-2">Contract: <span className="break-all">{mint.contractName}</span></div>
                  {meta?.image ? (
                    <Image
                      src={(() => {
                        const img = meta?.image as string;
                        if (!img) return '/4V4-DIY.png';
                        if (img.startsWith('ipfs://')) {
                          return `https://ipfs.io/ipfs/${img.replace('ipfs://', '')}`;
                        }
                        return img;
                      })()}
                      alt={meta?.name || 'NFT Image'}
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
                    <div className="font-semibold">{meta?.name || 'Unnamed NFT'}</div>
                    <div className="text-xs text-gray-400 mb-2">{meta?.description}</div>
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
              </div>
            );
          })}
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
