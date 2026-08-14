import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarPlus, CheckCircle } from "lucide-react";
import { EventList } from "@/components/EventList";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-4 max-w-lg">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
          Was<span className="text-indigo-600">There</span>
        </h1>
        <p className="text-lg text-slate-600 font-medium">
          Proof you showed up. <span className="block mt-2 text-base font-normal text-slate-500">Create events, scan QR codes, and issue permanent, verifiable attendance records on the Stellar blockchain.</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        <Card className="hover:shadow-lg transition-all border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarPlus className="text-indigo-600" /> Create Event
            </CardTitle>
            <CardDescription>
              Host a new event and generate a check-in QR code for attendees.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/create">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">Get Started</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="text-indigo-600" /> My Attendance
            </CardTitle>
            <CardDescription>
              View the history of all the events you've checked into on-chain.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/my-attendance">
              <Button variant="outline" className="w-full">View Records</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <EventList />
    </div>
  );
}
