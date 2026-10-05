"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getEvents, AppEvent } from "@/lib/storage";
import { getAttendeeCount } from "@/lib/stellar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Users, ArrowRight, Clock, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function EventList() {
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [now, setNow] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllActive, setShowAllActive] = useState(false);
  const [showAllPast, setShowAllPast] = useState(false);
  const [attendeeCounts, setAttendeeCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    // Only runs on the client, avoiding hydration mismatches
    const localEvents = getEvents();
    // eslint-disable-next-line
    setEvents(localEvents);
    setNow(Math.floor(Date.now() / 1000));
    setIsLoading(false);
    
    // Fetch on-chain attendee counts for all events
    localEvents.forEach(event => {
      getAttendeeCount(Number(event.id)).then(count => {
        setAttendeeCounts(prev => ({ ...prev, [event.id]: count }));
      });
    });
    
    // Periodically update current time to move events to past dynamically
    const intervalId = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 60000); // Check every minute
    return () => clearInterval(intervalId);
  }, []);

  if (isLoading) {
    return (
      <div className="w-full max-w-3xl mt-12 space-y-6">
         <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-6" />
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map(i => (
               <Card key={i} className="h-[300px] border-slate-100 flex flex-col overflow-hidden animate-pulse">
                  <div className="w-full h-32 bg-slate-200" />
                  <CardHeader className="space-y-2 pb-3">
                     <div className="h-5 w-3/4 bg-slate-200 rounded" />
                     <div className="h-4 w-full bg-slate-100 rounded" />
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-end space-y-4">
                     <div className="space-y-2">
                        <div className="h-3 w-1/2 bg-slate-100 rounded" />
                        <div className="h-3 w-2/3 bg-slate-100 rounded" />
                     </div>
                     <div className="h-9 w-full bg-slate-200 rounded" />
                  </CardContent>
               </Card>
            ))}
         </div>
      </div>
    );
  }

  if (events.length === 0) {
    return null; // Don't show the section if there are no events yet
  }

  // Filter based on search query
  const filteredEvents = events.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeEvents = filteredEvents.filter(e => e.endTimestamp > now);
  const pastEvents = filteredEvents.filter(e => e.endTimestamp <= now);

  const activeLimit = 4;
  const pastLimit = 2;

  const visibleActive = showAllActive ? activeEvents : activeEvents.slice(0, activeLimit);
  const visiblePast = showAllPast ? pastEvents : pastEvents.slice(0, pastLimit);

  const renderEventCard = (event: AppEvent, isPast: boolean) => {
    // Determine if the event ends within the next hour
    const isNearEnd = !isPast && (event.endTimestamp - now) < 3600;
    const timeColorClass = isPast ? 'text-slate-400' : (isNearEnd ? 'text-red-500 font-medium' : 'text-slate-600');
    const timeIconClass = isPast ? 'text-slate-400' : (isNearEnd ? 'text-red-500' : 'text-indigo-400');

    return (
      <Link href={`/event/${event.id}`} key={event.id} className="block group outline-none flex flex-col h-full">
        <Card className={`flex flex-col h-full transition-all cursor-pointer overflow-hidden ${isPast ? 'opacity-75 hover:opacity-100 grayscale-[0.5] hover:grayscale-0' : 'hover:ring-indigo-300 hover:shadow-md'}`}>
          <div className="w-full h-32 bg-gradient-to-br from-indigo-100 to-purple-50 overflow-hidden relative border-b border-slate-100 flex items-center justify-center">
            {event.imageUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={event.imageUrl}
                  alt={event.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </>
            ) : (
              <Calendar className="w-12 h-12 text-indigo-200/50 group-hover:scale-110 transition-transform duration-500" />
            )}
          </div>
          <CardHeader className="pb-3">
            <CardTitle className={`text-lg line-clamp-1 transition-colors ${isPast ? 'text-slate-700' : 'group-hover:text-indigo-700'}`} title={event.name}>
              {event.name} {isPast && <span className="text-xs ml-2 font-normal text-red-500 border border-red-200 px-2 py-0.5 rounded-full bg-red-50">Ended</span>}
            </CardTitle>
            <CardDescription className="line-clamp-2 h-10" title={event.description}>
              {event.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-end space-y-4">
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Calendar className={`w-4 h-4 ${isPast ? 'text-slate-400' : 'text-indigo-400'}`} />
                <span className="truncate">{event.date}</span>
              </div>
              <div className={`flex items-center gap-2 ${timeColorClass}`}>
                <Clock className={`w-4 h-4 ${timeIconClass}`} />
                <span className="truncate">Ends: {new Date(event.endTimestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className={`w-4 h-4 ${isPast ? 'text-slate-400' : 'text-indigo-400'}`} />
                <span className="truncate">{event.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className={`w-4 h-4 ${isPast ? 'text-slate-400' : 'text-indigo-400'}`} />
                <span>
                  {attendeeCounts[event.id] !== undefined 
                     ? (event.maxAttendees > 0 ? `${attendeeCounts[event.id]} / ${event.maxAttendees} Attendees` : `${attendeeCounts[event.id]} Attendees`)
                     : (event.maxAttendees > 0 ? `Max: ${event.maxAttendees}` : "Loading...")}
                </span>
              </div>
            </div>
            <div className="w-full block">
              <Button variant="outline" className={`w-full justify-between transition-colors ${!isPast && 'group-hover:bg-indigo-50 group-hover:ring-1 group-hover:ring-indigo-200'}`} tabIndex={-1}>
                {isPast ? 'View Archive' : 'View Details'}
                <ArrowRight className={`w-4 h-4 transition-transform ${!isPast && 'group-hover:translate-x-1 text-indigo-600'}`} />
              </Button>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  return (
    <div className="w-full max-w-3xl mt-12 space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 fill-mode-both">
      <div className="relative max-w-md mx-auto sm:mx-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input 
          placeholder="Search events by name or location..." 
          className="pl-10 h-12 bg-white border-slate-200 focus-visible:ring-indigo-500 rounded-xl shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredEvents.length === 0 && (
         <div className="text-center py-12">
            <p className="text-slate-500 text-lg">No events found matching &quot;{searchQuery}&quot;</p>
         </div>
      )}

      {activeEvents.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
            Active Events <span className="bg-indigo-100 text-indigo-700 text-sm font-semibold px-2 py-0.5 rounded-full">{activeEvents.length}</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {visibleActive.map(e => renderEventCard(e, false))}
          </div>
          {!showAllActive && activeEvents.length > activeLimit && (
            <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={() => setShowAllActive(true)} className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                View More Active Events
              </Button>
            </div>
          )}
        </div>
      )}

      {pastEvents.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-600 border-b pb-2 flex items-center gap-2">
            Past Events <span className="bg-slate-100 text-slate-600 text-sm font-semibold px-2 py-0.5 rounded-full">{pastEvents.length}</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {visiblePast.map(e => renderEventCard(e, true))}
          </div>
          {!showAllPast && pastEvents.length > pastLimit && (
            <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={() => setShowAllPast(true)} className="text-slate-600 border-slate-200 hover:bg-slate-50">
                View More Past Events
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
