export type EventStatus = "draft" | "published" | "cancelled" | "past"

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

export interface EventWithAttendeeCount {
    event: Event;
    attendeeCount: number;
}

export interface OrganizerDashboard {
    published: EventWithAttendeeCount[];
    draft: EventWithAttendeeCount[];
    cancelledOrPast: EventWithAttendeeCount[];
}