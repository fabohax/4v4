import { NextResponse, type NextRequest } from "next/server";
import { fetchCallReadOnlyFunction, cvToJSON, uintCV } from '@stacks/transactions';

async function getContractMetadata(
  contractAddress: string, 
  contractName: string, 
  network: 'testnet' | 'mainnet' = (process.env.NEXT_PUBLIC_STACKS_NETWORK as 'testnet' | 'mainnet') || 'testnet'
) {
  try {
    const stacksNetwork = network; // "testnet" or "mainnet"
    
    // Try to read the metadata-uri from the contract
    const options = {
      contractAddress,
      contractName,
      functionName: 'get-token-uri',
      functionArgs: [uintCV(1)], // Use token ID 1 as example
      senderAddress: contractAddress,
      network: stacksNetwork,
    };

    const result = await fetchCallReadOnlyFunction(options);
    const jsonResult = cvToJSON(result);

    return {
      success: true,
      metadataCid: jsonResult.value || null,
      rawResult: jsonResult
    };
  } catch (error) {
    console.error('Error reading contract metadata:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function checkContractExists(
  contractAddress: string, 
  contractName: string, 
  network: 'testnet' | 'mainnet'
) {
  try {
    const stacksNetwork = network; // "testnet" or "mainnet"
    
    // Try to call a basic function to check if contract exists
    const options = {
      contractAddress,
      contractName,
      functionName: 'get-last-token-id', // Common NFT function
      functionArgs: [],
      senderAddress: contractAddress,
      network: stacksNetwork,
    };

    await fetchCallReadOnlyFunction(options);
    return true;
  } catch (error) {
    console.error('Contract check failed:', error);
    return false;
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ contractAddress: string; contractName: string }> }
) {
  try {
    const { contractAddress, contractName } = await context.params;

    if (!contractAddress || !contractName) {
      return NextResponse.json(
        { error: "Contract address and contract name are required" },
        { status: 400 }
      );
    }

    console.log('Fetching NFT data for contract:', { contractAddress, contractName });

    // Get network from query parameters or default to env variable
    const url = new URL(request.url);
    const network = (url.searchParams.get('network') as 'testnet' | 'mainnet') || 
                   (process.env.NEXT_PUBLIC_STACKS_NETWORK as 'testnet' | 'mainnet') || 
                   'testnet';

    // Check if contract exists using direct contract call
    const contractExists = await checkContractExists(contractAddress, contractName, network);
    
    if (!contractExists) {
      return NextResponse.json({
        success: false,
        error: "Contract not found on blockchain",
        contractAddress,
        contractName,
        fullContractId: `${contractAddress}.${contractName}`,
      }, { status: 404 });
    }

    console.log('Contract found on blockchain');

    // Get metadata CID from contract
    const metadataResult = await getContractMetadata(contractAddress, contractName, network);
    
    if (metadataResult.success) {
      return NextResponse.json({
        success: true,
        contractAddress,
        contractName,
        fullContractId: `${contractAddress}.${contractName}`,
        metadataCid: metadataResult.metadataCid,
        network,
        message: "Successfully fetched contract metadata"
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        contractAddress,
        contractName,
        fullContractId: `${contractAddress}.${contractName}`,
        error: `Failed to read metadata from contract: ${metadataResult.error}`,
        network
      }, { status: 200 });
    }

  } catch (error) {
    console.error('Error fetching NFT data:', error);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch NFT data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}