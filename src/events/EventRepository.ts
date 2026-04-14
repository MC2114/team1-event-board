import { randomUUID } from "node:crypto";
import type { Event, CreateEventData } from "./Event";

export interface IEventRepository {
  create(data: CreateEventData): Event;
  findById(id: string): Event | null;
  findAll(): Event[];
  update(event: Event): Event;
}

const events: Map<string, Event> = new Map();

function create(data: CreateEventData): Event {
  const now = new Date();
  const event: Event = {
    id: randomUUID(),
    title: data.title,
    description: data.description,
    location: data.location,
    category: data.category,
    status: "draft",
    capacity: data.capacity,
    startDatetime: data.startDatetime,
    endDatetime: data.endDatetime,
    organizerId: data.organizerId,
    createdAt: now,
    updatedAt: now,
  };
  events.set(event.id, event);
  return { ...event };
}

function findById(id: string): Event | null {
  const event = events.get(id);
  return event ? { ...event } : null;
}

function findAll(): Event[] {
  return Array.from(events.values()).map((e) => ({ ...e }));
}

function update(event: Event): Event {
  const updated = { ...event, updatedAt: new Date() };
  events.set(updated.id, updated);
  return { ...updated };
}

export function CreateInMemoryEventRepository(): IEventRepository {
  return { create, findById, findAll, update };
}