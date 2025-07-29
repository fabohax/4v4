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

async function deployUserNFTContract(params: DeployContractParams) {
  try {
    console.log('>Starting contract deployment process...');
    console.log('>Deployment parameters:', params);
    
    // Read the template contract
    const templatePath = path.join(process.cwd(), 'contracts', 'xyz-nft.clar.template');
    console.log('> Reading template contract from:', templatePath);
    
    let contractCode = await fs.readFile(templatePath, 'utf-8');
    console.log('> Template contract loaded successfully');
    console.log('> Original template length:', contractCode.length, 'characters');
    
    // Replace placeholders with actual values
    console.log('> Replacing template placeholders...');
    contractCode = contractCode.replace(/{NFT_NAME}/g, params.nftName);
    contractCode = contractCode.replace(/{INITIAL_CID}/g, params.initialCid);
    console.log('> Placeholders replaced successfully');
    console.log('> Final contract length:', contractCode.length, 'characters');
    
    // For now, simulate deployment since we need proper private key setup for actual deployment
    console.log('> Simulating contract deployment to network:', params.network);
    console.log('> Contract name:', params.contractName);
    
    // Generate a mock transaction ID for testing
    const mockTxId = `0x${Math.random().toString(16).substr(2, 64)}`;
    
    const response = {
      success: true,
      txid: mockTxId,
      contractName: params.contractName,
      message: 'Contract deployment simulated successfully'
    };

    console.log('> Contract deployment response:', response);
    return response;
  } catch (error) {
    console.error('> Error deploying contract:', error);
    throw error;
  }
}

function generateContractName(modelName: string): string {
  // Sanitize model name for contract naming
  const sanitized = modelName
    .toUpperCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  // Use timestamp for uniqueness
  const timestamp = Date.now().toString();
  
  return `${timestamp}-${sanitized}`;
}

export async function POST(request: NextRequest) {
  try {
    console.log('Contract deployment API called');
    
    const body = await request.json();
    console.log('Request body received:', body);
    
    const { modelName, initialCid, userAddress, network = 'testnet' } = body;

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
    
    const deployResponse = await deployUserNFTContract({
      contractName,
      nftName,
      initialCid,
      userAddress,
      network
    });

    console.log('Contract deployment completed successfully');
    console.log('Final response data:', {
      success: true,
      contractName,
      txid: deployResponse?.txid
    });

    return NextResponse.json({
      success: true,
      contractName,
      txid: deployResponse?.txid,
      deployResponse
    }, { status: 200 });

  } catch (error) {
    console.error('Error in deploy contract API:', error);
    
    let errorMessage = "Failed to deploy contract";
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
