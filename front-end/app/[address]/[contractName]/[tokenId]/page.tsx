'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { fetchCallReadOnlyFunction, uintCV, cvToJSON } from '@stacks/transactions';
import { STACKS_TESTNET, STACKS_MAINNET } from '@stacks/network';
import axios from 'axios';
import { ArrowLeft, ExternalLink, Download, Share2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type TokenMetadata = {
  name?: string;
  description?: string;
  image?: string;
  external_url?: string;
  animation_url?: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
  properties?: Record<string, unknown>;
  [key: string]: unknown;
};

export default function NFTDetailPage() {
  const params = useParams();
  const router = useRouter();
  const address = params.address as string;
  const contractName = params.contractName as string;
  const tokenId = params.tokenId as string;
  
  const [metadata, setMetadata] = useState<TokenMetadata | null>(null);
  const [owner, setOwner] = useState<string>('');
  const [tokenUri, setTokenUri] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchNFTData = async () => {
      try {
        setLoading(true);
        setError('');

        const networkEnv = process.env.NEXT_PUBLIC_STACKS_NETWORK || "testnet";
        const network = networkEnv === "mainnet" ? STACKS_MAINNET : STACKS_TESTNET;

        // Fetch owner
        try {
          const ownerCV = await fetchCallReadOnlyFunction({
            contractAddress: address,
            contractName,
            functionName: 'get-owner',
            functionArgs: [uintCV(parseInt(tokenId))],
            network,
            senderAddress: address,
          });
          const ownerJson = cvToJSON(ownerCV);
          let ownerAddr: string | undefined;
          if (
            ownerJson.value &&
            ownerJson.value.value &&
            typeof ownerJson.value.value.value === 'string'
          ) {
            ownerAddr = ownerJson.value.value.value;
          } else if (typeof ownerJson.value === 'string') {
            ownerAddr = ownerJson.value;
          } else if (typeof ownerJson.value?.value === 'string') {
            ownerAddr = ownerJson.value.value;
          }
          setOwner(ownerAddr || '');
        } catch (err) {
          console.log('Error fetching owner:', err);
        }

        // Fetch token URI
        try {
          const uriCV = await fetchCallReadOnlyFunction({
            contractAddress: address,
            contractName,
            functionName: 'get-token-uri',
            functionArgs: [uintCV(parseInt(tokenId))],
            network,
            senderAddress: address,
          });
          const uriJson = cvToJSON(uriCV);
          let uri = '';
          if (uriJson.value && uriJson.value.value && typeof uriJson.value.value.value === 'string') {
            uri = uriJson.value.value.value;
          } else if (typeof uriJson.value === 'string') {
            uri = uriJson.value;
          } else if (typeof uriJson.value?.value === 'string') {
            uri = uriJson.value.value;
          }
          setTokenUri(uri);

          // Fetch metadata if URI is available
          if (uri && !uri.startsWith('https')) {
            let cid = uri;
            if (cid.startsWith('ipfs://')) {
              cid = cid.replace('ipfs://', '');
            }
            const metadataUrl = `https://ipfs.io/ipfs/${cid}`;
            try {
              const res = await axios.get<TokenMetadata>(metadataUrl, { timeout: 10000 });
              setMetadata(res.data);
            } catch (err) {
              console.log('Error fetching metadata:', err);
              setError('Failed to load NFT metadata');
            }
          }
        } catch (err) {
          console.log('Error fetching token URI:', err);
          setError('Failed to load NFT data');
        }

      } catch (err) {
        console.log('Error in fetchNFTData:', err);
        setError('Failed to load NFT data');
      } finally {
        setLoading(false);
      }
    };

    if (address && contractName && tokenId) {
      fetchNFTData();
    }
  }, [address, contractName, tokenId]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const shareNFT = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: metadata?.name || 'NFT',
        text: metadata?.description || 'Check out this NFT',
        url: url,
      });
    } else {
      copyToClipboard(url, 'NFT URL');
    }
  };

  const downloadImage = () => {
    if (metadata?.image) {
      let imageUrl = metadata.image;
      if (imageUrl.startsWith('ipfs://')) {
        imageUrl = `https://ipfs.io/ipfs/${imageUrl.replace('ipfs://', '')}`;
      }
      // Normalize IPFS gateways
      imageUrl = imageUrl.replace('https://gateway.pinata.cloud/ipfs/', 'https://ipfs.io/ipfs/');
      imageUrl = imageUrl.replace('.mypinata.cloud/ipfs/', '://ipfs.io/ipfs/');
      
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `${metadata.name || 'nft'}-${tokenId}.jpg`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading NFT data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const imageUrl = (() => {
    if (!metadata?.image) return '/4V4-DIY.png';
    let img = metadata.image;
    if (img.startsWith('ipfs://')) {
      img = `https://ipfs.io/ipfs/${img.replace('ipfs://', '')}`;
    }
    // Normalize common IPFS gateways
    img = img.replace('https://gateway.pinata.cloud/ipfs/', 'https://ipfs.io/ipfs/');
    img = img.replace('.mypinata.cloud/ipfs/', '://ipfs.io/ipfs/');
    return img;
  })();

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-8">
          <Button onClick={() => router.back()} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{metadata?.name || `Token #${tokenId}`}</h1>
            <p className="text-gray-400 text-sm">
              <Link href={`/${address}`} className="hover:text-white">
                {address}
              </Link>
              {' / '}
              <span className="text-blue-400">{contractName}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="space-y-4">
            <Card className="bg-[#111] border-[#333]">
              <CardContent className="p-0">
                <div className="relative aspect-square">
                  <Image
                    src={imageUrl}
                    alt={metadata?.name || 'NFT Image'}
                    fill
                    className="object-cover rounded-lg"
                    unoptimized
                    onError={(e) => {
                      const imgEl = e.currentTarget as HTMLImageElement;
                      if (imgEl && imgEl.src !== window.location.origin + '/4V4-DIY.png') {
                        imgEl.src = '/4V4-DIY.png';
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={downloadImage} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button onClick={shareNFT} variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              {metadata?.external_url && (
                <Button asChild variant="outline" size="sm">
                  <a href={metadata.external_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    External
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            {/* Basic Info */}
            <Card className="bg-[#111] border-[#333]">
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">Description</label>
                  <p className="text-white">{metadata?.description || 'No description available'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Token ID</label>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-mono">#{tokenId}</p>
                      <Button
                        onClick={() => copyToClipboard(tokenId, 'Token ID')}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400">Owner</label>
                    <div className="flex items-center gap-2">
                      <Link 
                        href={`/${owner}`}
                        className="text-blue-400 hover:text-blue-300 font-mono text-sm truncate"
                      >
                        {owner ? `${owner.slice(0, 8)}...${owner.slice(-8)}` : 'Unknown'}
                      </Link>
                      {owner && (
                        <Button
                          onClick={() => copyToClipboard(owner, 'Owner address')}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400">Contract</label>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-mono text-sm">{address}.{contractName}</p>
                    <Button
                      onClick={() => copyToClipboard(`${address}.${contractName}`, 'Contract address')}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {tokenUri && (
                  <div>
                    <label className="text-sm text-gray-400">Token URI</label>
                    <div className="flex items-center gap-2">
                      <p className="text-blue-400 font-mono text-sm truncate">
                        {tokenUri.startsWith('ipfs://') ? `ipfs://${tokenUri.slice(7, 15)}...` : tokenUri}
                      </p>
                      <Button
                        onClick={() => copyToClipboard(tokenUri, 'Token URI')}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attributes */}
            {metadata?.attributes && metadata.attributes.length > 0 && (
              <Card className="bg-[#111] border-[#333]">
                <CardHeader>
                  <CardTitle>Attributes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {metadata.attributes.map((attr, index) => (
                      <div key={index} className="bg-[#222] rounded-lg p-3">
                        <p className="text-xs text-gray-400 uppercase">{attr.trait_type}</p>
                        <p className="text-white font-semibold">{attr.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Properties */}
            {metadata?.properties && Object.keys(metadata.properties).length > 0 && (
              <Card className="bg-[#111] border-[#333]">
                <CardHeader>
                  <CardTitle>Properties</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(metadata.properties).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <Badge variant="secondary">{String(value)}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
