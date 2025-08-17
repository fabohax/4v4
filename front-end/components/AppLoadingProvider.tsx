'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import AssetPreloader from '@/utils/AssetPreloader';
import AppLoader from '@/components/AppLoader';

interface AppLoadingContextType {
  isAppLoaded: boolean;
  loadPage: (pageName: string, additionalAssets?: string[]) => Promise<void>;
  preloadAssets: (assets: string[]) => Promise<void>;
}

const AppLoadingContext = createContext<AppLoadingContextType | undefined>(undefined);

export const useAppLoading = () => {
  const context = useContext(AppLoadingContext);
  if (context === undefined) {
    throw new Error('useAppLoading must be used within an AppLoadingProvider');
  }
  return context;
};

interface AppLoadingProviderProps {
  children: ReactNode;
  skipInitialLoading?: boolean;
}

export function AppLoadingProvider({ 
  children, 
  skipInitialLoading = false 
}: AppLoadingProviderProps) {
  const [isAppLoaded, setIsAppLoaded] = useState(skipInitialLoading);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading application...');
  
  useEffect(() => {
    if (!skipInitialLoading && !isAppLoaded) {
      initializeApp();
    }
  }, [skipInitialLoading, isAppLoaded]);

  const initializeApp = async () => {
    setIsLoading(true);
    setLoadingMessage('Initializing 4v4...');
    
    const preloader = AssetPreloader.getInstance();
    
    try {
      // Load critical assets for app initialization
      const criticalAssets = [
        '/loader.gif',
        '/loaderb.gif',
        '/home.svg',
        '/4V4-DIY.svg',
        '/4V4-DIY.png'
      ];

      // Load home page assets as well since it's the landing page
      const homeAssets = AssetPreloader.getPageAssets('home');
      const modelAssets = ['/models/default.glb'];
      
      const allAssets = [...criticalAssets, ...homeAssets, ...modelAssets];

      await preloader.preloadAssets(allAssets, {
        timeout: 8000, // Longer timeout for 3D models
        onProgress: (loaded, total) => {
          const progress = Math.round((loaded / total) * 100);
          setLoadingMessage(`Loading assets... ${progress}%`);
        },
        onAssetLoaded: (asset) => {
          if (asset.includes('models/')) {
            setLoadingMessage('Loading 3D models...');
          } else if (asset.includes('.svg') || asset.includes('.png')) {
            setLoadingMessage('Loading interface...');
          }
        }
      });

      // Additional delay to ensure smooth loading experience
      await new Promise(resolve => setTimeout(resolve, 800));
      
    } catch (error) {
      console.warn('App initialization completed with some errors:', error);
    }
    
    setIsAppLoaded(true);
    setIsLoading(false);
  };

  const loadPage = async (pageName: string, additionalAssets: string[] = []) => {
    const preloader = AssetPreloader.getInstance();
    const pageAssets = AssetPreloader.getPageAssets(pageName);
    const allAssets = [...pageAssets, ...additionalAssets];
    
    if (allAssets.length === 0) return;
    
    // Load page assets in background without blocking UI
    preloader.preloadAssets(allAssets, {
      timeout: 3000,
      onAssetLoaded: (asset) => {
        console.log(`📄 Page asset loaded for ${pageName}:`, asset);
      }
    }).catch(() => {
      console.log(`Page assets loading completed for ${pageName}`);
    });
  };

  const preloadAssets = async (assets: string[]) => {
    const preloader = AssetPreloader.getInstance();
    return preloader.preloadAssets(assets, { timeout: 5000 });
  };

  const contextValue: AppLoadingContextType = {
    isAppLoaded,
    loadPage,
    preloadAssets
  };

  return (
    <AppLoadingContext.Provider value={contextValue}>
      {!isAppLoaded && (
        <AppLoader 
          isLoading={isLoading || !isAppLoaded}
          message="Initializing"
          subMessage={loadingMessage}
        />
      )}
      {isAppLoaded && children}
    </AppLoadingContext.Provider>
  );
}

export default AppLoadingProvider;
