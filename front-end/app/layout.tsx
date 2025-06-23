import type { Metadata } from "next";
import { Inter, Chakra_Petch } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { GetInButton } from "@/components/GetIn";
import { Providers } from '@/components/ui/provider';
import { Toaster } from "@/components/ui/sonner"
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const chakraPetch = Chakra_Petch({
  variable: "--font-chakra-petch",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "4V4 - DO IT YOURSELF",
  description: "Find & Buy 3D NFTs on Bitcoin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${chakraPetch.variable} antialiased`}>
        <Providers>
          <>
            <Navbar />
            <GetInButton />
            {children}
          </>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
