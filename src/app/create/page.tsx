"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/contexts/WalletContext";
import { createEventTx, submitTx } from "@/lib/stellar";
import { saveEvent } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

export default function CreateEvent() {
  const router = useRouter();
  const { address } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const removeImage = () => {
    setLocalImageUrl(null);
    const fileInput = document.getElementById("imageFile") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!address) {
      toast.error("Please connect your wallet first.");
      return;
    }

    setIsSubmitting(true);
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

      toast.success("Event created successfully!");
      router.push(`/event/${eventId}`);
    } catch (e: unknown) {
      const err = e as Error;
      console.error(err);
      toast.error(err.message || "Failed to create event. Check console for details.");
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
      <div className="text-center space-y-2 mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900">Create New Event</h1>
        <p className="text-slate-600">Deploy your event to the Soroban smart contract. Note: local browser storage is used for event details.</p>
      </div>

      <Card className="shadow-md border-slate-200">
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
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
                    <div className="relative h-32 rounded overflow-hidden border border-slate-200 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={localImageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-white/90 hover:bg-white text-red-500 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove Image"
                      >
                         <X className="w-4 h-4" />
                      </button>
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
