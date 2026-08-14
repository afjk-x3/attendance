"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/contexts/WalletContext";
import { getMyCheckIns, CheckInRecord } from "@/lib/storage";
import { getUserBadges } from "@/lib/stellar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, CheckCircle, ExternalLink, Hash, Award } from "lucide-react";

export default function MyAttendance() {
  const router = useRouter();
  const { address, connect, isConnecting } = useWallet();
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const [onChainBadges, setOnChainBadges] = useState<number[]>([]);

  useEffect(() => {
    if (address) {
      // eslint-disable-next-line
      setCheckIns(getMyCheckIns(address));
      getUserBadges(address).then(badges => setOnChainBadges(badges));
    } else {
      setCheckIns([]);
      setOnChainBadges([]);
    }
  }, [address]);

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center mt-20 space-y-6 animate-in fade-in duration-500">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">My Attendance</h2>
          <p className="text-slate-600">Connect your wallet to view your attendance history.</p>
        </div>
        <Button onClick={connect} disabled={isConnecting} className="bg-indigo-600 hover:bg-indigo-700">
          {isConnecting ? "Connecting..." : "Connect Freighter"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-4">
        <Button variant="ghost" onClick={() => router.back()} className="text-slate-500 hover:text-slate-700">
          ← Back
        </Button>
      </div>
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900">My Attendance</h1>
        <p className="text-slate-600">Your on-chain verified event history.</p>
      </div>

      {checkIns.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100 shadow-sm">
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-3 bg-indigo-100 rounded-full">
                <Hash className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Local History</p>
                <h3 className="text-2xl font-bold text-slate-900">{checkIns.length}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100 shadow-sm">
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">On-Chain POAPs</p>
                <h3 className="text-2xl font-bold text-slate-900">{onChainBadges.length}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100 shadow-sm">
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-3 bg-indigo-100 rounded-full">
                <Award className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">First Attended</p>
                <h3 className="text-lg font-bold text-slate-900 truncate">
                  {new Date(Math.min(...checkIns.map(c => c.checkedInAt))).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                </h3>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {checkIns.length === 0 ? (
        <Card className="text-center py-12 border-dashed">
          <CardContent className="space-y-4">
            <CheckCircle className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="text-slate-500">
              Check-ins will appear here once you&apos;ve successfully checked into an event on-chain.
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {checkIns.map((checkin, i) => (
            <Card 
              key={i} 
              className="hover:shadow-md transition-all hover:border-indigo-300 cursor-pointer group"
              onClick={() => router.push(`/event/${checkin.eventId}`)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-xl text-indigo-900 group-hover:text-indigo-600 transition-colors">{checkin.eventName || `Event ID: ${checkin.eventId}`}</CardTitle>
                <CardDescription>Checked in on {new Date(checkin.checkedInAt).toLocaleString()}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  {checkin.eventDate && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>{checkin.eventDate}</span>
                    </div>
                  )}
                  {checkin.eventLocation && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>{checkin.eventLocation}</span>
                    </div>
                  )}
                </div>
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${checkin.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-2 rounded-md transition-colors"
                >
                  View Tx <ExternalLink className="w-4 h-4" />
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
