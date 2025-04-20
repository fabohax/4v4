import { isDevnetEnvironment, isTestnetEnvironment } from '@/lib/use-network';
import { Network } from '@/lib/network';
export const getNftContractAddress = (network: Network) => {
  if (isDevnetEnvironment()) {
    return (
      process.env.NEXT_PUBLIC_DEPLOYER_ACCOUNT_ADDRESS ||
      'ST3ZFT624V70VXEYAZ51VPKRHXSEQRT6PA51T2SPS'
    );
  }
  if (isTestnetEnvironment(network)) {
    // return 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    return 'ST3ZFT624V70VXEYAZ51VPKRHXSEQRT6PA51T2SPS';
  }
  // Mainnet address
  return 'SP3ZFT624V70VXEYAZ51VPKRHXSEQRT6PA51T2SPS';
};

export const getNftContract = (network: Network) => {
  return {
    contractAddress: getNftContractAddress(network),
    contractName: 'avatar-minter',
  } as const;
};

export const getMarketplaceContractAddress = (network: Network) => {
  if (isDevnetEnvironment()) {
    return (
      process.env.NEXT_PUBLIC_DEPLOYER_ACCOUNT_ADDRESS ||
      'ST3ZFT624V70VXEYAZ51VPKRHXSEQRT6PA51T2SPS'
    );
  }
  if (isTestnetEnvironment(network)) {
    return 'ST3ZFT624V70VXEYAZ51VPKRHXSEQRT6PA51T2SPS';
  }
  // Mainnet address
  return 'SP30VANCWST2Y0RY3EYGJ4ZK6D22GJQRR7H5YD8J8';
};

export const getMarketplaceContract = (network: Network) => {
  const contractName = isDevnetEnvironment()
    ? 'market'
    : 'market';

  return {
    contractAddress: getMarketplaceContractAddress(network),
    contractName,
  } as const;
};
