import type { Metadata } from "next";
import { Inter, Chakra_Petch } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { Providers } from '@/components/ui/provider';
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
  title: "4v4",
  description: "--",
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
            {children}
          </>
        </Providers>
      </body>
    </html>
  );
}
