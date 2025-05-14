"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, Zap, TrendingUp, Award, ChevronRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import ModelCard from "@/components/ModelCard"
import CategorySlider from "@/components/CategorySlider"
import FeaturedCard from "@/components/FeaturedCard"
import Footer from "@/components/Footer" // Import Footer component

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const featuredModels = [
    {
      id: 1,
      title: "Cyber Head",
      author: "CryptoArtist",
      price: "SAT 1200",
      image: "/01.png?height=400&width=400",
      category: "Avatar",
      likes: 243,
      views: 1.2,
    },
    {
      id: 2,
      title: "Space Explorer",
      author: "NFT_Creator",
      price: "SAT 850",
      image: "/02.png?height=400&width=400",
      category: "Character",
      likes: 187,
      views: 0.9,
    },
    {
      id: 3,
      title: "Digital Landscape",
      author: "3D_Master",
      price: "SAT 2000",
      image: "/03.png?height=400&width=400",
      category: "Environment",
      likes: 312,
      views: 1.5,
    },
  ]

  const trendingModels = [
    {
      id: 4,
      title: "Neon Warrior",
      author: "BlockchainArtist",
      price: "SAT 1500",
      image: "/04.png?height=300&width=300",
      category: "Avatar",
      likes: 198,
      views: 0.8,
    },
    {
      id: 5,
      title: "Futuristic Vehicle",
      author: "3D_Visionary",
      price: "SAT 3000",
      image: "/05.png?height=300&width=300",
      category: "Vehicle",
      likes: 276,
      views: 1.3,
    },
    {
      id: 6,
      title: "Mystical Creature",
      author: "DigitalSculptor",
      price: "SAT 950",
      image: "/06.png?height=300&width=300",
      category: "Character",
      likes: 154,
      views: 0.7,
    },
    {
      id: 7,
      title: "Sci-Fi Helmet",
      author: "FutureDesigner",
      price: "SAT 750",
      image: "/07.png?height=300&width=300",
      category: "Accessory",
      likes: 132,
      views: 0.6,
    },
  ]

  const categories = [
    { id: 1, name: "Avatars", count: 243, icon: "👤" },
    { id: 2, name: "Environments", count: 187, icon: "🌍" },
    { id: 3, name: "Vehicles", count: 112, icon: "🚗" },
    { id: 4, name: "Accessories", count: 98, icon: "👑" },
    { id: 5, name: "Characters", count: 156, icon: "🦸" },
    { id: 6, name: "Weapons", count: 87, icon: "⚔️" },
  ]

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient animation */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-blue-900/20 to-teal-900/20 animate-gradient-x"></div>

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <motion.div
              className="md:w-1/2"
              initial="hidden"
              animate={isLoaded ? "visible" : "hidden"}
              variants={fadeIn}
            >
              <motion.h1
                className="text-5xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-400 to-purple-500"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                Discover & Collect 3D NFTs
              </motion.h1>
              <motion.p
                className="text-xl text-gray-300 mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                Explore, buy, and showcase high-quality 3D models from talented creators on the Stacks blockchain.
              </motion.p>

              <div className="flex flex-wrap gap-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 rounded-xl"
                  >
                    Explore Models
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
                    className="border-2 border-white/20 hover:bg-white/10 text-white px-8 py-6 rounded-xl"
                  >
                    <Link href="/mint">Create & Mint</Link>
                  </Button>
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              className="md:w-2/3 h-[500px] relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <FeaturedCard model={featuredModels[0]} />
            </motion.div>
          </div>
        </div>

        {/* Search bar */}
        <motion.div
          className="container mx-auto px-4 relative z-10 -mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <div className="bg-gray-800/60 backdrop-blur-lg p-4 rounded-2xl border border-gray-700/50 shadow-xl">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search for models, collections, or creators..."
                className="w-full bg-gray-900/60 border-gray-700 pl-12 py-6 text-lg rounded-xl"
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Categories Section */}
      <motion.section
        className="py-16 container mx-auto px-4"
        initial="hidden"
        animate={isLoaded ? "visible" : "hidden"}
        variants={fadeIn}
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Browse Categories</h2>
          <Button variant="ghost" className="text-blue-400 hover:text-blue-300">
            View All <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        <CategorySlider categories={categories} />
      </motion.section>

      {/* Featured Models Section */}
      <motion.section
        className="py-16 container mx-auto px-4 relative"
        initial="hidden"
        animate={isLoaded ? "visible" : "hidden"}
        variants={fadeIn}
      >
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl -z-10"></div>

        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <Sparkles className="mr-2 text-yellow-400" />
            <h2 className="text-3xl font-bold">Featured Models</h2>
          </div>
          <Button variant="ghost" className="text-blue-400 hover:text-blue-300">
            View All <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {featuredModels.map((model) => (
            <ModelCard key={model.id} model={model} featured />
          ))}
        </motion.div>
      </motion.section>

      {/* Trending Section */}
      <motion.section
        className="py-16 container mx-auto px-4"
        initial="hidden"
        animate={isLoaded ? "visible" : "hidden"}
        variants={fadeIn}
      >
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <TrendingUp className="mr-2 text-red-400" />
            <h2 className="text-3xl font-bold">Trending Now</h2>
          </div>
          <Button variant="ghost" className="text-blue-400 hover:text-blue-300">
            View All <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {trendingModels.map((model) => (
            <ModelCard key={model.id} model={model} />
          ))}
        </motion.div>
      </motion.section>

      {/* Top Creators Section */}
      <motion.section
        className="py-16 container mx-auto px-4"
        initial="hidden"
        animate={isLoaded ? "visible" : "hidden"}
        variants={fadeIn}
      >
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <Award className="mr-2 text-green-400" />
            <h2 className="text-3xl font-bold">Top Creators</h2>
          </div>
          <Button variant="ghost" className="text-blue-400 hover:text-blue-300">
            View All <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 flex flex-col items-center text-center hover:bg-gray-700/50 transition-all cursor-pointer"
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.3, delay: i * 0.1 } },
              }}
            >
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-3 flex items-center justify-center text-2xl font-bold">
                {String.fromCharCode(65 + i)}
              </div>
              <h3 className="font-semibold">Creator {i + 1}</h3>
              <p className="text-sm text-gray-400 mt-1">SAT {(i + 1) * 1000}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="py-20 container mx-auto px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 backdrop-blur-md rounded-3xl p-12 border border-gray-700/50 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.2),transparent_40%)]"></div>
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_70%,rgba(168,85,247,0.2),transparent_40%)]"></div>

          <div className="relative z-10 text-center max-w-3xl mx-auto">
            <Zap className="w-12 h-12 mx-auto mb-6 text-yellow-400" />
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Create Your Own 3D NFT?</h2>
            <p className="text-xl text-gray-300 mb-8">
              Join our community of creators and collectors. Mint your 3D models and earn SATs on the Stacks blockchain.
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-6 rounded-xl text-lg"
            >
              <Link href="/mint">Start Creating</Link>
            </Button>
          </div>
        </div>
      </motion.section>
      <Footer /> {/* Add Footer component */}
    </div>
  )
}
