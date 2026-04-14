export type EventStatus = "draft" | "published" | "cancelled" | "past";

export interface IEventRecord {
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

export interface ICreateEventRecordInput {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  capacity: number | null;
  startDatetime: Date;
  endDatetime: Date;
  organizerId: string;
  status?: EventStatus;
}
