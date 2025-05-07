
export const getNftContractAddress = () => {
  return 'ST3ZFT624V70VXEYAZ51VPKRHXSEQRT6PA51T2SPS'; // Hardcoded testnet address
};

export const getNftContract = () => {
  const contract = {
    contractAddress: getNftContractAddress(),
    contractName: 'avatar-minter',
  };

  console.log('NFT Contract Details:', contract);

  return contract;
};

export const getMarketplaceContractAddress = () => {
  return 'ST3ZFT624V70VXEYAZ51VPKRHXSEQRT6PA51T2SPS'; // Hardcoded testnet address
};

export const getMarketplaceContract = () => {
  return {
    contractAddress: getMarketplaceContractAddress(),
    contractName: 'market',
  } as const;
};
