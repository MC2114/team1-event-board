export type RsvpStatus = "going" | "waitlisted" | "cancelled";
export type EventStatus = "draft" | "published" | "cancelled" | "past";

export interface RSVP {
    id: string;
    eventId: string;
    userId: string;
    status: RsvpStatus;
    createdAt: Date;
}

export interface Event {
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
}

export interface RSVPWithEvent extends RSVP {
    event: Event;
}