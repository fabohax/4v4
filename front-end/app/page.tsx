"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import JoinWaitlistForm from "@/components/JoinWaitlistForm"
import ModelViewer from "@/components/features/avatar/ModelViewer"
import { useTheme } from "next-themes"
import { useAppLoading } from "@/components/AppLoadingProvider"
import GetInModal from "@/components/GetInModal"
import { useRouter } from "next/navigation"
import { useWallet } from "@/components/WalletProvider"
import { useI18n } from '@/lib/i18n'

export default function Home() {
  const { t } = useI18n();
  const [isLoaded, setIsLoaded] = useState(false)
  const [modelLoading, setModelLoading] = useState(true);
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { loadPage } = useAppLoading()
  const { address } = useWallet();
  const router = useRouter();

  const [secondaryColor] = useState<string>('#ffffff');
  const [modelUrl] = useState<string | null>('/models/default.glb');
  const [lightIntensity] = useState<number>(11);
  const [showGetInModal, setShowGetInModal] = useState(false);

  // Theme-based background color for ModelViewer
  const getModelBackground = () => {
    if (!mounted) return '#212121' // Default during SSR
    const currentTheme = resolvedTheme || theme
    return currentTheme === 'dark' ? '#212121' : '#f5f5f5'
  }

  // Preload the 3D model
  useEffect(() => {
    const preloadModel = async () => {
      if (!modelUrl) {
        setModelLoading(false);
        return;
      }

      try {
        setModelLoading(true);
        
        // Create a simple fetch to check if model exists and trigger browser cache
        const response = await fetch(modelUrl);
        if (response.ok) {
          // Add a small delay to ensure model is processed
          setTimeout(() => {
            setModelLoading(false);
          }, 500);
        } else {
          console.warn('Model not found, showing ModelViewer anyway');
          setModelLoading(false);
        }
      } catch (error) {
        console.warn('Error preloading model:', error);
        // Show ModelViewer anyway, let it handle the error
        setModelLoading(false);
      }
    };

    if (mounted) {
      preloadModel();
    }
  }, [modelUrl, mounted]);

  useEffect(() => {
    setMounted(true)
    
    const initializePage = async () => {
      // Load page-specific assets in background
      await loadPage('home');
      
      // Small delay for smooth transition
      setTimeout(() => {
        setIsLoaded(true);
      }, 300);
    };

    initializePage();
  }, [loadPage])

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  }

  return (
    <div className="h-auto bg-gradient-to-b from-background to-muted text-foreground dotted-grid-background">
      {/* Hero Section */}
      {/* Background gradient animation */}
        <div className="inset-0  animate-gradient-x select-none"></div>

        <div className="container mx-auto px-4 h-screen md:py-20 relative z-10 select-none flex items-center">
          <div className="flex flex-col md:flex-row items-center justify-center text-center gap-8 w-full">
            <motion.div
              className="md:w-full"
              initial="hidden"
              animate={isLoaded ? "visible" : "hidden"}
              variants={fadeIn}
            >
              <motion.h1
                className="title text-4xl md:text-6xl font-extralight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-muted-foreground via-foreground to-muted-foreground"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                {t('Printable 3D models, made real')}
              </motion.h1>
              <motion.p
                className="text-lg md:text-xl text-muted-foreground mb-8 font-light"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                {t('Shop ready-to-print digital models, or send us your file for a print quote with delivery.')}
              </motion.p>

              <div className="flex flex-col sm:flex-row items-center justify-center text-center gap-3 sm:gap-4 w-full">
                <motion.div
                  className="w-full sm:w-auto"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <Link href="/explore">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto text-base sm:text-lg bg-surface-primary border-1 border-foreground text-foreground px-6 py-3 sm:px-8 sm:py-4 lg:px-12 lg:py-6 rounded-md mt-2 sm:mt-6 hover:bg-muted hover:text-foreground cursor-pointer select-none"
                    >
                      {t('Browse printable models')}
                    </Button>
                  </Link>
                </motion.div>

                <motion.div
                  className="w-full sm:w-auto"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.65, duration: 0.5 }}
                >
                  <Link href="/print-request">
                    <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg bg-foreground text-background px-6 py-3 sm:px-8 sm:py-4 lg:px-12 lg:py-6 rounded-md mt-2 sm:mt-6 hover:opacity-90 cursor-pointer">
                      {t('Get a print & delivery quote')}
                    </Button>
                  </Link>
                </motion.div>

                <motion.div
                  className="w-full sm:w-auto"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                >
                  <Button
                    size="lg"
                    className="w-full sm:w-auto text-base sm:text-lg bg-surface-primary border-1 border-foreground text-foreground px-6 py-3 sm:px-8 sm:py-4 lg:px-12 lg:py-6 rounded-md mt-2 sm:mt-6 hover:bg-muted hover:text-foreground cursor-pointer select-none"
                    onClick={() => {
                      if (address) {
                        router.push("/mint");
                      } else {
                        setShowGetInModal(true);
                      }
                    }}
                  >
                      {t('Sell a printable model')}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      <section className="relative overflow-hidden my-16">

        <div className="relative grid grid-cols-1 lg:grid-cols-2 items-center gap-8 mx-4 sm:mx-8 lg:mx-36 my-0 md:my-20 lg:my-0 min-h-[calc(72vh-8rem)] md:min-h-[calc(72vh-10rem)]">
          <div className="flex justify-center self-center mt-2 md:mt-6 lg:mt-0">
            {modelLoading ? (
              <div className="flex items-center justify-center w-full h-96">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">{t('Loading 3D Model...')}</p>
                </div>
              </div>
            ) : (
              <ModelViewer
                background={getModelBackground()}
                secondaryColor={secondaryColor}
                modelUrl={modelUrl}
                lightIntensity={lightIntensity}
              />
            )}
          </div>
          <div className="py-12 md:py-24 lg:py-36 select-none">
            <span className="relative w-auto text-[8px] my-4 bg-muted text-muted-foreground rounded-full px-4 py-2">DIGITAL MODEL</span>
            <h1 className="text-3xl md:text-5xl font-bold my-4" style={{ fontFamily: 'Chakra Petch, sans-serif' }}>AMZ Shooter</h1>
            <p style={{ fontFamily: 'Chakra Petch, sans-serif' }}>by CYMODS</p>
            <p className="my-2 pr-0 md:pr-20 text-base md:text-xl">
              {t('Find downloadable 3D files for your own printer, or send us a model and we’ll review it, price the print, and deliver it to you.')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
              <Link href="/mint" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto text-base sm:text-lg bg-surface-primary border-1 border-foreground text-foreground px-6 py-3 sm:px-8 sm:py-4 lg:px-12 lg:py-6 rounded-md mt-4 sm:mt-6 hover:bg-muted hover:text-foreground cursor-pointer select-none" style={{ fontFamily: 'Chakra Petch, sans-serif' }}>
                  {t('Browse models')}
                </Button>
              </Link>
              <Link href="/print-request" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto text-base sm:text-lg px-6 py-3 sm:px-8 sm:py-4 lg:px-12 lg:py-6 rounded-md mt-4 sm:mt-6 cursor-pointer">
                  {t('Request a printed part')}
                </Button>
              </Link>
            </div>

          </div>  
        </div>

        
      </section>
      <div className="w-full px-4 py-12">
        <JoinWaitlistForm />
      </div>
      {/* Show GetInModal if triggered */}
      {showGetInModal && <GetInModal onClose={() => setShowGetInModal(false)} />}
    </div>
  )
}
