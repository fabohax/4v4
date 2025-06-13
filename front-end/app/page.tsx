"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import FeaturedCard from "@/components/FeaturedCard"
import Footer from "@/components/Footer" 
import ModelViewer from "@/components/features/avatar/ModelViewer"

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false)

  const [secondaryColor] = useState<string>('#ffffff');
  const [background] = useState<string>('#212121');
  const [modelUrl] = useState<string | null>('/models/default.glb');
  const [lightIntensity] = useState<number>(11);

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const featuredModels = [
    {
      id: 1,
      title: "CyberHead",
      author: "CryptoArtist",
      price: "SAT 1200",
      image: "/01.png?height=400&width=400",
      category: "Collectible",
      likes: 243,
      views: 1.2,
    },
    {
      id: 2,
      title: "Space Explorer",
      author: "NFT_Creator",
      price: "SAT 850",
      image: "/02.png?height=400&width=400",
      category: "Avatar",
      likes: 187,
      views: 0.9,
    },
    {
      id: 3,
      title: "Minecraft Boy",
      author: "3D_Master",
      price: "SAT 2000",
      image: "/03.png?height=400&width=400",
      category: "Avatar",
      likes: 312,
      views: 1.5,
    },
  ]


  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  }


  return (
    <div className="h-auto bg-gradient-to-b from-black to-gray-900 text-white dotted-grid-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">

        <div>
          <ModelViewer
          background={background}
          secondaryColor={secondaryColor}
          modelUrl={modelUrl}
          lightIntensity={lightIntensity}
        />
        </div>

        {/* Background gradient animation */}
        <div className="inset-0 bg-gradient-to-r from-purple-900/20 via-blue-900/20 to-teal-900/20 animate-gradient-x"></div>

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <motion.div
              className="md:w-1/2"
              initial="hidden"
              animate={isLoaded ? "visible" : "hidden"}
              variants={fadeIn}
            >
              <motion.h1
                className="title text-5xl md:text-6xl font-extralight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-300 via-white to-gray-100"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                Mint & Collect 3D NFTs
              </motion.h1>
              <motion.p
                className="text-xl text-gray-300 mb-8 font-light"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                Explore, buy, and showcase high-quality 3D models from talented creators worldwide.
              </motion.p>

              <div className="flex flex-wrap gap-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <Button
                    size="lg"
                    className="font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 rounded-xl cursor-pointer"
                  >
                    Explore
                  </Button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white/20 hover:bg-white/10 text-white hover:text-white px-8 py-6 rounded-xl cursor-pointer"
                  >
                    <Link href="/mint">Create & Mint</Link>
                  </Button>
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              className="mx-auto h-auto relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              {/* FeaturedCard remains, but add ModelViewer below for 3D showcase */}
              <FeaturedCard model={featuredModels[0]} />
            </motion.div>
          </div>
        </div>
      </section>
      <Footer /> 
    </div>
  )
}
