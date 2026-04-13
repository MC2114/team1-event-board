import type {UserRole} from "../auth/User"

export type {UserRole};
// need to change CONTRACTS.md to include EventStatus and RSVPstatus
export type EventStatus = "draft" | "published" | "cancelled" | "past";
export type RSVPStatus = "going" | "waitlisted" | "cancelled";

export type Event = {
    id: string;
    title: string;
    description: string;
    location: string;
    category: string;
    status: EventStatus;
    capacity: number | null;
    startDatetime: Date;
    endDatetime: Date;
    organizerId: string;
    createdAt: Date;
    updatedAt: Date;
};

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