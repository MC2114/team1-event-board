import { Event } from "../events/Event";
export type RSVPStatus = "going" | "waitlisted" | "cancelled";

export type RSVP = {
    id: string;
    eventId: string;
    userId: string;
    status: RSVPStatus;
    createdAt: Date;
}

export type RSVPWithEvent = {
    id: string
    eventId: string
    userId: string
    status: RSVPStatus
    createdAt: Date
    event: Event
}