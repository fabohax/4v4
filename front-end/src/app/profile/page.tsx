'use client';

import {
  Container,
  SimpleGrid,
  VStack,
  Text,
  Center,
  Spinner,
  useToast,
  Link,
  Box,
  Image,
} from '@chakra-ui/react';
import { NftCard } from '@/components/marketplace/NftCard';
import { useNftHoldings, useGetTxId } from '@/hooks/useNftHoldings';
import { formatValue } from '@/lib/clarity-utils';
import { mintAvatar } from '@/lib/nft/operations';
import { useNetwork } from '@/lib/use-network';
import { useCurrentAddress } from '@/hooks/useCurrentAddress';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { useState, useEffect } from 'react';
import { shouldUseDirectCall, executeContractCall, openContractCall } from '@/lib/contract-utils';
import { useDevnetWallet } from '@/lib/devnet-wallet-context';
import { getExplorerLink } from '@/utils/explorer-links';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from 'next/navigation';

import CenterPanel from '@/components/features/avatar/CenterPanel';

import { getModelFromDB } from '@/utils/IDB'; 

export default function ProfilePage() {
  const [lastTxId, setLastTxId] = useState<string | null>(null);
  const currentAddress = useCurrentAddress();
  const network = useNetwork();
  const { currentWallet } = useDevnetWallet();
  const { data: nftHoldings, isLoading: nftHoldingsLoading } = useNftHoldings(currentAddress || '');
  const { data: txData } = useGetTxId(lastTxId || '');
  const toast = useToast();

  // Default placeholder values for testing
  const [name, setName] = useState<string>('Test Avatar');
  const [description, setDescription] = useState<string>('This is a test avatar for minting.');
  const [modelFile, setModelFile] = useState<File | null>(null); // File upload will still be required
  const [imageFile, setImageFile] = useState<File | null>(null); // Optional file upload
  const [externalUrl, setExternalUrl] = useState<string>('https://example.com');
  const [attributes, setAttributes] = useState<string>('{"style": "futuristic", "rarity": "Rare"}');
  const [interoperabilityFormats, setInteroperabilityFormats] = useState<string>('{"glb", "fbx"}');
  const [customizationData, setCustomizationData] = useState<string>('{"color": "blue", "accessory": "hat"}');
  const [edition, setEdition] = useState<string>('100');
  const [royalties, setRoyalties] = useState<string>('10%');
  const [properties, setProperties] = useState<string>('{"polygonCount": 5000}');
  const [location, setLocation] = useState<string>('lat: -12.72596, lon: -77.89962');
  const [tokenURI, setTokenURI] = useState<string>('');
  const [soulbound, setSoulbound] = useState<boolean>(false);
  const [minting, setMinting] = useState<boolean>(false);
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [secondaryColor] = useState<string>('#ffffff');
  const [background] = useState<string>('#f5f5f5');
  const [modelUrl, setModelUrl] = useState<string | null>('/models/default.glb');
  const [lightIntensity] = useState<number>(11);

  const router = useRouter();

  useEffect(() => {
    // @ts-ignore
    if (txData && txData.tx_status === 'success') {
      toast({
        title: 'Minting Confirmed',
        description: 'Your NFT has been minted successfully',
        status: 'success',
      });
      setLastTxId(null);
      // @ts-ignore
    } else if (txData && txData.tx_status === 'abort_by_response') {
      toast({
        title: 'Minting Failed',
        description: 'The transaction was aborted',
        status: 'error',
      });
      setLastTxId(null);
    }
  }, [txData, toast]);

  const handleMintNFT = async (metadataCid: string) => {
    if (!network || !currentAddress) {
      setError("Network or wallet not connected.");
      return;
    }
  
    try {
      const txOptions = mintAvatar(network, metadataCid); // Pass metadata CID
  
      if (shouldUseDirectCall()) {
        const { txid } = await executeContractCall(txOptions, currentWallet);
        setLastTxId(txid);
        toast({
          title: 'Minting Submitted',
          description: `Transaction broadcast with ID: ${txid}`,
          status: 'info',
        });
        return;
      }
  
      await openContractCall({
        ...txOptions,
        onFinish: (data) => {
          setLastTxId(data.txId);
          toast({
            title: 'Success',
            description: 'Minting submitted!',
            status: 'success',
          });
        },
        onCancel: () => {
          toast({
            title: 'Cancelled',
            description: 'Transaction was cancelled',
            status: 'info',
          });
        },
      });
    } catch (error) {
      console.error('Error minting NFT:', error);
      setError('Failed to mint NFT. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to mint NFT',
        status: 'error',
      });
    }
  };

  const handleModelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setModelFile(file);
        const url = URL.createObjectURL(file);
        setModelUrl(url);
    } else {
        if (!modelUrl) {
            setModelUrl("/models/default.glb");
        }
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const image = e.target.files?.[0];
    if (image) {
      setImageFile(image);
    }
  };

  const handleMint = async () => {
    if (!name || !description || !modelFile) {
      setError("Please fill in all the essential information and upload your model.");
      return;
    }
  
    setMinting(true);
    setError('');
    setTransactionHash('');
  
    try {
      const formData = new FormData();
      formData.append('file', modelFile);
      if (imageFile) {
        formData.append('imageFile', imageFile);
      }
      formData.append('name', name);
      formData.append('description', description);
      formData.append('externalUrl', externalUrl);
      formData.append('attributes', attributes);
      formData.append('interoperabilityFormats', interoperabilityFormats);
      formData.append('customizationData', customizationData);
      formData.append('edition', edition);
      formData.append('royalties', royalties);
      formData.append('properties', properties);
      formData.append('location', location);
      formData.append('soulbound', soulbound.toString());
  
      const metadataResponse = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });
  
      if (!metadataResponse.ok) {
        const errorData = await metadataResponse.json();
        const errorMessage = errorData.error || 'Failed to upload metadata to IPFS';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
  
      const { tokenURI } = await metadataResponse.json();
  
      console.log('Token URI:', tokenURI);
  
      // Call handleMintNFT with the token URI
      await handleMintNFT(tokenURI);
  
      alert('Avatar minted successfully!');
      router.push('/profile');
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.error('Error:', e.message);
        setError(e.message);
      } else {
        console.error('Unknown error:', e);
        setError('An unexpected error occurred.');
      }
    } finally {
      setMinting(false);
    }
  };

  if (!currentAddress) {
    return (
      <Center h="50vh">
        <Text>Please connect your wallet to view your NFTs</Text>
      </Center>
    );
  }

  if (nftHoldingsLoading) {
    return (
      <Center h="50vh">
        <Spinner />
      </Center>
    );
  }
  return (
    <Container maxW="container.xl" py={8}>
      
      <div>
        <div>
          <CenterPanel
            background={background}
            secondaryColor={secondaryColor}
            modelUrl={modelUrl}
            lightIntensity={lightIntensity}
          />
        </div>
        <div>
          <div className="my-4">
            <Label htmlFor="modelFile" className='text-center'>Upload 3D Model (.glb)</Label>
            <Input
              type="file"
              id="modelFile"
              accept=".glb,.gltf"
              onChange={handleModelFileChange}
            />
          </div>
        </div>
        <div className='overflow-y-auto'>
          {error && <p className="text-red-500 mb-2">{error}</p>}
          {transactionHash && <p className="text-green-500 mb-2">Transaction Hash: {transactionHash}</p>}
  
          <div className="mb-4">
            <Input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Avatar Name"
              className='px-3 py-6 rounded-xl'
            />
          </div>
  
          <div className="mb-4">
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Avatar Description"
              className='px-3 py-6 rounded-xl'
            />
          </div>
  
          <div className='grid lg:grid-cols-2 lg:space-x-4'>
            <div>  
              <div className="mb-4">
                <Label htmlFor="imageFile">Upload Cover Image *</Label>
                <Input
                  type="file"
                  id="imageFile"
                  accept="image/*"
                  onChange={handleImageFileChange}
                />
              </div>
  
              <div className="mb-4">
                <Label htmlFor="externalUrl">External URL *</Label>
                <Input
                  type="text"
                  id="externalUrl"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              
              <div className="mb-4">
                <Label htmlFor="attributes">Attributes (*, comma-separated)</Label>
                <Input
                  type="text"
                  id="attributes"
                  value={attributes}
                  onChange={(e) => setAttributes(e.target.value)}
                  placeholder="e.g., style: futuristic, rarity: Rare"
                />
              </div>
  
              <div className="mb-4">
                <Label htmlFor="interoperabilityFormats">Interoperability Formats (*, comma-separated)</Label>
                <Input
                  type="text"
                  id="interoperabilityFormats"
                  value={interoperabilityFormats}
                  onChange={(e) => setInteroperabilityFormats(e.target.value)}
                  placeholder="e.g., glb, fbx"
                />
              </div>
            </div>
            <div>
              <div className="mb-4">
                <Label htmlFor="customizationData">Customization Data (*, JSON)</Label>
                <Input
                  type="text"
                  id="customizationData"
                  value={customizationData}
                  onChange={(e) => setCustomizationData(e.target.value)}
                  placeholder='e.g., {"color": "blue", "accessory": "hat"}'
                />
              </div>
  
              <div className="mb-4">
                <Label htmlFor="edition">Edition (*)</Label>
                <Input
                  type="text"
                  id="edition"
                  value={edition}
                  onChange={(e) => setEdition(e.target.value)}
                  placeholder="e.g., 100"
                />
              </div>         
              <div className="mb-4">
                <Label htmlFor="royalties">Royalties (*)</Label>
                <Input
                  type="text"
                  id="royalties"
                  value={royalties}
                  onChange={(e) => setRoyalties(e.target.value)}
                  placeholder="e.g., 10%"
                />
              </div>
  
              <div className="mb-4">
                <Label htmlFor="properties">Properties (*, JSON)</Label>
                <Input
                  type="textarea"
                  id="properties"
                  value={properties}
                  onChange={(e) => setProperties(e.target.value)}
                  placeholder='e.g., {"polygonCount": 5000}'
                />
              </div>
  
              <div className="mb-4">
                <Label htmlFor="location">Location (*, comma-separated)</Label>
                <Input
                  type="text"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., lat: -12.72596, lon: -77.89962"
                />
              </div>
            </div>
            <div className="mb-4">
              <input
                type="checkbox"
                id="soulbound"
                checked={soulbound}
                onChange={(e) => setSoulbound(e.target.checked)}
                className="mr-2"
              />
              <Label htmlFor="soulbound">Soulbound (Non-transferable)</Label>
            </div>
            <span className='text-sm'>* Optional</span>
          </div>
          <div className="flex justify-end">
            <Button type="button" className="bg-white text-black hover:bg-white mr-2">
              Cancel
            </Button>
            <Button onClick={handleMint} disabled={minting} className='border-2 border-black'>
              {minting ? 'Minting...' : 'Mint Avatar'}
            </Button>
          </div>
        </div>
        {tokenURI}
        <VStack spacing={6} align="stretch" className='my-8'>
          <Text fontSize="2xl" fontWeight="bold">
            Models
          </Text>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          ...
        </SimpleGrid>
      </VStack>
      </div>
    </Container>
  );
}
