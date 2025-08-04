'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, Download, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import CenterPanel from '@/components/features/avatar/CenterPanel';

interface NFTMetadata {
  name: string;
  description: string;
  external_url: string;
  animation_url: string;
  image: string;
  attributes: Record<string, string | number>;
  properties: Record<string, string | number | boolean | null>;
  customizationData: unknown;
  interoperabilityFormats: string[];
  edition: string;
  royalties: string;
  location: unknown;
  soulbound: boolean;
}

export default function NFTViewerPage() {
  const params = useParams();
  const router = useRouter();
  const address = params.address as string;
  const contractName = params.contractName as string;
  
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [modelUrl, setModelUrl] = useState<string>('');

  useEffect(() => {
    const fetchNFTData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Try to fetch from an API endpoint that queries the contract
        const contractResponse = await fetch(`/api/nft/${address}/${contractName}`);
        if (contractResponse.ok) {
          const contractData = await contractResponse.json();
          if (contractData.success && contractData.metadataCid) {
            // Fetch metadata from IPFS using the CID and gateway URL from contract response
            const gatewayUrl = contractData.gatewayUrl || 'https://gateway.pinata.cloud';
            const metadataUrl = `${gatewayUrl}/ipfs/${contractData.metadataCid}`;
            
            const response = await fetch(metadataUrl);
            
            if (response.ok) {
              const nftData: NFTMetadata = await response.json();
              setMetadata(nftData);
              
              if (nftData.animation_url) {
                setModelUrl(nftData.animation_url);
              }
              return;
            }
          }
        }
        
        // If we get here, contract was not found or has no metadata
        setError('NFT contract not found or has no metadata available.');
        
      } catch (err) {
        console.error('Error fetching NFT data:', err);
        setError('Failed to load NFT data. Contract may not exist or be inaccessible.');
      } finally {
        setLoading(false);
      }
    };

    if (address && contractName) {
      fetchNFTData();
    }
  }, [address, contractName]);

  const downloadModel = () => {
    if (modelUrl) {
      window.open(modelUrl, '_blank');
    }
  };

  const shareNFT = async () => {
    const shareData = {
      title: metadata?.name || 'Check out this NFT!',
      text: metadata?.description || 'View this amazing 3D NFT',
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        navigator.clipboard.writeText(window.location.href);
        toast('Link copied to clipboard!');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen dotted-grid-background">
        <Card className='border-[#333] shadow-lg text-white bg-[#000] p-8'>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading NFT data...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !metadata) {
    return (
      <div className="flex items-center justify-center h-screen dotted-grid-background">
        <Card className='border-[#333] shadow-lg text-white bg-[#000] p-8 max-w-md'>
          <div className="text-center">
            <div className="text-3xl my-8">🚫</div>
            <h2 className="text-xl font-bold mb-4">NFT Not Found</h2>
            <p className="text-red-400 mb-4">{error || 'NFT contract not found'}</p>
            <p className="text-gray-400 text-sm mb-6 break-all">
              The contract {address}.{contractName} does not exist or has no accessible metadata.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => router.back()} 
                variant="outline" 
                className="w-full border-[#333]"
              >
                Go Back
              </Button>
              <Button 
                onClick={() => router.push('/')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen dotted-grid-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4 text-white hover:bg-[#111]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 my-16">
          {/* 3D Model Viewer */}
          <Card className='border-[#333] shadow-lg text-white bg-[#000]'>
            <CardContent className='p-0'>
              <div className="h-100vh rounded-lg overflow-hidden">
                {modelUrl ? (
                  <CenterPanel
                    background="#000000"
                    secondaryColor="#ffffff"
                    modelUrl={modelUrl}
                    lightIntensity={11}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-[#111] rounded-lg">
                    <p className="text-gray-400">No 3D model available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* NFT Details */}
          <div className="space-y-6">
            <Card className='border-[#333] shadow-lg text-white bg-[#000]'>
              <CardContent className='p-6'>
                <div className="flex items-center justify-between mb-4">
                  <CardTitle className="text-3xl font-bold" style={{ fontFamily: 'Chakra Petch, sans-serif' }}>
                    {metadata.name}
                  </CardTitle>
                  {metadata.soulbound && (
                    <Badge variant="outline" className="border-purple-500 text-purple-400">
                      Avatar NFT
                    </Badge>
                  )}
                </div>
                
                <p className="text-gray-300 text-lg mb-6">{metadata.description}</p>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <Button onClick={downloadModel} className="bg-blue-600 hover:bg-blue-700">
                    <Download className="mr-2 h-4 w-4" />
                    Download Model
                  </Button>
                  <Button onClick={shareNFT} variant="outline" className="border-[#333]">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share NFT
                  </Button>
                </div>

                {/* Contract Info */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Contract Details</h3>
                  <div className="bg-[#111] p-4 rounded-lg">
                    <p className="text-sm text-gray-400">Contract Name</p>
                    <code className="text-sm font-mono break-all">{contractName}</code>
                  </div>
                </div>

                {/* External URL */}
                {metadata.external_url && (
                  <div className="mb-6">
                    <Button 
                      onClick={() => window.open(metadata.external_url, '_blank')}
                      variant="outline" 
                      className="w-full border-[#333]"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Visit External URL
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attributes */}
            {metadata.attributes && Object.keys(metadata.attributes).length > 0 && (
              <Card className='border-[#333] shadow-lg text-white bg-[#000]'>
                <CardContent className='p-6'>
                  <h3 className="text-lg font-semibold mb-4">Attributes</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(metadata.attributes).map(([key, value]) => (
                      <div key={key} className="bg-[#111] p-3 rounded-lg">
                        <p className="text-sm text-gray-400 capitalize">{key}</p>
                        <p className="font-medium">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Technical Details */}
            <Card className='border-[#333] shadow-lg text-white bg-[#000]'>
              <CardContent className='p-6'>
                <h3 className="text-lg font-semibold mb-4">Technical Details</h3>
                <div className="space-y-4">
                  {metadata.edition && (
                    <div>
                      <p className="text-sm text-gray-400">Edition</p>
                      <p className="font-medium">{metadata.edition}</p>
                    </div>
                  )}
                  
                  {metadata.royalties && (
                    <div>
                      <p className="text-sm text-gray-400">Royalties</p>
                      <p className="font-medium">{metadata.royalties}</p>
                    </div>
                  )}

                  {metadata.interoperabilityFormats && metadata.interoperabilityFormats.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-400">Supported Formats</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {metadata.interoperabilityFormats.map((format, index) => (
                          <Badge key={index} variant="outline" className="border-[#333]">
                            {format}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {metadata.properties && Object.keys(metadata.properties).length > 0 && (
                    <div>
                      <p className="text-sm text-gray-400">Properties</p>
                      <div className="bg-[#111] p-3 rounded-lg mt-1">
                        {Object.entries(metadata.properties).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="capitalize">{key}:</span>
                            <span>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
