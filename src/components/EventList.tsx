"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getEvents, AppEvent } from "@/lib/storage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EventList() {
  const [events, setEvents] = useState<AppEvent[]>([]);

  useEffect(() => {
    // Only runs on the client, avoiding hydration mismatches
    setEvents(getEvents());
  }, []);

  if (events.length === 0) {
    return null; // Don't show the section if there are no events yet
  }

  return (
    <div className="w-full max-w-3xl mt-12 space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 fill-mode-both">
      <h2 className="text-2xl font-bold text-slate-900 border-b pb-2">Available Events (Local)</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {events.map((event) => (
          <Link href={`/event/${event.id}`} key={event.id} className="block group outline-none flex flex-col h-full">
            <Card className="flex flex-col h-full border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer overflow-hidden">
              {event.imageUrl && (
                <div className="w-full h-32 bg-slate-100 overflow-hidden relative">
                  <img 
                    src={event.imageUrl} 
                    alt={event.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                </div>
              )}
              <CardHeader className="pb-3">
                <CardTitle className="text-lg line-clamp-1 group-hover:text-indigo-700 transition-colors" title={event.name}>
                  {event.name}
                </CardTitle>
                <CardDescription className="line-clamp-2 h-10" title={event.description}>
                  {event.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-end space-y-4">
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    <span className="truncate">{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-400" />
                    <span className="truncate">{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-400" />
                    <span>Max: {event.maxAttendees}</span>
                  </div>
                </div>
                <div className="w-full block">
                  <Button variant="outline" className="w-full justify-between group-hover:bg-indigo-50 group-hover:border-indigo-200 transition-colors" tabIndex={-1}>
                    View Details
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-indigo-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
