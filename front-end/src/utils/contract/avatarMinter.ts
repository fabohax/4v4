// utils/contract/avatarMinter.ts
import { ethers } from 'ethers';
import AvatarMinterABI from '@/app/abi/AvatarMinterABI.json';

export const CONTRACT_ADDRESS = "0x02EF301d55F89564b617419f32C5862BA7a98c3b";

// ABI for the functions we need
export const CONTRACT_ABI = AvatarMinterABI.abi;

export interface AvatarAttribute {
  trait_type: string;
  value: string;
}

export interface AvatarMetadata {
  name: string;
  description: string;
  image: string;
  external_url: string;
  attributes: AvatarAttribute[];
  animation_url: string;
  creator: string;
  soulbound: boolean;
  timestamp: number;
}

const NEXT_PUBLIC_PINATA_GATEWAY_TOKEN = "WDVkPJAmXmW1nurA6sGfTrCC1SYW0fFAof8iFvqQCkiWL2Ku3thexOLpUv_JyEI8"; 

export async function getTokenMetadata(
  tokenId: string,
  provider: any
): Promise<AvatarMetadata | null> {
  try {
    console.log("Fetching metadata for tokenId:", tokenId);
    const ethersProvider = provider
      ? new ethers.BrowserProvider(provider)
      : new ethers.JsonRpcProvider("https://sepolia-rpc.scroll.io");

    // Create contract instance
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, ethersProvider);

    // Get token URI
    const uri = await contract.tokenURI(tokenId);
    console.log("Token URI:", uri);

    // Parse IPFS URI
    let ipfsUrl = uri;
    if (ipfsUrl.startsWith('ipfs://')) {
      ipfsUrl = ipfsUrl.replace('ipfs://', 'https://scarlet-charming-caterpillar-527.mypinata.cloud/ipfs/');
    }

    // Extract CID (Content Identifier)
    const cid = ipfsUrl.replace("https://scarlet-charming-caterpillar-527.mypinata.cloud/ipfs/", "");

    // Append the Pinata Gateway Token AFTER the CID
    ipfsUrl = `https://scarlet-charming-caterpillar-527.mypinata.cloud/ipfs/${cid}?pinataGatewayToken=${NEXT_PUBLIC_PINATA_GATEWAY_TOKEN}`;

    console.log("Fetching IPFS URL:", ipfsUrl);

    // Fetch metadata from IPFS
    const response = await fetch(ipfsUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("IPFS fetch failed:", response.status, errorText);
      return null;
    }

    const data = await response.json();
    console.log("Metadata:", data);

    return data;
  } catch (error: any) {
    console.error("Error fetching token metadata:", error);
    if (error.reason) {
      console.error("Revert reason:", error.reason);
    }
    return null;
  }
}

export async function getContractMetadata(
  provider: any
): Promise<{ totalSupply: number }> {
  try {
    const ethersProvider = provider
      ? new ethers.BrowserProvider(provider)
      : new ethers.JsonRpcProvider("https://sepolia-rpc.scroll.io");

    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, ethersProvider);

    const totalSupply = await contract.totalSupply();

    return {
      totalSupply: Number(totalSupply)
    };
  } catch (error) {
    console.error("Error fetching contract metadata:", error);
    return {
      totalSupply: 0
    };
  }
}

export function convertIpfsUrl(url: string): string {
  if (!url) return '';

  if (url.startsWith('ipfs://')) {
    const cid = url.replace("ipfs://", "");
    return `https://scarlet-charming-caterpillar-527.mypinata.cloud/ipfs/${cid}?pinataGatewayToken=${NEXT_PUBLIC_PINATA_GATEWAY_TOKEN}`;
  }

  return url;
}