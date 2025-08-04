'use client';

import { useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HiroWalletContext } from '@/components/HiroWalletProvider';
import { useDevnetWallet } from '@/components/DevnetWalletProvider';
import { 
  AnchorMode,
  PostConditionMode,
  makeContractDeploy,
  broadcastTransaction
} from '@stacks/transactions';
import { STACKS_TESTNET, STACKS_MAINNET } from '@stacks/network';
import { request } from '@stacks/connect';
import { validateAndGenerateWallet } from '@/lib/walletHelpers';
import { getApiUrl } from '@/lib/stacks-api';
import { forceSessionClear } from '@/lib/sessionUtils';
import { getPersistedNetwork } from '@/lib/network';

// Utility to detect wallet type
interface WindowWithWallets extends Window {
  XverseProviders?: { StacksProvider: unknown };
  LeatherProvider?: unknown;
  BitcoinProvider?: unknown; // Xverse also provides this
  StacksProvider?: unknown; // Hiro Wallet
}

const detectWalletType = () => {
  if (typeof window !== 'undefined') {
    const win = window as WindowWithWallets;
    
    // Check for Leather first (most specific check)
    if (win.LeatherProvider) {
      return 'leather';
    }
    
    // Check for Xverse via XverseProviders
    if (win.XverseProviders?.StacksProvider) {
      return 'xverse';
    }
    
    // Alternative Xverse check - BitcoinProvider without LeatherProvider
    if (win.BitcoinProvider && !win.LeatherProvider) {
      return 'xverse';
    }
    
    // Check for Hiro Wallet
    if (win.StacksProvider && !win.XverseProviders && !win.LeatherProvider && !win.BitcoinProvider) {
      return 'hiro';
    }
    
    // Generic Stacks wallet
    if (win.StacksProvider) {
      return 'unknown';
    }
  }
  
  return 'unknown';
};

