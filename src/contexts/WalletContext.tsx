"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  isConnected,
  requestAccess,
} from "@stellar/freighter-api";

interface WalletContextType {
  address: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnecting: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Check if previously connected
    const stored = localStorage.getItem("connected_address");
    // eslint-disable-next-line
    if (stored) setAddress(stored);
  }, []);

  const connect = async () => {
    setIsConnecting(true);
    try {
      if (await isConnected()) {
        const res = await requestAccess();
        if (res.error) {
            console.error(res.error);
        } else if (res.address) {
            setAddress(res.address);
            localStorage.setItem("connected_address", res.address);
        }
      } else {
        alert("Please install Freighter wallet (https://www.freighter.app)");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAddress(null);
    localStorage.removeItem("connected_address");
  };

  return (
    <WalletContext.Provider value={{ address, connect, disconnect, isConnecting }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
