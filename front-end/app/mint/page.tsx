'use client';

import { useCurrentAddress } from '@/hooks/useCurrentAddress';
import { useState } from 'react';
import { request } from '@stacks/connect';
import { stringAsciiCV } from '@stacks/transactions';
//import { useRouter } from 'next/navigation';

import CenterPanel from '@/components/features/avatar/CenterPanel';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { toast } from "sonner"
import { ChevronDown } from 'lucide-react';
import { getNftContract } from '@/constants/contracts';

export default function ProfilePage() {
  const currentAddress = useCurrentAddress();

  // Default placeholder values for testing
  const [name, setName] = useState<string>('Test Model Name');
  const [description, setDescription] = useState<string>('This is a test model description for minting.');
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
  const [background] = useState<string>('#212121');
  const [modelUrl, setModelUrl] = useState<string | null>('');
  const [lightIntensity] = useState<number>(11);
  const [lastTxId, setLastTxId] = useState<string>('');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);

  //const router = useRouter();

  const handleMintNFT = async (metadataCid: string) => {

    if (!currentAddress) {
      setError("Wallet not connected.");
      console.error("Wallet not connected.");
      return;
    }
  
    try {
      const contract = getNftContract();

      console.log('Raw Metadata CID:', metadataCid);

      const cl_metadataCid = stringAsciiCV(metadataCid.trim()); 
  
      const response = await request('stx_callContract', {
        contract: `${contract.contractAddress}.${contract.contractName}` as `${string}.${string}`,
        functionName: 'mint-public',
        functionArgs: [cl_metadataCid], 
        network: 'testnet',
      });

      console.log('Transaction Response:', response);

      setLastTxId(response.txid || '');
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
        const contentType = metadataResponse.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await metadataResponse.json();
          console.error('Server Error Response:', errorData);
          const errorMessage = errorData?.error || 'Failed to upload metadata to IPFS';
          setError(errorMessage);
          throw new Error(errorMessage);
        } else {
          const errorMessage = `Unexpected response from server: ${metadataResponse.statusText}`;
          setError(errorMessage);
          throw new Error(errorMessage);
        }
      }
  
      const contentType = metadataResponse.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const errorMessage = 'Invalid response format from server. Expected JSON.';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
  
      let responseData;
      try {
        responseData = await metadataResponse.json();
        console.log('Server Response Data:', responseData); // Log server response data
      } catch {
        const errorMessage = 'Failed to parse server response as JSON.';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
  
      if (!responseData || typeof responseData !== 'object' || !responseData.metadataCid) {
        console.error('Invalid Server Response:', responseData); // Log invalid server response
        const errorMessage = 'Invalid or missing metadata CID in server response.';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
  
      const sanitizedCid = responseData.metadataCid.trim(); // Use metadataCid and sanitize it
      console.log('Sanitized Metadata CID:', sanitizedCid);
  
      if (!sanitizedCid || typeof sanitizedCid !== 'string' || !sanitizedCid.trim()) {
        const errorMessage = 'Invalid metadata CID retrieved from server.';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
  
      await handleMintNFT(sanitizedCid);
  
      alert('Avatar minted successfully!');
      //router.push('/profile');
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.error('Error:', e.message);
        setError(e.message);
      } else if (typeof e === 'object') {
        console.error('Unknown error:', JSON.stringify(e));
        setError('An unexpected error occurred.');
      } else {
        console.error('Unknown error:', e);
        setError('An unexpected error occurred.');
      }
    } finally {
      setMinting(false);
    }
  };

  const toggleAdvancedOptions = () => {
    setShowAdvancedOptions((prev) => !prev);
  };

  if (!currentAddress) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Please connect your wallet to view your NFTs</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <Card className='border-[#333] shadow-md text-white bg-[#111] w-4/5 py-16'>
        <CardContent className='grid grid-cols-2 space-x-8 w-auto'>
          <div>
            <div>
              {!modelFile ? (
                <div className="flex flex-col h-[50vh] items-center justify-center border-1 border-dashed border-[#333] rounded-lg p-6">
                  <Label htmlFor="modelFile" className="text-[#777] mb-2">
                    Drag and drop model files here or click to upload
                  </Label>
                  <Input
                    type="file"
                    id="modelFile"
                    accept=".glb,.gltf"
                    onChange={handleModelFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="modelFile"
                    className="bg-[#fff] text-black px-4 py-2 rounded-md cursor-pointer hover:bg-[#333] hover:text-white hover:border-[#fff] select-none"
                  >
                    Browse files
                  </label>
                  <div className='text-center text-sm'>
                    <p className="text-[#777] mt-2">
                      Max Size: 300MB
                      <br/>
                      .glb, .gltf, .fbx
                    </p>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full">
                  <CenterPanel
                    background={background}
                    secondaryColor={secondaryColor}
                    modelUrl={modelUrl}
                    lightIntensity={lightIntensity}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="space-y-4 overflow-y-auto max-h-auto">
              <CardTitle className="hidden text-2xl font-bold">Mint</CardTitle>

            {error && <p className="text-red-500">{error}</p>}
            {transactionHash && <p className="text-green-500">Transaction Hash: {transactionHash}</p>}
            <div>
              <Label htmlFor="name" className='hidden mb-4'>Name</Label>
              <Input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className='border-[#333] p-6 text-lg'
              />
            </div>
            <div>
              <Label htmlFor="description" className='hidden mb-4'>Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Model Description"
                className='border-[#333] p-6 text-lg min-h-[210px]'
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='w-full justify-center flex text-center border-1 py-2 border-[#333] rounded-md select-none'>
                <Checkbox
                  id="soulbound"
                  checked={soulbound}
                  onCheckedChange={(checked) => setSoulbound(checked as boolean)}
                  className='mr-2'
                />
                <Label htmlFor="soulbound">Use as Avatar</Label>
              </div>
              <Button 
                className='border-1 border-[#333] cursor-pointer'
                onClick={toggleAdvancedOptions}
              ><ChevronDown /> {showAdvancedOptions ? 'Hide Advanced Options' : 'Advanced Options'}
              </Button>
            </div>
            {showAdvancedOptions && (
              <div>
                <div>
                  <Label htmlFor="imageFile" className='mb-2'>Upload Cover Image</Label>
                  <Input
                    type="file"
                    id="imageFile"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className='border-[#333] cursor-pointer'
                  />
                </div>
                <div>
                  <Label htmlFor="externalUrl" className='my-2'>External URL</Label>
                  <Input
                    type="text"
                    id="externalUrl"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://example.com"
                    className='border-[#333] p-6'
                  />
                </div>
                <div>
                  <Label htmlFor="attributes" className='my-2'>Attributes</Label>
                  <Input
                    type="text"
                    id="attributes"
                    value={attributes}
                    onChange={(e) => setAttributes(e.target.value)}
                    placeholder="e.g., style: futuristic, rarity: Rare"
                    className='border-[#333] p-6'
                  />
                </div>
                <div>
                  <Label htmlFor="interoperabilityFormats" className='my-2'>Interoperability Formats (comma-separated)</Label>
                  <Input
                    type="text"
                    id="interoperabilityFormats"
                    value={interoperabilityFormats}
                    onChange={(e) => setInteroperabilityFormats(e.target.value)}
                    placeholder="e.g., glb, fbx"
                    className='border-[#333] p-6'
                  />
                </div>
                <div>
                  <Label htmlFor="customizationData" className='my-2'>Customization Data (JSON)</Label>
                  <Input
                    type="text"
                    id="customizationData"
                    value={customizationData}
                    onChange={(e) => setCustomizationData(e.target.value)}
                    placeholder='e.g., {"color": "blue", "accessory": "hat"}'
                    className='border-[#333] p-6'
                  />
                </div>
                <div>
                  <Label htmlFor="edition" className='my-2'>Edition</Label>
                  <Input
                    type="text"
                    id="edition"
                    value={edition}
                    onChange={(e) => setEdition(e.target.value)}
                    placeholder="e.g., 100"
                    className='border-[#333] p-6'
                  />
                </div>
                <div>
                  <Label htmlFor="royalties" className='my-2'>Royalties</Label>
                  <Input
                    type="text"
                    id="royalties"
                    value={royalties}
                    onChange={(e) => setRoyalties(e.target.value)}
                    placeholder="e.g., 10%"
                    className='border-[#333] p-6'
                  />
                </div>
                <div>
                  <Label htmlFor="properties" className='my-2'>Properties</Label>
                  <Input
                    type="text"
                    id="properties"
                    value={properties}
                    onChange={(e) => setProperties(e.target.value)}
                    placeholder='e.g., {"polygonCount": 5000}'
                    className='border-[#333] p-6'
                  />
                </div>
                <div>
                  <Label htmlFor="location" className='my-2'>Location</Label>
                  <Input
                    type="text"
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., lat: -12.72596, lon: -77.89962"
                    className='border-[#333] p-6'
                  />
                </div>
              </div>
            )}
            <div className="justify-start">
              <Button onClick={handleMint} disabled={minting} className='w-full py-6 bg-white text-black hover:bg-[#f1f1f1] hover:text-black cursor-pointer'>
                {minting ? 'Minting...' : 'Mint'}
              </Button>
            </div>
            <div>
              {tokenURI} <br/> {lastTxId}
              </div>
          </div>
        </CardContent>
        
      </Card>
    </div>
  );
}
