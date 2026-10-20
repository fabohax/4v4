const IPFS_GATEWAY_URL = 'https://gateway.pinata.cloud';

export function getIPFSUrl(cid: string): string {
  if (!cid) return '';
  const cleanCid = cid.replace(/^ipfs:\/\//, '');
  return `${IPFS_GATEWAY_URL}/ipfs/${cleanCid}`;
}

export function getOptimizedIPFSUrl(cid: string, width?: number, height?: number, quality?: number): string {
  const baseUrl = getIPFSUrl(cid);
  const params = new URLSearchParams();

  if (width) params.set('img-width', String(width));
  if (height) params.set('img-height', String(height));
  if (quality) params.set('img-quality', String(quality));

  return params.size ? `${baseUrl}?${params.toString()}` : baseUrl;
}
