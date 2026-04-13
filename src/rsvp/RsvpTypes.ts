export type RsvpStatus = "going" | "waitlisted" | "cancelled";
export interface RSVP {
    id: string;
    eventId: string;
    userId: string;
    status: RsvpStatus;
    createdAt: Date;
}