// app/components/features/avatar/MintModal.tsx
'use client';

import { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from 'next/navigation';

import CenterPanel from './CenterPanel';

import { getModelFromDB } from '@/utils/IDB'; 

interface MintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MintModal: React.FC<MintModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [imageFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState<string>('');
  const [attributes, setAttributes] = useState<string>('');
  const [interoperabilityFormats, setInteroperabilityFormats] = useState<string>('');
  const [customizationData, setCustomizationData] = useState<string>('');
  const [edition, setEdition] = useState<string>('');
  const [royalties, setRoyalties] = useState<string>('');
  const [properties, setProperties] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [tokenURI, setTokenURI] = useState<string>('');
  const [soulbound, setSoulbound] = useState<boolean>(false);
  const [minting, setMinting] = useState<boolean>(false);
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [secondaryColor] = useState<string>('#ffffff');
  const [background] = useState<string>('#f5f5f5');
  const [modelUrl, setModelUrl] = useState<string | null>("/models/default.glb");
  const [lightIntensity] = useState<number>(11); 

  const router = useRouter();

  const contractAddress = "0x02EF301d55F89564b617419f32C5862BA7a98c3b";

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    //Load Model from IndexedDB
    const loadModelFromDB = async () => {
      const modelDataObj = await getModelFromDB('currentModel');
      if (modelDataObj && modelDataObj.modelData) {
          const blob = new Blob([modelDataObj.modelData], { type: 'model/gltf-binary' });
          const url = URL.createObjectURL(blob);
          setModelUrl(url);
          console.log("Model loaded from IndexedDB:", url);
      } else {
          setModelUrl("/models/default.glb");
          console.log("Default model loaded.");
      }
    };

    loadModelFromDB();
  }, []); 

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
      setModelFile(image);
    }
  };

  const handleMint = async () => {
    if (!sdk || !account) {
        setError("Please connect your wallet.");
        return;
    }

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
        formData.append('attributes', JSON.stringify(attributes ? attributes.split(',').map(attr => ({ trait_type: attr.trim() })) :[]));
        formData.append('interoperabilityFormats', JSON.stringify(interoperabilityFormats ? interoperabilityFormats.split(',').map(format => format.trim()) :[]));
        formData.append('customizationData', customizationData);
        formData.append('edition', edition);
        formData.append('royalties', royalties);
        formData.append('properties', properties);
        formData.append('location', location);
        formData.append('soulbound', soulbound.toString());

        const uploadRequest = await fetch("/api/files", {
            method: "POST",
            body: formData,
        });

        if (!uploadRequest.ok) {
            const errorData = await uploadRequest.json();
            const errorMessage = errorData.error || "Failed to upload file"; 
            setError(errorMessage); 
            throw new Error(errorMessage);
        }

        const signedUrl = await uploadRequest.json();
        console.log("Signed URL:", signedUrl);
        const tokenURI = signedUrl.tokenURI; 

        console.log("Token URI:", tokenURI);

        setTokenURI(tokenURI);

        if (!window.ethereum) {
          setError("Metamask is not available");
          alert("Metamask is not available");
          return;
        }        

        const provider = new ethers.BrowserProvider(window.ethereum);

        const signer = await provider.getSigner(account);
        const contract = new ethers.Contract(contractAddress, contractABI, signer);

        const mintingPrice = await contract.mintPrice();
        const tx = await contract.mintAvatar(account, tokenURI, soulbound, {
            value: mintingPrice,
        });

        setTransactionHash(tx.hash);
        await tx.wait();
        alert('Avatar minted successfully! Transaction Hash: ' + tx.hash);
        // onClose();
        router.push('/minted/'+tx.hash);
      } catch (e: unknown) {
        if (e instanceof Error) {
          console.error("Error:", e.message);
          setError(e.message);
        } else {
          console.error("Unknown error:", e);
          setError("An unexpected error occurred.");
        }
      }      
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Mint Avatar Modal"
      className="modal responsive-modal max-w-2/3 overflow-y-auto lg:mx-36"
      overlayClassName="modal-overlay"
    >
      <div>
        <CenterPanel
          background={background}
          secondaryColor={secondaryColor}
          modelUrl={modelUrl}
          lightIntensity={lightIntensity}
        />
      </div>
      <div className='overflow-y-auto'>
        <h2 className="text-xl font-semibold mb-4">Mint Avatar</h2>
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
              <Label htmlFor="modelFile">Upload 3D Model (.glb)</Label>
              <Input
                type="file"
                id="modelFile"
                accept=".glb,.gltf"
                onChange={handleModelFileChange}
              />
            </div>

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
          <Button type="button" variant="outline" onClick={onClose} className="mr-2">
            Cancel
          </Button>
          <Button onClick={handleMint} disabled={minting}>
            {minting ? 'Minting...' : 'Mint Avatar'}
          </Button>
        </div>
      </div>
      {tokenURI}
    </Modal>
  );
};

export default MintModal;