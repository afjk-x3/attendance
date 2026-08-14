import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/contexts/WalletContext";
import { Header } from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Proof of Attendance",
  description: "Decentralized event attendance on Stellar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-slate-50 text-slate-900`}>
        <WalletProvider>
          <Header />
          <main className="container mx-auto px-4 py-8 max-w-2xl">
            {children}
          </main>
        </WalletProvider>
      </body>
    </html>
  );
}
