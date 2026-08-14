"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useWallet } from "@/contexts/WalletContext";
import { getEvent, saveCheckIn, AppEvent } from "@/lib/storage";
import { checkInTx, submitTx } from "@/lib/stellar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function CheckIn() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const urlName = searchParams.get("name") || "Unknown Event";
  const urlDate = searchParams.get("date") || "Unknown Date";
  const urlLocation = searchParams.get("location") || "Unknown Location";
  const urlEndTimestamp = Number(searchParams.get("endTimestamp") || "0");
  
  const { address, connect, isConnecting } = useWallet();
  const [event, setEvent] = useState<AppEvent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successTx, setSuccessTx] = useState("");

  useEffect(() => {
    if (typeof id === "string") {
      const storedEvent = getEvent(id);
      if (storedEvent) {
        setEvent(storedEvent);
      } else {
        // Construct a partial event from URL params for display and validation
        setEvent({
          id,
          name: urlName,
          description: "Scanned from QR code",
          location: urlLocation,
          date: urlDate,
          endTimestamp: urlEndTimestamp,
          maxAttendees: 0,
          organizerAddress: "",
          qrToken: token || "",
        });
      }
    }
  }, [id, urlName, urlDate, urlLocation, urlEndTimestamp, token]);

  const handleCheckIn = async () => {
    if (!address) return;
    if (!event) return;

    if (event.qrToken !== token) {
      toast.error("Invalid QR token.");
      return;
    }
    
    // Client side time validation
    if (event.endTimestamp > 0 && Math.floor(Date.now() / 1000) > event.endTimestamp) {
        toast.error("This event has already ended.");
        return;
    }

    setIsSubmitting(true);
    
    try {
      const preparedTx = await checkInTx(address, Number(event.id));
      const hash = await submitTx(preparedTx);

      saveCheckIn({
        eventId: event.id,
        eventName: event.name,
        eventDate: event.date,
        eventLocation: event.location,
        attendeeAddress: address,
        checkedInAt: Date.now(),
        txHash: hash,
      });

      toast.success("Successfully checked in!");
      setSuccessTx(hash);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to check in on-chain.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error && !event) {
    return (
      <div className="flex flex-col items-center justify-center mt-20">
        <div className="mb-4 self-start max-w-md mx-auto w-full">
          <Button variant="ghost" onClick={() => router.back()} className="text-slate-500 hover:text-slate-700">
            ← Back
          </Button>
        </div>
        <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-4">
        <Button variant="ghost" onClick={() => router.back()} className="text-slate-500 hover:text-slate-700">
          ← Back
        </Button>
      </div>
      {successTx ? (
        <Card className="border-green-100 bg-green-50/50 text-center py-8">
          <CardHeader>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-green-700">Checked In!</CardTitle>
            <CardDescription className="text-green-600">
              You have successfully attended this event.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <a
                href={`https://stellar.expert/explorer/testnet/tx/${successTx}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-indigo-600 hover:underline"
              >
                View Transaction on Stellar Expert
              </a>
          </CardContent>
          <CardFooter className="justify-center">
             <Link href="/my-attendance">
                <Button variant="outline">View My Attendance</Button>
             </Link>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Check-in to Event</CardTitle>
            <CardDescription>{event?.name || "Loading event details..."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
             )}
             
             {!address ? (
               <div className="text-center space-y-4">
                  <p className="text-sm text-slate-600">You need to connect your Freighter wallet to check in.</p>
                  <Button onClick={connect} disabled={isConnecting} className="w-full bg-indigo-600 hover:bg-indigo-700">
                    {isConnecting ? "Connecting..." : "Connect Freighter"}
                  </Button>
               </div>
             ) : (
               <div className="text-center space-y-4">
                  <p className="text-sm text-slate-600">
                    Checking in as <span className="font-mono font-medium">{address.substring(0,6)}...{address.substring(address.length-4)}</span>
                  </p>
                  <Button 
                    onClick={handleCheckIn} 
                    disabled={isSubmitting || !event} 
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    size="lg"
                  >
                    {isSubmitting ? (
                        <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Confirming Check-in...
                        </>
                    ) : (
                        "Confirm Check-in"
                    )}
                  </Button>
               </div>
             )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
