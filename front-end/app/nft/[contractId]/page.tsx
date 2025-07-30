'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, Copy, CheckCircle, Clock, Hash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";

export default function NFTPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const txid = params.contractId as string;
  const contractName = searchParams.get('contractName');
  const contractAddress = searchParams.get('contractAddress'); // Add this to get contract address
  
  const [copied, setCopied] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      toast(`${type} copied to clipboard!`);
      setTimeout(() => setCopied(''), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      toast('Failed to copy to clipboard');
    }
  };

  const openInExplorer = () => {
    window.open(`https://explorer.stacks.co/txid/${txid}?chain=testnet`, '_blank');
  };

  const shareNFT = async () => {
    const shareData = {
      title: 'Check out my new NFT!',
      text: `I just minted an NFT on Stacks blockchain! Contract: ${contractName}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        copyToClipboard(window.location.href, 'Share URL');
      }
    } else {
      copyToClipboard(window.location.href, 'Share URL');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen dotted-grid-background p-4 my-24">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header */}
        <Card className='border-[#333] shadow-lg text-white bg-[#000]'>
          <CardContent className='p-6'>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Button 
                  variant="ghost" 
                  onClick={() => router.push('/mint')}
                  className="mr-4 p-2 hover:bg-[#fff] cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle className="text-2xl font-bold" style={{ fontFamily: 'Chakra Petch, sans-serif' }}>
                    NFT Contract Deployed
                  </CardTitle>
                  <p className="text-gray-400 text-sm mt-1">
                    <Clock className="inline h-3 w-3 mr-1" />
                    {currentTime}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="border-green-500 text-green-400">
                <CheckCircle className="h-3 w-3 mr-1" />
                Confirmed
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Success Message */}
        <Card className='border-green-500/30 shadow-lg text-white bg-gradient-to-r from-green-900/20 to-emerald-900/20'>
          <CardContent className='p-6 text-center'>
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-green-400 mb-2">
              Congratulations!
            </h2>
            <p className="text-green-300 text-lg">
              Your 3D model NFT contract has been successfully deployed to the Stacks blockchain.
            </p>
          </CardContent>
        </Card>

        {/* Contract Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className='border-[#333] shadow-lg text-white bg-[#000]'>
            <CardContent className='p-6'>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Hash className="h-4 w-4 mr-2" />
                Transaction Details
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Transaction ID</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-3 bg-[#111] border border-[#333] rounded text-xs font-mono break-all">
                      {txid}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(txid, 'Transaction ID')}
                      className="border-[#333] hover:bg-[#111]"
                      disabled={copied === 'Transaction ID'}
                    >
                      {copied === 'Transaction ID' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {contractName && (
                  <div>
                    <label className="text-sm text-gray-400 block mb-2">Contract Name</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-3 bg-[#111] border border-[#333] rounded text-xs font-mono break-all">
                        {contractName}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(contractName, 'Contract Name')}
                        className="border-[#333] hover:bg-[#111]"
                        disabled={copied === 'Contract Name'}
                      >
                        {copied === 'Contract Name' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm text-gray-400 block mb-2">Network</label>
                  <Badge variant="outline" className="border-blue-500 text-blue-400">
                    Stacks Testnet
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border-[#333] shadow-lg text-white bg-[#000]'>
            <CardContent className='p-6'>
              <h3 className="text-lg font-semibold mb-4">Actions</h3>
              
              <div className="space-y-3">
                <Button 
                  onClick={openInExplorer}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View on Stacks Explorer
                </Button>
                
                <Button 
                  onClick={() => router.push(`/nft/${contractAddress || txid}/${contractName}`)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View NFT Details
                </Button>
                
                <Button 
                  onClick={shareNFT}
                  variant="outline"
                  className="w-full border-[#333] text-white hover:bg-[#fff] cursor-pointer"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Share NFT
                </Button>

                <Button 
                  onClick={() => router.push('/mint')}
                  variant="outline"
                  className="w-full border-[#333] text-white hover:bg-[#fff] cursor-pointer"
                >
                  Mint Another NFT
                </Button>

                <Button 
                  onClick={() => router.push('/')}
                  variant="ghost"
                  className="w-full text-gray-400 hover:bg-[#111] hover:text-white cursor-pointer"
                >
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* What's Next */}
        <Card className='border-[#333] shadow-lg text-white bg-[#000]'>
          <CardContent className='p-6'>
            <h3 className="text-lg font-semibold mb-4">What&apos;s Next?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium">Contract is Live</p>
                    <p className="text-xs text-gray-400">Your NFT contract is now deployed and active on the Stacks blockchain</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium">IPFS Storage</p>
                    <p className="text-xs text-gray-400">Your 3D model metadata is permanently stored on IPFS</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium">Blockchain Verified</p>
                    <p className="text-xs text-gray-400">Transaction is confirmed and immutable on Stacks</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium">Ready to Trade</p>
                    <p className="text-xs text-gray-400">Your NFT can now be transferred or traded using the contract</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