// Enhanced wallet detection that also considers the connected address
const getWalletTypeFromContext = (effectiveAddress: string | null) => {
  const providerType = detectWalletType();
  
  // If we can't detect from providers, try to infer from user agent or other clues
  if (providerType === 'unknown' && effectiveAddress) {
    const userAgent = navigator.userAgent.toLowerCase();
    const win = window as WindowWithWallets & { xverse?: unknown };
    
    if (userAgent.includes('xverse') || win.xverse) {
      return 'xverse';
    }
  }
  
  return providerType;
};

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
  const { currentWallet } = useDevnetWallet();
  const router = useRouter();

  // Determine which wallet system is active - prioritize external wallet
  const isInternalWallet = !isWalletConnected && !!currentWallet;
  const effectiveAddress = isWalletConnected ? currentAddress : (currentWallet?.stxAddress || null);
  const isAnyWalletConnected = isWalletConnected || !!currentWallet;

  // Wallet status monitoring (minimal logging)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Wallet Status:', {
        effectiveAddress,
        isConnected: isAnyWalletConnected,
        walletType: isInternalWallet ? 'Internal' : 'External',
        network: getPersistedNetwork()
      });
    }
  }, [effectiveAddress, isAnyWalletConnected, isInternalWallet]);

  const [name, setName] = useState<string>('Test Model');
  const [description, setDescription] = useState<string>('This is a test model description for minting.');
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState<string>('https://4v4.xyz');
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
  const [loadingState, setLoadingState] = useState<'idle' | 'uploading' | 'deploying' | 'minted' | 'verifying'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [contractDeploymentStep, setContractDeploymentStep] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  // Add STX balance check
  const [stxBalance, setStxBalance] = useState<number | null>(null);
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [deploymentStatus, setDeploymentStatus] = useState<{
    txId?: string;
    contractAddress?: string;
    contractName?: string;
    verified?: boolean;
  }>({});

  // Check STX balance when address changes
  useEffect(() => {
    if (!effectiveAddress) {
      setStxBalance(null);
      return;
    }

    const checkBalance = async () => {
      setCheckingBalance(true);
      try {
        const currentNetwork = getPersistedNetwork();
        const baseUrl = getApiUrl(currentNetwork);
        
        const response = await fetch(`${baseUrl}/extended/v1/address/${effectiveAddress}/balances`);
        if (response.ok) {
          const data = await response.json();
          const balance = Number(data.stx.balance) / 1_000_000; // Convert from microSTX
          setStxBalance(balance);
        }
      } catch (error) {
        console.error('Error checking STX balance:', error);
      } finally {
        setCheckingBalance(false);
      }
    };

    checkBalance();
  }, [effectiveAddress]);

  // Pre-flight checks before minting
  const performPreflightChecks = () => {
    const errors: Record<string, string> = {};
    
    // Check STX balance (estimate 0.1 STX minimum for deployment fees)
    if (stxBalance !== null && stxBalance < 0.1) {
      errors.balance = 'Insufficient STX balance. You need at least 0.1 STX for transaction fees.';
    }
    
    return errors;
  };

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
    } else if (name.length > 23) {
      errors.name = 'Name must be 23 characters or less (allows space for timestamp suffix)';
    } else if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
      errors.name = 'Name can only contain letters, numbers, spaces, hyphens, and underscores';
    }
    
    if (!description.trim()) {
      errors.description = 'Description is required';
    } else if (description.length > 500) {
      errors.description = 'Description must be less than 500 characters';
    }
    
    if (!modelFile) {
      errors.modelFile = 'Please upload a 3D model file';
    } else {
      // Additional file validation
      const validExtensions = ['.glb', '.gltf', '.fbx'];
      const fileExtension = '.' + modelFile.name.split('.').pop()?.toLowerCase();
      if (!validExtensions.includes(fileExtension)) {
        errors.modelFile = 'Invalid file type. Please upload .glb, .gltf, or .fbx files';
      }
      if (modelFile.size > 300 * 1024 * 1024) {
        errors.modelFile = 'File size must be less than 300MB';
      }
    }
    
    if (!effectiveAddress) {
      errors.wallet = 'Please connect your wallet';
    }
    
    // Validate URL format
    if (externalUrl && !externalUrl.match(/^https?:\/\/.+/)) {
      errors.externalUrl = 'External URL must be a valid HTTP/HTTPS URL';
    }
    
    // Validate JSON fields with better error messages
    try {
      const parsedAttributes = JSON.parse(attributes);
      if (typeof parsedAttributes !== 'object' || Array.isArray(parsedAttributes)) {
        errors.attributes = 'Attributes must be a valid JSON object';
      }
    } catch {
      errors.attributes = 'Invalid JSON format in attributes field';
    }
    
    try {
      const parsedCustomization = JSON.parse(customizationData);
      if (typeof parsedCustomization !== 'object' || Array.isArray(parsedCustomization)) {
        errors.customizationData = 'Customization data must be a valid JSON object';
      }
    } catch {
      errors.customizationData = 'Invalid JSON format in customization data field';
    }
    
    try {
      const parsedProperties = JSON.parse(properties);
      if (typeof parsedProperties !== 'object' || Array.isArray(parsedProperties)) {
        errors.properties = 'Properties must be a valid JSON object';
      }
    } catch {
      errors.properties = 'Invalid JSON format in properties field';
    }
    
    // Validate edition is a positive number if provided
    if (edition && (isNaN(Number(edition)) || Number(edition) <= 0)) {
      errors.edition = 'Edition must be a positive number';
    }
    
    // Validate royalties format (should be a percentage)
    if (royalties && !royalties.match(/^\d+(\.\d+)?%?$/)) {
      errors.royalties = 'Royalties must be a valid percentage (e.g., "10%" or "5.5")';
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
    royalties?: string; // Optional royalty percentage string like "10%"
    edition?: string; // Optional edition size string like "100"
    description?: string; // Optional description
  };

  const deployContractWithWallet = async (contractCode: string, contractName: string) => {
    const currentNetwork = getPersistedNetwork();
    const walletType = getWalletTypeFromContext(effectiveAddress);
    
    // Check if wallet is properly connected before attempting deployment
    if (!effectiveAddress) {
      throw new Error('No wallet address available for deployment');
    }
    
    try {
      // Use the new request method with stx_deployContract
      const response = await request('stx_deployContract', {
        name: contractName,
        clarityCode: contractCode,
        clarityVersion: '2',
        network: currentNetwork,
      });
      
      const txId = response.txid;
      
      if (txId) {
        return {
          txId: txId,
          contractAddress: effectiveAddress,
          contractName: contractName
        };
      } else {
        throw new Error('No transaction ID returned from wallet');
      }
    } catch (error) {
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('User rejected') || error.message.includes('cancelled')) {
          throw new Error('User cancelled contract deployment');
        } else if (error.message.includes('timeout')) {
          throw new Error(`Wallet deployment timed out. Please ensure your ${walletType === 'xverse' ? 'Xverse' : walletType === 'leather' ? 'Leather' : 'Hiro'} wallet extension is unlocked and try again.`);
        }
      }
      
      throw error;
    }
  };

  // New function for internal wallet contract deployment
  const deployContractWithInternalWallet = async (contractCode: string, contractName: string, mnemonic: string) => {
    try {
      const currentNetwork = getPersistedNetwork();
      const network = currentNetwork === "mainnet" ? STACKS_MAINNET : STACKS_TESTNET;
      
      // Generate wallet from mnemonic
      const { privateKey, address } = await validateAndGenerateWallet(mnemonic);
      
      // Create contract deploy transaction
      const txOptions = {
        contractName,
        codeBody: contractCode,
        senderKey: privateKey,
        network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
        fee: BigInt(10000), // 0.01 STX fee
      };
      
      const transaction = await makeContractDeploy(txOptions);
      
      // Broadcast transaction  
      const broadcastResponse = await broadcastTransaction({ 
        transaction, 
        network 
      });
      
      if ('error' in broadcastResponse) {
        throw new Error(`Broadcast failed: ${broadcastResponse.error}`);
      }
      
      return {
        txId: broadcastResponse.txid,
        contractAddress: address,
        contractName
      };
      
    } catch (error) {
      console.error('Internal wallet deployment failed:', error);
      throw error;
    }
  };

  const deployContractWithRetry = async (deployData: DeployData, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        setContractDeploymentStep(`Preparing contract (attempt ${attempt}/${maxRetries})...`);
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
        
        // Validate API response structure
        if (!result.success) {
          throw new Error(result.error || 'Contract deployment preparation failed');
        }
        
        if (!result.contractCode || !result.contractName) {
          throw new Error('Invalid API response - missing contract data');
        }
        
        // Validate the deployment data if provided
        if (result.validation) {
          if (!result.validation.hasNftDefinition) {
            throw new Error('Invalid contract - missing NFT token definition');
          }
          
          if (!result.validation.noPlaceholders) {
            throw new Error('Contract contains unreplaced template placeholders. Please check the contract template and API logs.');
          }
          
          if (!result.validation.contractNameValid) {
            throw new Error('Generated contract name does not meet Stacks requirements');
          }
        }
        
        if (result.requiresWalletSignature) {
          setContractDeploymentStep('Waiting for wallet signature...');
          
          // Use the deploymentData if available, otherwise fallback to individual fields
          const currentNetwork = getPersistedNetwork();
          const deploymentConfig = result.deploymentData || {
            contractName: result.contractName,
            codeBody: result.contractCode,
            network: currentNetwork === "mainnet" ? STACKS_MAINNET : STACKS_TESTNET,
          };
          
          // Deploy contract using appropriate wallet method
          interface WalletDeployResponse {
            txId: string;
            contractAddress?: string;
            contractName?: string;
            [key: string]: unknown;
          }
          
          let walletResponse: WalletDeployResponse;
          
          if (isInternalWallet && currentWallet) {
            // Use internal wallet signing
            setContractDeploymentStep('Signing with internal wallet...');
            walletResponse = await deployContractWithInternalWallet(
              deploymentConfig.codeBody, 
              deploymentConfig.contractName,
              currentWallet.mnemonic
            );
          } else {
            // Use external wallet
            setContractDeploymentStep('Opening wallet extension for signature...');
            
            try {
              const externalResponse = await deployContractWithWallet(
                deploymentConfig.codeBody, 
                deploymentConfig.contractName
              ) as WalletDeployResponse;
              
              walletResponse = {
                txId: externalResponse.txId,
                contractAddress: deployData.userAddress,
                contractName: externalResponse.contractName || result.contractName
              };
            } catch (error) {
              if (error instanceof Error) {
                if (error.message.includes('timeout')) {
                  setContractDeploymentStep('Wallet signing timed out. Please check your wallet extension.');
                } else if (error.message.includes('cancelled')) {
                  setContractDeploymentStep('User cancelled wallet signing.');
                } else {
                  setContractDeploymentStep('Wallet signing failed. Please try again.');
                }
              }
              throw error; // Re-throw to be caught by the retry mechanism
            }
          }
          
          const deployResult = {
            success: true,
            txid: walletResponse.txId,
            contractAddress: walletResponse.contractAddress || deployData.userAddress,
            contractName: walletResponse.contractName || result.contractName
          };
          
          // Validate deployResult before returning
          if (!deployResult.contractName) {
            throw new Error('Contract deployment succeeded but contract name is missing from response');
          }
          
          // Update deployment status
          setDeploymentStatus(deployResult);
          
          return deployResult;
        } else if (result.success) {
          // Fallback for backwards compatibility
          if (!result.contractAddress || !result.contractName) {
            throw new Error('Invalid deployment response: missing contract address or name');
          }
          setDeploymentStatus(result);
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

  // Add transaction verification function
  const verifyTransaction = async (txId: string): Promise<boolean> => {
    if (!txId) return false;
    
    setLoadingState('verifying');
    setContractDeploymentStep('Verifying transaction on blockchain...');
    
    const currentNetwork = getPersistedNetwork();
    const baseUrl = getApiUrl(currentNetwork);
    
    // Poll for transaction confirmation (max 5 minutes)
    const maxAttempts = 30; // 30 attempts * 10 seconds = 5 minutes
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(`${baseUrl}/extended/v1/tx/${txId}`);
        if (response.ok) {
          const txData = await response.json();
          
          if (txData.tx_status === 'success') {
            setContractDeploymentStep('Transaction confirmed! Contract is live.');
            setDeploymentStatus(prev => ({ ...prev, verified: true }));
            return true;
          } else if (txData.tx_status === 'abort_by_response' || txData.tx_status === 'abort_by_post_condition') {
            throw new Error(`Transaction failed: ${txData.tx_status}`);
          }
          // If pending, continue polling
        }
        
        setContractDeploymentStep(`Waiting for confirmation... (${attempt}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        
      } catch (error) {
        console.error('Error verifying transaction:', error);
        if (attempt === maxAttempts) {
          // Don't fail the entire process if verification times out
          setContractDeploymentStep('Transaction submitted (verification timed out)');
          return false;
        }
      }
    }
    
    return false;
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

    // Perform preflight checks
    const preflightErrors = performPreflightChecks();
    if (Object.keys(preflightErrors).length > 0) {
      setValidationErrors(prev => ({ ...prev, ...preflightErrors }));
      setError('Please address the issues above before proceeding.');
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
        userAddress: effectiveAddress!,
        network: process.env.NEXT_PUBLIC_STACKS_NETWORK || 'testnet',
        royalties: royalties.trim(), // Pass royalties from form
        edition: edition.trim(), // Pass edition from form
        description: description.trim() // Pass description from form
      };

      const deployResult = await deployContractWithRetry(deployData);

      // Set txid if available
      if (deployResult.txid) {
        setLastTxId(deployResult.txid);
        
        // Verify transaction in background (optional)
        verifyTransaction(deployResult.txid).catch(error => {
          console.warn('Transaction verification failed:', error);
          // Don't block the flow if verification fails
        });
      }
      
      setLoadingState('minted');
      setContractDeploymentStep('Contract deployed successfully!');

      toast.success('NFT Contract deployed successfully! Redirecting...');

      // Redirect using contractAddress and contractName
      setTimeout(() => {
        const redirectPath = `/${deployResult.contractAddress}/${deployResult.contractName}`;
        router.push(redirectPath);
      }, 3000); // Increased delay to allow for verification

    } catch (error) {
      console.error('Minting error:', error);
      
      let errorMessage = 'An unexpected error occurred. Please try again.';
      let errorSuggestion = '';
      
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('AbortError')) {
          errorMessage = 'Operation timed out. This may be due to network congestion.';
          errorSuggestion = 'Please try again in a few minutes or check your internet connection.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error occurred while processing your request.';
          errorSuggestion = 'Please check your internet connection and try again.';
        } else if (error.message.includes('wallet') || error.message.includes('cancelled')) {
          errorMessage = 'Wallet operation was cancelled or failed.';
          errorSuggestion = 'Please ensure your wallet is unlocked and try again. Check that you have sufficient STX for transaction fees.';
        } else if (error.message.includes('CID') || error.message.includes('IPFS') || error.message.includes('upload')) {
          errorMessage = 'Failed to upload files to IPFS storage.';
          errorSuggestion = 'This might be a temporary issue with the storage service. Please try again.';
        } else if (error.message.includes('contract') || error.message.includes('deploy')) {
          errorMessage = 'Smart contract deployment failed.';
          errorSuggestion = 'This could be due to network congestion or insufficient funds. Please ensure you have enough STX and try again.';
        } else if (error.message.includes('validation') || error.message.includes('Invalid')) {
          errorMessage = 'Input validation failed.';
          errorSuggestion = 'Please check all fields for valid input and try again.';
        } else if (error.message.includes('file') || error.message.includes('size')) {
          errorMessage = 'File upload error.';
          errorSuggestion = 'Please ensure your file is under 300MB and in a supported format (.glb, .gltf, .fbx).';
        } else {
          errorMessage = error.message;
          errorSuggestion = 'If this issue persists, please contact support.';
        }
      }
      
      const fullErrorMessage = errorSuggestion 
        ? `${errorMessage} ${errorSuggestion}` 
        : errorMessage;
      
      setError(fullErrorMessage);
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
      case 'verifying':
        return contractDeploymentStep || 'Verifying transaction...';
      case 'minted':
        return 'NFT minted successfully!';
      default:
        return '';
    }
  };

  if (!hydrated) {
    return null;
  }

  if (!effectiveAddress) {
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

            {/* Balance display */}
            {effectiveAddress && (
              <div className="p-3 bg-[#111] border border-[#333] rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">STX Balance:</span>
                  <span className={`font-mono ${
                    checkingBalance ? 'text-gray-400' : 
                    stxBalance !== null && stxBalance < 0.1 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {checkingBalance ? 'Checking...' : 
                     stxBalance !== null ? `${stxBalance.toFixed(6)} STX` : 'Unable to load'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-gray-500">Wallet Type:</span>
                  <span className="text-blue-400">
                    {isInternalWallet ? `Internal (${currentWallet?.label})` : 
                     getWalletTypeFromContext(effectiveAddress).charAt(0).toUpperCase() + 
                     getWalletTypeFromContext(effectiveAddress).slice(1) + ' Extension'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-gray-500">Network:</span>
                  <span className="text-green-400 capitalize">
                    {getPersistedNetwork()}
                  </span>
                </div>
                {stxBalance !== null && stxBalance < 0.1 && (
                  <p className="text-red-400 text-xs mt-1">
                    Low balance! You may need more STX for transaction fees.
                  </p>
                )}
                
                {/* Troubleshooting section for wallet issues */}
                {!isInternalWallet && (
                  <div className="mt-3 pt-3 border-t border-[#333]">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-xs">Wallet Issues?</span>
                      <Button
                        onClick={() => {
                          console.log('Clearing all wallet sessions...');
                          forceSessionClear();
                        }}
                        variant="outline"
                        size="sm"
                        className="text-xs h-6 px-2 text-gray-400 border-gray-600 hover:text-white hover:border-gray-400"
                      >
                        Clear Sessions
                      </Button>
                    </div>
                    <p className="text-gray-500 text-xs mt-1">
                      Use if wallet shows wrong network or stale data
                    </p>
                    <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-800 rounded">
                      <p>Detected: {getWalletTypeFromContext(effectiveAddress)}</p>
                      <p className="text-gray-600">If wrong, try disconnecting and reconnecting your wallet</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {loadingState !== 'idle' && (
              <div className="p-4 bg-[#111] border border-[#333] rounded-lg">
                <div className="flex items-center mb-3">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="text-white text-sm font-medium">{getLoadingText()}</span>
                </div>
                
                {/* Progress indicators */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center text-xs">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      loadingState === 'uploading' ? 'bg-blue-400 animate-pulse' : 
                      ['deploying', 'verifying', 'minted'].includes(loadingState) ? 'bg-green-400' : 'bg-gray-500'
                    }`} />
                    <span className={loadingState === 'uploading' ? 'text-blue-400' : 
                                   ['deploying', 'verifying', 'minted'].includes(loadingState) ? 'text-green-400' : 'text-gray-400'}>
                      Upload to IPFS
                    </span>
                  </div>
                  <div className="flex items-center text-xs">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      loadingState === 'deploying' ? 'bg-blue-400 animate-pulse' : 
                      ['verifying', 'minted'].includes(loadingState) ? 'bg-green-400' : 'bg-gray-500'
                    }`} />
                    <span className={loadingState === 'deploying' ? 'text-blue-400' : 
                                   ['verifying', 'minted'].includes(loadingState) ? 'text-green-400' : 'text-gray-400'}>
                      Deploy Contract
                    </span>
                  </div>
                  <div className="flex items-center text-xs">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      loadingState === 'verifying' ? 'bg-blue-400 animate-pulse' : 
                      loadingState === 'minted' ? 'bg-green-400' : 'bg-gray-500'
                    }`} />
                    <span className={loadingState === 'verifying' ? 'text-blue-400' : 
                                   loadingState === 'minted' ? 'text-green-400' : 'text-gray-400'}>
                      Verify Transaction
                    </span>
                  </div>
                </div>
                
                {loadingState === 'uploading' && uploadProgress > 0 && (
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
                
                {loadingState === 'deploying' && retryCount > 0 && (
                  <p className="text-yellow-400 text-xs">
                    Retry attempt: {retryCount}
                  </p>
                )}
                
                {deploymentStatus.txId && (
                  <div className="mt-2 p-2 bg-[#222] rounded text-xs">
                    <p className="text-gray-400 mb-1">Transaction ID:</p>
                    <code className="text-green-400 break-all">{deploymentStatus.txId}</code>
                  </div>
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
                maxLength={23}
              />
              {validationErrors.name && (
                <p className="text-red-400 text-xs mt-1">{validationErrors.name}</p>
              )}
              <p className="text-gray-400 text-xs mt-1">
                {name.length}/23 characters (final contract name: ~{name.length + 9} chars)
              </p>
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
            <div className="justify-start space-y-3">
              <Button 
                onClick={handleMint} 
                disabled={minting || deployingContract || !effectiveAddress || !isAnyWalletConnected} 
                className='w-full py-6 bg-white text-black hover:bg-[#f1f1f1] hover:text-black cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {!effectiveAddress ? 'Connect Wallet First' :
                 deployingContract ? 'Deploying Contract...' : 
                 minting ? 'Processing...' : 
                 'Deploy NFT Contract'}
              </Button>
              
              {(minting || deployingContract) && loadingState !== 'minted' && (
                <Button 
                  onClick={() => {
                    setMinting(false);
                    setDeployingContract(false);
                    setLoadingState('idle');
                    setUploadProgress(0);
                    setContractDeploymentStep('');
                    setError('Operation cancelled by user');
                    toast.error('Minting process cancelled');
                  }}
                  variant="outline"
                  className='w-full py-3 border-red-500 text-red-400 hover:bg-red-900/20'
                >
                  Cancel Process
                </Button>
              )}
            </div>

            {lastTxId && (
              <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                <p className="text-green-400 text-sm mb-2">Contract deployed successfully!</p>
                <p className="text-gray-300 text-xs">
                  Transaction ID: <code className="bg-gray-800 px-2 py-1 rounded text-xs break-all">{lastTxId}</code>
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}