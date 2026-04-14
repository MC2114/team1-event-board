import type {UserRole} from "../auth/User"

export type {UserRole};
export type EventStatus = "draft" | "published" | "cancelled" | "past";

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

export type EventDetailView = {
  event: Event;
  attendeeCount: number;
};