"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWallet } from "@/contexts/WalletContext";
import { getEvent, getCheckIns, AppEvent, CheckInRecord } from "@/lib/storage";
import { getAttendeeCount } from "@/lib/stellar";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Users, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EventDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { address } = useWallet();
  const [event, setEvent] = useState<AppEvent | null>(null);
  const [attendeeCount, setAttendeeCount] = useState<number>(0);
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof id === "string") {
      const storedEvent = getEvent(id);
      if (storedEvent) {
        setEvent(storedEvent);
        const allCheckIns = getCheckIns();
        setCheckIns(allCheckIns.filter(c => c.eventId === id));
      }
      
      const fetchCount = () => {
        getAttendeeCount(Number(id)).then(count => setAttendeeCount(count));
      };
      
      // Fetch on-chain attendee count immediately
      fetchCount();

      // Auto-refresh the count every 5 seconds
      const intervalId = setInterval(fetchCount, 5000);
      return () => clearInterval(intervalId);
    }
  }, [id]);

  if (!event) {
    return (
      <div className="flex justify-center mt-20">
        <p className="text-slate-500">Event not found in local storage.</p>
      </div>
    );
  }

  const isOrganizer = address === event.organizerAddress;
  const checkInUrl = `${window.location.origin}/check-in/${event.id}?token=${event.qrToken}&name=${encodeURIComponent(event.name)}&date=${encodeURIComponent(event.date)}&location=${encodeURIComponent(event.location)}&endTimestamp=${event.endTimestamp}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(checkInUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="mb-4">
        <Button variant="ghost" onClick={() => router.back()} className="text-slate-500 hover:text-slate-700">
          ← Back
        </Button>
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold text-slate-900">{event.name}</h1>
        <p className="text-lg text-slate-600">{event.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 overflow-hidden">
          {event.imageUrl && (
            <div className="w-full h-48 bg-slate-100 border-b border-slate-100">
               <img 
                  src={event.imageUrl} 
                  alt={event.name} 
                  className="w-full h-full object-cover" 
               />
            </div>
          )}
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-slate-700">
              <Calendar className="text-indigo-600 w-5 h-5" />
              <span>{event.date}</span>
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

        <Card className="flex flex-col items-center text-center justify-center border-indigo-100 bg-indigo-50/50">
          <CardHeader>
            <CardTitle className="text-lg">Check-in QR Code</CardTitle>
            <CardDescription>Attendees scan this to check in.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
              <QRCodeSVG value={checkInUrl} size={150} />
            </div>
            <Button variant="outline" size="sm" onClick={copyUrl} className="w-full">
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

      <Card>
        <CardHeader>
          <CardTitle>Local Check-ins</CardTitle>
          <CardDescription>Attendees who checked in on this device.</CardDescription>
        </CardHeader>
        <CardContent>
          {checkIns.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No local check-ins recorded yet.</p>
          ) : (
            <ul className="space-y-3">
              {checkIns.map((c, i) => (
                <li key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="font-mono text-sm text-slate-700">
                    {c.attendeeAddress.substring(0, 8)}...{c.attendeeAddress.substring(c.attendeeAddress.length - 4)}
                  </div>
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${c.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-600 hover:underline mt-2 sm:mt-0"
                  >
                    View TX
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
