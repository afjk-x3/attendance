"use client";

import Link from "next/link";
import { useWallet } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/button";

export function Header() {
  const { address, connect, disconnect, isConnecting } = useWallet();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 max-w-2xl">
        <Link href="/" className="font-bold text-xl tracking-tight text-indigo-600">
          POA
        </Link>
        <div className="flex items-center gap-4">
          {address ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                {address.substring(0, 5)}...{address.substring(address.length - 4)}
              </span>
              <Button variant="outline" size="sm" onClick={disconnect}>
                Disconnect
              </Button>
            </div>
          ) : (
            <Button onClick={connect} disabled={isConnecting}>
              {isConnecting ? "Connecting..." : "Connect Freighter"}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
