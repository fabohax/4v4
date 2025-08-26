// Utility to detect installed wallet extensions

declare global {
  interface Window {
    XverseProviders?: {
      StacksProvider?: unknown;
      [key: string]: unknown;
    };
    LeatherProvider?: unknown;
  }
}

export function detectWalletExtensions() {
  if (typeof window === 'undefined') return [];
  const wallets = [];
  if ('LeatherProvider' in window) {
    wallets.push({
      id: 'leather',
      name: 'Leather',
      url: 'https://leather.io',
      installed: true,
    });
  } else {
    wallets.push({
      id: 'leather',
      name: 'Leather',
      url: 'https://leather.io',
      installed: false,
    });
  }
  if (window.XverseProviders && window.XverseProviders.StacksProvider) {
    wallets.push({
      id: 'xverse',
      name: 'Xverse',
      url: 'https://xverse.app',
      installed: true,
    });
  } else {
    wallets.push({
      id: 'xverse',
      name: 'Xverse',
      url: 'https://xverse.app',
      installed: false,
    });
  }
  return wallets;
}
