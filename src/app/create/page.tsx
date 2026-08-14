"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/contexts/WalletContext";
import { createEventTx, submitTx } from "@/lib/stellar";
import { saveEvent } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function CreateEvent() {
  const router = useRouter();
  const { address } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress image using canvas to fit in localStorage
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert back to base64 jpeg
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        setLocalImageUrl(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!address) {
      setError("Please connect your wallet first.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const location = formData.get("location") as string;
    const date = formData.get("date") as string;
    const endTimestampInput = formData.get("endTimestamp") as string;
    const maxAttendees = Number(formData.get("maxAttendees"));
    const formImageUrl = formData.get("imageUrl") as string;
    
    // Prefer the uploaded local image if one was selected, otherwise fallback to the URL input
    const finalImageUrl = localImageUrl || formImageUrl || undefined;

    // Convert date + time to unix timestamp
    const endTimestamp = Math.floor(new Date(`${date}T${endTimestampInput}`).getTime() / 1000);
    const eventId = Math.floor(Math.random() * 1000000000); // Generate a random u64 for event ID
    const qrToken = Math.random().toString(36).substring(2, 15);

    try {
      const preparedTx = await createEventTx(address, eventId, maxAttendees, endTimestamp);
      await submitTx(preparedTx);

      saveEvent({
        id: eventId.toString(),
        name,
        description,
        location,
        date,
        endTimestamp,
        maxAttendees,
        organizerAddress: address,
        qrToken,
        imageUrl: finalImageUrl,
      });

      router.push(`/event/${eventId}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create event on-chain.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-4">
        <Button variant="ghost" onClick={() => router.back()} className="text-slate-500 hover:text-slate-700">
          ← Back
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Create New Event</CardTitle>
          <CardDescription>
            Deploy your event to the Soroban smart contract. Note: local browser storage is used for event details.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Event Name</Label>
              <Input id="name" name="name" required placeholder="Web3 Meetup" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" required placeholder="A meetup for web3 developers." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" required placeholder="Crypto Cafe, San Francisco" />
            </div>
            
            <div className="space-y-4 border p-4 rounded-lg bg-slate-50">
               <Label>Banner Image (Optional)</Label>
               <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="imageFile" className="text-xs text-slate-500">Upload Local Image</Label>
                    <Input id="imageFile" type="file" accept="image/*" onChange={handleImageUpload} className="bg-white" />
                  </div>
                  
                  {localImageUrl && (
                    <div className="h-32 rounded overflow-hidden border border-slate-200">
                      <img src={localImageUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-slate-200"></div>
                    <span className="text-xs text-slate-400 font-medium">OR</span>
                    <div className="flex-1 h-px bg-slate-200"></div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="imageUrl" className="text-xs text-slate-500">Provide Image URL</Label>
                    <Input id="imageUrl" name="imageUrl" type="url" placeholder="https://example.com/banner.jpg" disabled={!!localImageUrl} className="bg-white" />
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" name="date" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTimestamp">End Time</Label>
                <Input id="endTimestamp" name="endTimestamp" type="time" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxAttendees">Max Attendees</Label>
              <Input id="maxAttendees" name="maxAttendees" type="number" min="1" required placeholder="100" />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isSubmitting || !address}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirming in wallet...
                </>
              ) : !address ? (
                "Connect Wallet to Create"
              ) : (
                "Create Event"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
