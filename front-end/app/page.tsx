"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Footer from "@/components/Footer" 
import JoinWaitlistForm from "@/components/JoinWaitlistForm"
import ModelViewer from "@/components/features/avatar/ModelViewer"

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [showDetails, setShowDetails] = useState(false);

  const [secondaryColor] = useState<string>('#ffffff');
  const [background] = useState<string>('#212121');
  const [modelUrl] = useState<string | null>('/models/default.glb');
  const [lightIntensity] = useState<number>(11);

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  }


  return (
    <div className="h-auto bg-gradient-to-b from-black to-gray-900 text-white dotted-grid-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">

        <div className="relative grid grid-cols-1 lg:grid-cols-2 items-center gap-8 mx-4 sm:mx-8 lg:mx-36 my-0 md:my-20 lg:my-0 min-h-[calc(72vh-8rem)] md:min-h-[calc(72vh-10rem)]">
          <div className="flex justify-center self-center mt-2 md:mt-6 lg:mt-0">
            <ModelViewer
              background={background}
              secondaryColor={secondaryColor}
              modelUrl={modelUrl}
              lightIntensity={lightIntensity}
            />
          </div>
          <div className="py-12 md:py-24 lg:py-36 select-none">
            <span className="relative w-auto text-[8px] my-4 bg-[#111] rounded-full px-4 py-2">AVATAR</span>
            <h1 className="text-3xl md:text-5xl font-bold my-4" style={{ fontFamily: 'Chakra Petch, sans-serif' }}>AMZ Shooter</h1>
            <p style={{ fontFamily: 'Chakra Petch, sans-serif' }}>by CYMODS</p>
            <p className="my-2 pr-0 md:pr-20 text-base md:text-xl">
              A heavy-duty combat mech avatar built for open metaverse warfare. Equipped with missile arrays and reinforced armor.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
              <Link href="/mint" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto text-base sm:text-lg bg-black border-1 border-white text-white px-6 py-3 sm:px-8 sm:py-4 lg:px-12 lg:py-6 rounded-md mt-4 sm:mt-6 hover:bg-white hover:text-black cursor-pointer select-none" style={{ fontFamily: 'Chakra Petch, sans-serif' }}>
                  Mint Now
                </Button>
              </Link>
              <Button
                className="w-full sm:w-auto text-sm bg-transparent border-1 border-transparent text-white px-6 py-3 sm:px-8 sm:py-4 rounded-md mt-2 sm:mt-6 mb-2 cursor-pointer select-none"
                style={{ fontFamily: 'Chakra Petch, sans-serif' }}
                onClick={() => setShowDetails((v) => !v)}
              >
                {showDetails ? "Less" : "Details"}
              </Button>
            </div>

            {showDetails && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
                <div>
                  <b>Attributes:</b>
                  <ul className="list-disc ml-6 text-sm">
                    <li>style: futuristic</li>
                    <li>rarity: Rare</li>
                    <li>class: heavy assault</li>
                    <li>mobility: bipedal</li>
                    <li>armament: missile pods</li>
                  </ul>
                </div>
                <div>
                  <b>Interoperability Formats:</b>
                  <ul className="list-disc ml-6 text-sm">
                    <li>glb</li>
                    <li>fbx</li>
                  </ul>
                  <b>Customization Data:</b>
                  <ul className="list-disc ml-6 text-sm">
                    <li>color: blue &amp; white</li>
                    <li>accessory: dual shoulder missile pods</li>
                    <li>creator: 0x123...</li>
                  </ul>
                </div>
              </div>
            )}
            {showDetails && (
              <div className="my-2 text-sm">
                <b>Soulbound:</b> true<br />
                <b>Edition:</b> 100<br />
                <b>Royalties:</b> 10%<br />
                <b>Properties:</b> polygonCount: 5000
              </div>
            )}
          </div>  
        </div>

        {/* Background gradient animation */}
        <div className="inset-0  animate-gradient-x select-none"></div>

        <div className="container mx-auto px-4 py-12 md:py-20 relative z-10 select-none">
          <div className="flex flex-col md:flex-row items-center justify-center text-center gap-8">
            <motion.div
              className="md:w-full"
              initial="hidden"
              animate={isLoaded ? "visible" : "hidden"}
              variants={fadeIn}
            >
              <motion.h1
                className="title text-4xl md:text-6xl font-extralight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-300 via-white to-gray-100"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                Mint & Collect 3D NFTs
              </motion.h1>
              <motion.p
                className="text-lg md:text-xl text-gray-300 mb-8 font-light"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                Explore, buy, and showcase high-quality 3D models from talented creators worldwide.
              </motion.p>

              <div className="flex flex-col sm:flex-row items-center justify-center text-center gap-3 sm:gap-4 w-full">
                <motion.div
                  className="w-full sm:w-auto"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <Button
                    size="lg"
                    className="w-full sm:w-auto text-base sm:text-lg bg-black border-1 border-white text-white px-6 py-3 sm:px-8 sm:py-4 lg:px-12 lg:py-6 rounded-md mt-2 sm:mt-6 hover:bg-white hover:text-black cursor-pointer select-none"
                  >
                    Explore
                  </Button>
                </motion.div>

                <motion.div
                  className="w-full sm:w-auto"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto text-base sm:text-lg bg-black border-1 border-white text-white px-6 py-3 sm:px-8 sm:py-4 lg:px-12 lg:py-6 rounded-md mt-2 sm:mt-6 hover:bg-white hover:text-black cursor-pointer select-none"
                  >
                    <Link href="/mint">Create &amp; Mint</Link>
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      <div className="container mx-auto px-4 py-12">
        <JoinWaitlistForm />
      </div>
      <Footer /> 
    </div>
  )
}
