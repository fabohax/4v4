'use client';

import { mintAvatar } from '@/lib/nft/operations';
import { useNetwork, NetworkDetails, Network } from '@/lib/use-network';
import { useCurrentAddress } from '@/hooks/useCurrentAddress';
import { useState } from 'react';
import { shouldUseDirectCall, executeContractCall, openContractCall } from '@/lib/contract-utils';
import { useRouter } from 'next/navigation';

import CenterPanel from '@/components/features/avatar/CenterPanel';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner"

export default function ProfilePage() {
  const currentAddress = useCurrentAddress();
  const network = useNetwork() as NetworkDetails;
  const currentWallet = currentAddress;

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
  const [tokenURI] = useState<string>('');
  const [soulbound, setSoulbound] = useState<boolean>(false);
  const [minting, setMinting] = useState<boolean>(false);
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [secondaryColor] = useState<string>('#ffffff');
  const [background] = useState<string>('#f5f5f5');
  const [modelUrl, setModelUrl] = useState<string | null>('/models/default.glb');
  const [lightIntensity] = useState<number>(11);
  const [lastTxId, setLastTxId] = useState<string>('');

  const router = useRouter();

  const handleMintNFT = async (metadataCid: string) => {
    if (!network || !currentAddress) {
      setError("Network or wallet not connected.");
      return;
    }
  
    try {
      const txOptions = mintAvatar(network as unknown as Network, metadataCid); // Ensure network matches the expected type
  
      if (shouldUseDirectCall()) {
        const wallet = currentWallet ? { mnemonic: currentWallet } : null;
        const { txid } = await executeContractCall(txOptions, wallet);
        setLastTxId(txid);
        toast("Minting Submitted");
        return;
      }
  
      await openContractCall({
        ...txOptions,
        onFinish: (data) => {
          setLastTxId(data.txId);
          toast('Minting submitted!');
        }
      });
    } catch (error) {
      console.error('Error minting NFT:', error);
      setError('Failed to mint NFT. Please try again.');
      toast('Failed to mint NFT');
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
      <div className="flex items-center justify-center h-screen">
        <p>Please connect your wallet to view your NFTs</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className='shadow-none mb-16'>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Mint your model</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <CenterPanel
              background={background}
              secondaryColor={secondaryColor}
              modelUrl={modelUrl}
              lightIntensity={lightIntensity}
            />
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="modelFile">Upload 3D Model (.glb)</Label>
              <Input
                type="file"
                id="modelFile"
                accept=".glb,.gltf"
                onChange={handleModelFileChange}
              />
            </div>
            {error && <p className="text-red-500">{error}</p>}
            {transactionHash && <p className="text-green-500">Transaction Hash: {transactionHash}</p>}
            <div>
              <Label htmlFor="name">Avatar Name</Label>
              <Input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Avatar Name"
              />
            </div>
            <div>
              <Label htmlFor="description">Avatar Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Avatar Description"
              />
            </div>
            <div>
              <Label htmlFor="imageFile">Upload Cover Image</Label>
              <Input
                type="file"
                id="imageFile"
                accept="image/*"
                onChange={handleImageFileChange}
              />
            </div>
            <div>
              <Label htmlFor="externalUrl">External URL</Label>
              <Input
                type="text"
                id="externalUrl"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <Label htmlFor="attributes">Attributes (comma-separated)</Label>
              <Input
                type="text"
                id="attributes"
                value={attributes}
                onChange={(e) => setAttributes(e.target.value)}
                placeholder="e.g., style: futuristic, rarity: Rare"
              />
            </div>
            <div>
              <Label htmlFor="interoperabilityFormats">Interoperability Formats (comma-separated)</Label>
              <Input
                type="text"
                id="interoperabilityFormats"
                value={interoperabilityFormats}
                onChange={(e) => setInteroperabilityFormats(e.target.value)}
                placeholder="e.g., glb, fbx"
              />
            </div>
            <div>
              <Label htmlFor="customizationData">Customization Data (JSON)</Label>
              <Input
                type="text"
                id="customizationData"
                value={customizationData}
                onChange={(e) => setCustomizationData(e.target.value)}
                placeholder='e.g., {"color": "blue", "accessory": "hat"}'
              />
            </div>
            <div>
              <Label htmlFor="edition">Edition</Label>
              <Input
                type="text"
                id="edition"
                value={edition}
                onChange={(e) => setEdition(e.target.value)}
                placeholder="e.g., 100"
              />
            </div>
            <div>
              <Label htmlFor="royalties">Royalties</Label>
              <Input
                type="text"
                id="royalties"
                value={royalties}
                onChange={(e) => setRoyalties(e.target.value)}
                placeholder="e.g., 10%"
              />
            </div>
            <div>
              <Label htmlFor="properties">Properties (JSON)</Label>
              <Input
                type="text"
                id="properties"
                value={properties}
                onChange={(e) => setProperties(e.target.value)}
                placeholder='e.g., {"polygonCount": 5000}'
              />
            </div>
            <div>
              <Label htmlFor="location">Location (comma-separated)</Label>
              <Input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., lat: -12.72596, lon: -77.89962"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="soulbound"
                checked={soulbound}
                onCheckedChange={(checked) => setSoulbound(checked as boolean)}
              />
              <Label htmlFor="soulbound">Soulbound (Non-transferable)</Label>
            </div>
            <div className="flex justify-end space-x-4">
              <Button onClick={handleMint} disabled={minting} className='w-1/2 px-6 py-3 cursor-pointer'>
                {minting ? 'Minting...' : 'Mint'}
              </Button>
            </div>
          </div>
        </CardContent>
        {tokenURI} <br/> {lastTxId}
      </Card>
    </div>
  );
}
