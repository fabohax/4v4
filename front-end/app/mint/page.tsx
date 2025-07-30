'use client';

import { useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HiroWalletContext } from '@/components/HiroWalletProvider';

import CenterPanel from '@/components/features/avatar/CenterPanel';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { toast } from "sonner"
import { ChevronDown, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { currentAddress, isWalletConnected } = useContext(HiroWalletContext);
  const router = useRouter();

  useEffect(() => {
    console.log('currentAddress:', currentAddress, 'isWalletConnected:', isWalletConnected);
  }, [currentAddress, isWalletConnected]);

  const [name, setName] = useState<string>('Test Model Name');
  const [description, setDescription] = useState<string>('This is a test model description for minting.');
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState<string>('https://example.com');
  const [attributes, setAttributes] = useState<string>('{"style": "futuristic", "rarity": "Rare"}');
  const [interoperabilityFormats, setInteroperabilityFormats] = useState<string>('{"glb", "fbx"}');
  const [customizationData, setCustomizationData] = useState<string>('{"color": "blue", "accessory": "hat"}');
  const [edition, setEdition] = useState<string>('100');
  const [royalties, setRoyalties] = useState<string>('10%');
  const [properties, setProperties] = useState<string>('{"polygonCount": 5000}');
  const [location, setLocation] = useState<string>('lat: -12.72596, lon: -77.89962');
  const [soulbound, setSoulbound] = useState<boolean>(false);
  const [minting, setMinting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [secondaryColor] = useState<string>('#ffffff');
  const [background] = useState<string>('#212121');
  const [modelUrl, setModelUrl] = useState<string | null>('');
  const [lightIntensity] = useState<number>(11);
  const [lastTxId, setLastTxId] = useState<string>('');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);

  const [deployingContract, setDeployingContract] = useState<boolean>(false);
  const [loadingState, setLoadingState] = useState<'idle' | 'uploading' | 'deploying' | 'minted'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [contractDeploymentStep, setContractDeploymentStep] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleModelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Add file size validation (300MB as mentioned in UI)
      if (file.size > 300 * 1024 * 1024) {
        setError("File size must be less than 300MB");
        return;
      }
      
      // Validate file type
      const validTypes = ['.glb', '.gltf', '.fbx'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!validTypes.includes(fileExtension)) {
        setError("Invalid file type. Please upload .glb, .gltf, or .fbx files");
        return;
      }
      
      setModelFile(file);
      const url = URL.createObjectURL(file);
      setModelUrl(url);
      setError(''); // Clear any previous errors
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

  // Enhanced validation function
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!name.trim()) {
      errors.name = 'Name is required';
    } else if (name.length > 50) {
      errors.name = 'Name must be less than 50 characters';
    }
    
    if (!description.trim()) {
      errors.description = 'Description is required';
    } else if (description.length > 500) {
      errors.description = 'Description must be less than 500 characters';
    }
    
    if (!modelFile) {
      errors.modelFile = 'Please upload a 3D model file';
    }
    
    if (!currentAddress) {
      errors.wallet = 'Please connect your wallet';
    }
    
    // Validate JSON fields
    try {
      JSON.parse(attributes);
    } catch {
      errors.attributes = 'Invalid JSON format';
    }
    
    try {
      JSON.parse(customizationData);
    } catch {
      errors.customizationData = 'Invalid JSON format';
    }
    
    try {
      JSON.parse(properties);
    } catch {
      errors.properties = 'Invalid JSON format';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const uploadWithProgress = async (formData: FormData) => {
    return new Promise<Response>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(new Response(xhr.response, {
            status: xhr.status,
            statusText: xhr.statusText,
            headers: new Headers(xhr.getAllResponseHeaders().split('\r\n').reduce((headers, line) => {
              const [key, value] = line.split(': ');
              if (key && value) headers[key] = value;
              return headers;
            }, {} as Record<string, string>))
          }));
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });
      
      xhr.addEventListener('error', () => reject(new Error('Upload failed')));
      xhr.addEventListener('timeout', () => reject(new Error('Upload timeout')));
      
      xhr.open('POST', '/api/files');
      xhr.timeout = 300000; // 5 minutes timeout
      xhr.send(formData);
    });
  };

  type DeployData = {
    modelName: string;
    initialCid: string;
    userAddress: string;
    network: string;
  };

  const deployContractWithRetry = async (deployData: DeployData, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        setContractDeploymentStep(`Deploying contract (attempt ${attempt}/${maxRetries})...`);
        setRetryCount(attempt - 1);
        
        const deployResponse = await fetch('/api/deploy-contract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(deployData),
          signal: AbortSignal.timeout(120000) // 2 minutes timeout
        });

        if (!deployResponse.ok) {
          const errorData = await deployResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `Deploy request failed with status ${deployResponse.status}`);
        }

        const result = await deployResponse.json();
        if (result.success) {
          return result;
        } else {
          throw new Error(result.error || 'Contract deployment failed');
        }
      } catch (error) {
        console.error(`Deploy attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        const waitTime = Math.pow(2, attempt) * 1000;
        setContractDeploymentStep(`Retrying in ${waitTime / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  };

  const handleMint = async () => {
    // Reset states
    setError('');
    setValidationErrors({});
    setUploadProgress(0);
    setContractDeploymentStep('');
    setRetryCount(0);

    // Validate form
    if (!validateForm()) {
      setError('Please fix the validation errors before proceeding.');
      return;
    }

    setMinting(true);
    setLoadingState('uploading');

    try {
      // Step 1: Upload to IPFS with progress
      const formData = new FormData();
      formData.append('file', modelFile!);
      if (imageFile) formData.append('imageFile', imageFile);
      
      // Add metadata
      const metadata = {
        name: name.trim(),
        description: description.trim(),
        externalUrl,
        attributes: JSON.parse(attributes),
        interoperabilityFormats,
        customizationData: JSON.parse(customizationData),
        edition,
        royalties,
        properties: JSON.parse(properties),
        location,
        soulbound
      };
      
      Object.entries(metadata).forEach(([key, value]) => {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      });

      console.log('Starting file upload to IPFS...');
      const metadataResponse = await uploadWithProgress(formData);

      if (!metadataResponse.ok) {
        const errorData = await metadataResponse.json().catch(() => ({}));
        throw new Error(errorData?.error || 'Failed to upload metadata to IPFS');
      }

      const responseData = await metadataResponse.json();
      const sanitizedCid = responseData.metadataCid?.trim();

      if (!sanitizedCid) {
        throw new Error('Invalid metadata CID retrieved from server');
      }

      console.log('Upload successful, CID:', sanitizedCid);

      // Step 2: Deploy contract with retry logic
      setLoadingState('deploying');
      setContractDeploymentStep('Preparing contract deployment...');

      const deployData = {
        modelName: name.trim(),
        initialCid: sanitizedCid,
        userAddress: currentAddress!, // non-null assertion since we already check for currentAddress above
        network: 'testnet'
      };

      const deployResult = await deployContractWithRetry(deployData);

      setLastTxId(deployResult.txid);
      setLoadingState('minted');
      setContractDeploymentStep('Contract deployed successfully!');

      toast.success('NFT Contract deployed successfully! Redirecting...');

      // Redirect to NFT page
      setTimeout(() => {
        router.push(`/${deployResult.contractAddress || currentAddress}/${deployResult.contractName}`);
      }, 2000);

    } catch (error) {
      console.error('Minting error:', error);
      
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Operation timed out. Please check your connection and try again.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('wallet')) {
          errorMessage = 'Wallet error. Please ensure your wallet is connected.';
        } else if (error.message.includes('CID') || error.message.includes('IPFS')) {
          errorMessage = 'Failed to upload to IPFS. Please try again.';
        } else if (error.message.includes('contract') || error.message.includes('deploy')) {
          errorMessage = 'Contract deployment failed. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      
    } finally {
      setMinting(false);
      setDeployingContract(false);
      setUploadProgress(0);
      
      // Reset loading state after delay unless redirecting
      if (loadingState !== 'minted') {
        setTimeout(() => setLoadingState('idle'), 3000);
      }
    }
  };

  const toggleAdvancedOptions = () => {
    setShowAdvancedOptions((prev) => !prev);
  };

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup object URL when component unmounts or modelUrl changes
      if (modelUrl && modelUrl.startsWith('blob:')) {
        URL.revokeObjectURL(modelUrl);
      }
    };
  }, [modelUrl]);

  const getLoadingText = () => {
    switch (loadingState) {
      case 'uploading':
        return uploadProgress > 0 ? `Uploading file to IPFS... ${uploadProgress}%` : 'Preparing upload...';
      case 'deploying':
        return contractDeploymentStep || 'Deploying contract...';
      case 'minted':
        return 'NFT minted successfully!';
      default:
        return '';
    }
  };

  if (!hydrated) {
    return null;
  }

  if (!currentAddress) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Please connect your wallet to mint your models</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen dotted-grid-background">
      <Card className='border-[#333] shadow-md text-white bg-[#000] w-4/5 py-8 mt-16'>
        <CardContent className='grid grid-cols-2 space-x-8 w-auto'>
          <div>
            <div>
              {!modelFile ? (
                <div className="flex flex-col h-[72vh] items-center justify-center border-1 border-dashed border-[#333] rounded-lg p-0">
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
              <CardTitle className="text-2xl font-bold" style={{ fontFamily: 'Chakra Petch, sans-serif' }}>
                Mint NFT
              </CardTitle>

            {error && (
              <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            
            {loadingState !== 'idle' && (
              <div className="p-4 bg-[#111] border border-[#333] rounded-lg">
                <div className="flex items-center mb-2">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="text-white text-sm">{getLoadingText()}</span>
                </div>
                
                {loadingState === 'uploading' && uploadProgress > 0 && (
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
                
                {loadingState === 'deploying' && retryCount > 0 && (
                  <p className="text-yellow-400 text-xs mt-1">
                    Retry attempt: {retryCount}
                  </p>
                )}
              </div>
            )}

            {/* Name field with validation */}
            <div>
              <Input
                type="text"
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (validationErrors.name) {
                    setValidationErrors(prev => ({ ...prev, name: '' }));
                  }
                }}
                placeholder="NFT Name *"
                className={`border-[#333] p-6 text-lg ${validationErrors.name ? 'border-red-500' : ''}`}
              />
              {validationErrors.name && (
                <p className="text-red-400 text-xs mt-1">{validationErrors.name}</p>
              )}
            </div>

            {/* Description field with validation */}
            <div>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (validationErrors.description) {
                    setValidationErrors(prev => ({ ...prev, description: '' }));
                  }
                }}
                placeholder="Model Description *"
                className={`border-[#333] p-6 text-lg min-h-[210px] ${validationErrors.description ? 'border-red-500' : ''}`}
              />
              {validationErrors.description && (
                <p className="text-red-400 text-xs mt-1">{validationErrors.description}</p>
              )}
              <p className="text-gray-400 text-xs mt-1">
                {description.length}/500 characters
              </p>
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
              <Button 
                onClick={handleMint} 
                disabled={minting || deployingContract || !currentAddress || !isWalletConnected} 
                className='w-full py-6 bg-white text-black hover:bg-[#f1f1f1] hover:text-black cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {!currentAddress ? 'Connect Wallet First' :
                 deployingContract ? 'Deploying Contract...' : 
                 minting ? 'Processing...' : 
                 'Deploy NFT Contract'}
              </Button>
            </div>

            {lastTxId && (
              <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                <p className="text-green-400 text-sm mb-2">Contract deployed successfully!</p>
                <p className="text-gray-300 text-xs">
                  Transaction ID: <code className="bg-gray-800 px-2 py-1 rounded">{lastTxId}</code>
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}