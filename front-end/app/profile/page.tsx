'use client';

import React, { useEffect, useState } from 'react';
import { useCurrentAddress } from '@/hooks/useCurrentAddress';
import { fetchCallReadOnlyFunction, uintCV } from '@stacks/transactions';
import { getNftContract } from '@/constants/contracts';
import { cvToValue, cvToJSON } from '@stacks/transactions';
import axios from 'axios';

const contract = getNftContract();
const CONTRACT_ADDRESS = contract.contractAddress;
const CONTRACT_NAME = contract.contractName;

export default function ProfilePage() {
  const address = useCurrentAddress();
  const [mintedTokens, setMintedTokens] = useState<{ tokenId: number, tokenUri: string }[]>([]);
  const [tokenMetadata, setTokenMetadata] = useState<Record<number, any>>({});
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

          // Unwrap the .value.value before passing to cvToJSON
          const ownerJson = cvToJSON(ownerCV.value.value);
          const owner = ownerJson.value;
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
              const res = await axios.get(url, { timeout: 5000 });
              return { tokenId: token.tokenId, metadata: res.data };
            } catch (e) {
              return { tokenId: token.tokenId, metadata: null };
            }
          }
          return { tokenId: token.tokenId, metadata: null };
        });

        const metadatas = await Promise.all(metadataPromises);
        const metaMap: Record<number, any> = {};
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
    <div className='my-24 mx-auto max-w-2xl px-4'>
      <h1 className='my-8'>Profile</h1>
      <p className='my-8 text-sm'>{address}</p>
      <h2 className='font-bold my-8'>Your Minted NFTs</h2>
      {!address && <p>Please connect your wallet.</p>}
      {loading && <p>Loading...</p>}
      {!loading && mintedTokens.length === 0 && address && <p>No mints found.</p>}
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
                        <img
                          src={
                            tokenMetadata[mint.tokenId].image.startsWith('ipfs://')
                              ? `https://ipfs.io/ipfs/${tokenMetadata[mint.tokenId].image.replace('ipfs://', '')}`
                              : tokenMetadata[mint.tokenId].image
                          }
                          alt={tokenMetadata[mint.tokenId].name || 'NFT image'}
                          style={{ maxWidth: 200, marginTop: 8 }}
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