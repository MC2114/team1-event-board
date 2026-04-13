export type EventStatus = "draft" | "published" | "cancelled" | "past";

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

export interface CreateEventData {
  title: string;
  description: string;
  location: string;
  category: string;
  capacity: number | null;
  startDatetime: Date;
  endDatetime: Date;
  organizerId: string;
}