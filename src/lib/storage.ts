export interface AppEvent {
  id: string; // The u64 event_id as string
  name: string;
  description: string;
  location: string;
  date: string;
  endTimestamp: number;
  maxAttendees: number;
  organizerAddress: string;
  qrToken: string;
  imageUrl?: string;
}

export interface CheckInRecord {
  eventId: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  attendeeAddress: string;
  checkedInAt: number;
  txHash: string;
}

export function saveEvent(event: AppEvent) {
  const events = getEvents();
  events.push(event);
  localStorage.setItem("events", JSON.stringify(events));
}

export function getEvents(): AppEvent[] {
  if (typeof window === "undefined") return [];
  const eventsJson = localStorage.getItem("events");
  if (eventsJson) {
    try {
      return JSON.parse(eventsJson);
    } catch (e) {
      return [];
    }
  }
  return [];
}

export function getEvent(id: string): AppEvent | undefined {
  return getEvents().find((e) => e.id === id);
}

export function saveCheckIn(record: CheckInRecord) {
  const checkins = getCheckIns();
  checkins.push(record);
  localStorage.setItem("checkins", JSON.stringify(checkins));
}

export function getCheckIns(): CheckInRecord[] {
  if (typeof window === "undefined") return [];
  const checkinsJson = localStorage.getItem("checkins");
  if (checkinsJson) {
    try {
      return JSON.parse(checkinsJson);
    } catch (e) {
      return [];
    }
  }
  return [];
}

export function getMyCheckIns(address: string): CheckInRecord[] {
  return getCheckIns().filter((c) => c.attendeeAddress === address);
}
