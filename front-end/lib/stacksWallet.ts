import {
  generateSecretKey,
  generateWallet,
  getStxAddress,
} from '@stacks/wallet-sdk';

/**
 * Creates a Stacks wallet and returns key details.
 * @param password - Optional password for encryption
 * @param network - One of: 'mainnet', 'testnet', 'devnet', 'mocknet'
 */
export async function createStacksAccount(
  password = 'default-password',
  network: 'mainnet' | 'testnet' | 'devnet' | 'mocknet' = (process.env.NEXT_PUBLIC_STACKS_NETWORK as 'mainnet' | 'testnet' | 'devnet') || 'mainnet'
) {
  const secretKey = generateSecretKey(); // 24-word mnemonic
  const wallet = await generateWallet({ secretKey, password });
  const account = wallet.accounts[0];

  const address = getStxAddress(account, network);

  return {
    address,
    stxPrivateKey: account.stxPrivateKey,
    mnemonic: secretKey,
    encryptedSecretKey: wallet.encryptedSecretKey,
    index: account.index,
  };
}
