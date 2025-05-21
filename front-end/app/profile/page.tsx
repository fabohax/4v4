'use client';

import React, { useEffect, useState } from 'react';
import { useCurrentAddress } from '@/hooks/useCurrentAddress';
import { fetchCallReadOnlyFunction, uintCV } from '@stacks/transactions';
import { getNftContract } from '@/constants/contracts';
import { cvToValue, cvToJSON } from '@stacks/transactions';

const contract = getNftContract();
const CONTRACT_ADDRESS = contract.contractAddress;
const CONTRACT_NAME = contract.contractName;

export default function ProfilePage() {
  const address = useCurrentAddress();
  const [mintedTokens, setMintedTokens] = useState<{ tokenId: number, tokenUri: string }[]>([]);
  const [loading, setLoading] = useState(false);

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
        const lastTokenId = Number(cvToValue(lastTokenIdCV.value));
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
          // FIX: Extract the ClarityValue from the response
          const owner = cvToValue(ownerCV.value) as string;
          console.log(`Token ${tokenId} owner:`, owner, 'User address:', address);

          // Debug: print both addresses and their types
          if (owner && owner === address) {
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
            if (uriJson.type === 'some' && uriJson.value && typeof uriJson.value.data === 'string') {
              tokenUri = uriJson.value.data;
            }
            tokens.push({ tokenId, tokenUri });
          } else {
            console.log(`Token ${tokenId} is NOT owned by the user.`);
          }
        }
        setMintedTokens(tokens);
      } catch (err) {
        console.error('Error fetching mints:', err);
        setMintedTokens([]);
      }
      setLoading(false);
    };
    fetchMints();
  }, [address]);

  return (
    <div className='my-24 mx-auto max-w-2xl px-4'>
      <h1>Profile</h1>
      <p>Address: {address}</p>
      <p>Contract: {CONTRACT_ADDRESS}.{CONTRACT_NAME}</p>
      <h2>Your Minted NFTs</h2>No mints found.
      {!address && <p>Please connect your wallet.</p>}
      {loading && <p>Loading...</p>}
      {!loading && mintedTokens.length === 0 && address && <p>No mints found.</p>}
      <ul>
        {mintedTokens.map((mint) => (
          <li key={mint.tokenId}>
            Token ID: {mint.tokenId}
            <br />
            Token URI: <a href={mint.tokenUri} target="_blank" rel="noopener noreferrer">{mint.tokenUri}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}