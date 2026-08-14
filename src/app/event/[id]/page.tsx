"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWallet } from "@/contexts/WalletContext";
import { getEvent, AppEvent } from "@/lib/storage";
import { getAttendeeCount, getGlobalAttendees } from "@/lib/stellar";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Users, Copy, CheckCircle2, Share2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function EventDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { address } = useWallet();
  const [event, setEvent] = useState<AppEvent | null>(null);
  const [attendeeCount, setAttendeeCount] = useState<number>(0);
  const [onChainAttendees, setOnChainAttendees] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof id === "string") {
      const storedEvent = getEvent(id);
      if (storedEvent) {
        setEvent(storedEvent);
      }
      
      const fetchCount = () => {
        getAttendeeCount(Number(id)).then(count => setAttendeeCount(count));
        getGlobalAttendees(Number(id)).then(attendees => setOnChainAttendees(attendees));
      };
      
      // Fetch on-chain attendee count immediately
      fetchCount();

      // Auto-refresh the count every 5 seconds
      const intervalId = setInterval(fetchCount, 5000);
      return () => clearInterval(intervalId);
    }
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Event link copied to clipboard!");
  };

  if (!event) {
    return (
      <div className="flex justify-center mt-20">
        <p className="text-slate-500">Event not found in local storage.</p>
      </div>
    );
  }

  const isOrganizer = address === event.organizerAddress;
  const isPast = event.endTimestamp > 0 && Math.floor(Date.now() / 1000) > event.endTimestamp;
  const formattedTime = event.endTimestamp > 0 ? new Date(event.endTimestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A";
  const checkInUrl = `${window.location.origin}/check-in/${event.id}?token=${event.qrToken}&name=${encodeURIComponent(event.name)}&date=${encodeURIComponent(event.date)}&location=${encodeURIComponent(event.location)}&endTimestamp=${event.endTimestamp}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(checkInUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={() => router.back()} className="text-slate-500 hover:text-slate-700">
          ← Back
        </Button>
        <Button variant="outline" size="sm" onClick={handleShare} className="text-slate-600 hover:text-indigo-600">
          <Share2 className="w-4 h-4 mr-2" />
          Share Event
        </Button>
      </div>

      <div className="text-center space-y-3">
        <h1 className="text-4xl font-extrabold text-slate-900 flex items-center justify-center gap-3">
          {event.name}
          {isPast ? (
            <span className="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-full text-sm font-bold shadow-sm">Ended</span>
          ) : (
            <span className="bg-green-50 text-green-600 border border-green-200 px-3 py-1 rounded-full text-sm font-bold shadow-sm">Active</span>
          )}
        </h1>
        <p className="text-lg text-slate-600">{event.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 overflow-hidden shadow-sm">
          <div className="w-full h-48 bg-gradient-to-br from-indigo-50 to-purple-100 border-b border-indigo-100/50 flex items-center justify-center relative overflow-hidden">
             {event.imageUrl ? (
               <img 
                  src={event.imageUrl} 
                  alt={event.name} 
                  className="w-full h-full object-cover" 
               />
             ) : (
               <Calendar className="w-20 h-20 text-indigo-200/50" />
             )}
          </div>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-slate-700">
              <Calendar className="text-indigo-600 w-5 h-5" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700">
              <Clock className="text-indigo-600 w-5 h-5" />
              <span>Ends at {formattedTime}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700">
              <MapPin className="text-indigo-600 w-5 h-5" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700">
              <Users className="text-indigo-600 w-5 h-5" />
              <span>
                {attendeeCount} / {event.maxAttendees} Attendees (On-Chain)
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className={`flex flex-col items-center justify-center border-indigo-100 ${isPast ? 'bg-slate-50 grayscale' : 'bg-indigo-50/50'}`}>
          <CardHeader className="flex flex-col items-center text-center px-2 space-y-1.5 w-full">
            <CardTitle className="text-xl font-bold whitespace-nowrap text-center">Check-in QR Code</CardTitle>
            <CardDescription className="text-center w-full">{isPast ? "Check-in is closed." : "Attendees scan this to check in."}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 w-full px-4 pb-6">
            <div className={`bg-white p-2 rounded-xl shadow-sm border border-slate-100 relative ${isPast ? 'opacity-50' : ''}`}>
              <QRCodeSVG value={checkInUrl} size={150} />
              {isPast && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px] rounded-xl">
                   <span className="text-red-600 font-bold rotate-12 text-lg border-2 border-red-600 px-2 py-1 rounded">CLOSED</span>
                </div>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={copyUrl} className="w-full" disabled={isPast}>
              {copied ? <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copied URL!" : "Copy Check-in URL"}
            </Button>
            {!isOrganizer && (
              <p className="text-xs text-slate-500 mt-2">
                (Normally only visible to the organizer, but shown here for testing)
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-indigo-100 shadow-sm">
        <CardHeader className="bg-indigo-50/50 rounded-t-xl border-b border-indigo-100">
          <CardTitle>Global On-Chain Check-ins</CardTitle>
          <CardDescription>All attendees verified on the Stellar blockchain globally.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {onChainAttendees.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No global check-ins recorded yet.</p>
          ) : (
            <ul className="space-y-3">
              {onChainAttendees.map((address, i) => (
                <li key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                      {i + 1}
                    </div>
                    <div className="font-mono text-sm text-slate-700">
                      {address.substring(0, 12)}...{address.substring(address.length - 8)}
                    </div>
                  </div>
                  <a
                    href={`https://stellar.expert/explorer/testnet/account/${address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline mt-2 sm:mt-0 px-3 py-1 rounded-full bg-indigo-50"
                  >
                    View Account ↗
                  </a>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
