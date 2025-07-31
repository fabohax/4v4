import { NextResponse, type NextRequest } from "next/server";
import fs from 'fs/promises';
import path from 'path';

interface DeployContractParams {
  contractName: string;
  nftName: string;
  initialCid: string;
  userAddress: string;
  network: 'testnet' | 'mainnet';
}

async function prepareContractCode(params: DeployContractParams) {
  try {
    console.log('> Preparing contract code...');
    console.log('> Parameters:', params);
    
    // Validate parameters
    if (!params.nftName || !params.initialCid) {
      throw new Error('Missing required parameters: nftName or initialCid');
    }
    
    // Read the template contract
    const templatePath = path.join(process.cwd(), 'contracts', 'xyz-nft.clar');
    console.log('> Reading template contract from:', templatePath);
    
    let contractCode = await fs.readFile(templatePath, 'utf-8');
    console.log('> Template contract loaded successfully');
    console.log('> Original template length:', contractCode.length, 'characters');
    
    // Validate and sanitize NFT name for Clarity
    const nftName = params.nftName
      .toUpperCase()
      .replace(/[^A-Z0-9_]/g, '_') // Only allow alphanumeric and underscores in NFT names
      .replace(/_+/g, '_') // Remove consecutive underscores
      .replace(/^_|_$/g, '') // Remove leading/trailing underscores
      .slice(0, 32); // Limit length for Clarity
    
    if (!nftName) {
      throw new Error('Invalid NFT name - must contain at least one alphanumeric character');
    }
    
    // Validate CID format (basic validation)
    const cidRegex = /^[a-zA-Z0-9]+$/;
    if (!cidRegex.test(params.initialCid)) {
      throw new Error('Invalid CID format - must be alphanumeric');
    }
    
    if (params.initialCid.length > 256) {
      throw new Error('CID too long - maximum 256 characters');
    }
    
    // Replace placeholders with actual values
    console.log('> Replacing template placeholders...');
    console.log('> NFT Name:', nftName);
    console.log('> Initial CID:', params.initialCid);
    
    contractCode = contractCode.replace(/{NFT_NAME}/g, nftName);
    contractCode = contractCode.replace(/{INITIAL_CID}/g, params.initialCid);
    
    console.log('> Placeholders replaced successfully');
    console.log('> Final contract length:', contractCode.length, 'characters');
    
    // Validate the final contract code doesn't have unreplaced placeholders
    if (contractCode.includes('{') || contractCode.includes('}')) {
      console.warn('> Warning: Contract code may contain unreplaced placeholders');
    }
    
    // Basic Clarity syntax validation - check for required elements
    if (!contractCode.includes('define-non-fungible-token')) {
      throw new Error('Invalid contract: missing NFT token definition');
    }
    
    return contractCode;
  } catch (error) {
    console.error('> Error preparing contract code:', error);
    throw error;
  }
}

function generateContractName(modelName: string): string {
  // Sanitize model name for contract naming - Stacks contracts must follow specific rules
  const sanitized = modelName
    .toLowerCase() // Contract names should be lowercase
    .replace(/[^a-z0-9]/g, '-') // Only allow alphanumeric and dashes
    .replace(/-+/g, '-') // Remove consecutive dashes
    .replace(/^-|-$/g, '') // Remove leading/trailing dashes
    .slice(0, 40); // Stacks contract names have length limits
  
  // Ensure it starts with a letter (Stacks requirement)
  const startsWithLetter = /^[a-z]/.test(sanitized);
  const prefix = startsWithLetter ? '' : 'nft-';
  
  // Use shorter timestamp for uniqueness (last 8 digits)
  const timestamp = Date.now().toString().slice(-8);
  
  const contractName = `${prefix}${sanitized}-${timestamp}`;
  
  // Ensure total length doesn't exceed Stacks limits (typically 128 chars)
  return contractName.slice(0, 120);
}

export async function POST(request: NextRequest) {
  try {
    console.log('Contract deployment API called');
    
    const body = await request.json();
    console.log('Request body received:', body);
    
    const { 
      modelName, 
      initialCid, 
      userAddress, 
      network = process.env.NEXT_PUBLIC_STACKS_NETWORK || 'testnet' 
    } = body;

    if (!modelName || !initialCid || !userAddress) {
      console.error('Missing required parameters');
      return NextResponse.json(
        { error: "Missing required parameters: modelName, initialCid, or userAddress" },
        { status: 400 }
      );
    }

    console.log('All required parameters provided');
    
    const contractName = generateContractName(modelName);
    const nftName = modelName.toUpperCase().replace(/[^A-Z0-9]/g, '-');
    
    console.log('Generated contract identifiers:');
    console.log('  - Contract Name:', contractName);
    console.log('  - NFT Name:', nftName);
    console.log('  - User Address:', userAddress);
    console.log('  - Network:', network);
    console.log('  - Initial CID:', initialCid);
    
    // Prepare contract code for client-side deployment
    const contractCode = await prepareContractCode({
      contractName,
      nftName,
      initialCid,
      userAddress,
      network
    });

    console.log('Contract code prepared successfully');
    console.log('=== FINAL CONTRACT CODE ===');
    console.log(contractCode);
    console.log('=== END CONTRACT CODE ===');

    // Validate contract code for Stacks Connect deployment
    if (!contractCode || typeof contractCode !== 'string') {
      throw new Error('Invalid contract code generated');
    }
    
    if (contractCode.length === 0) {
      throw new Error('Empty contract code - cannot deploy');
    }
    
    if (contractCode.length > 1000000) { // 1MB limit for Stacks
      throw new Error('Contract code too large - exceeds 1MB limit');
    }
    
    // Validate Clarity syntax basics
    if (!contractCode.includes('define-non-fungible-token')) {
      throw new Error('Invalid Clarity contract - missing NFT token definition');
    }
    
    if (contractCode.includes('{') || contractCode.includes('}')) {
      throw new Error('Contract contains unreplaced template placeholders');
    }
    
    // Prepare deployment data according to Stacks Connect openContractDeploy specification
    const deploymentData = {
      contractName,
      codeBody: contractCode, // This is the key field for Stacks Connect
      network: network === 'mainnet' ? 'mainnet' : 'testnet',
      fee: '10000', // Fee in microSTX
      postConditions: [],
      onFinish: (data: Record<string, unknown>) => {
        console.log('Contract deployment completed:', data);
      },
      onCancel: () => {
        console.log('Contract deployment cancelled by user');
      },
    };
    
    console.log('Deployment data prepared for Stacks Connect:');
    console.log('> Contract Name:', deploymentData.contractName);
    console.log('> Network:', deploymentData.network);
    console.log('> Code Body Length:', deploymentData.codeBody.length, 'characters');
    console.log('> Fee:', deploymentData.fee, 'microSTX');

    // Return contract details for client-side deployment via Stacks Connect
    return NextResponse.json({
      success: true,
      contractName,
      contractAddress: userAddress,
      contractCode,
      deploymentData, // Include the properly formatted deployment data
      requiresWalletSignature: true,
      message: 'Contract ready for deployment. User signature required.',
      validation: {
        codeLength: contractCode.length,
        hasNftDefinition: contractCode.includes('define-non-fungible-token'),
        noPlaceholders: !contractCode.includes('{') && !contractCode.includes('}'),
        contractNameValid: /^[a-z][a-z0-9-]*[a-z0-9]$/.test(contractName)
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error in deploy contract API:', error);
    
    let errorMessage = "Failed to prepare contract";
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}