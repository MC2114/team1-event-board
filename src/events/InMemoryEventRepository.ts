import { Err, Ok, type Result } from "../lib/result";
import { UnexpectedDependencyError, type EventError } from "./errors";
import type { Event, EventStatus } from "./Event";
import type { IEventRepository } from "./EventRepository";

export const DEMO_EVENTS: Event[] = [
    {
        id: "event-published-1",
        title: "Spring Picnic",
        description: "Food, games, and fun on the lawn.",
        location: "Campus Pond Lawn",
        category: "social",
        status: "published",
        capacity: 25,
        startDatetime: new Date("2026-04-20T15:00:00"),
        endDatetime: new Date("2026-04-20T17:00:00"),
        organizerId: "user-staff-1",
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: "event-published-2",
        title: "Graduation Celebration Draft",
        description: "Come congratulate our Seniors.",
        location: "Boston, MA",
        category: "graduation",
        status: "published",
        capacity: 100,
        startDatetime: new Date("2026-05-15T17:00:00"),
        endDatetime: new Date("2026-05-15T20:00:00"),
        organizerId: "user-staff-2",
        createdAt: new Date("2026-04-02T09:00:00"),
        updatedAt: new Date("2026-04-02T09:00:00"),
    },
    {
        id: "event-draft-1",
        title: "Draft Planning Meeting",
        description: "This is still a draft event.",
        location: "Student Union 201",
        category: "networking",
        status: "draft",
        capacity: 10,
        startDatetime: new Date("2026-04-24T18:00:00"),
        endDatetime: new Date("2026-04-24T19:00:00"),
        organizerId: "user-staff-3",
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];

class InMemoryEventRepository implements IEventRepository {
    constructor(private readonly events: Event[]) {}

    async findById(eventId: string): Promise<Result<Event | null, EventError>> {
        try {
            const match = this.events.find((event) => event.id === eventId) ?? null;
            return Ok(match);
        } catch {
            return Err(UnexpectedDependencyError("Unable to read the event."));
        }
    }

    async findAll(): Promise<Result<Event[], EventError>> {
        try {
            return Ok(this.events);
        } catch {
            return Err(UnexpectedDependencyError("Unable to read events."));
        }
    }

    async create(event: Event): Promise<Result<Event, EventError>> {
        try {
            this.events.push(event);
            return Ok(event);
        } catch {
            return Err(UnexpectedDependencyError("Unable to create the event."));
        }
    }

    async update(event: Event): Promise<Result<Event | null, EventError>> {
        try {
            const index = this.events.findIndex((existing) => existing.id === event.id);
            if (index === -1) {
            return Ok(null);
            }
            const updatedEvent: Event = {
            ...event,
            updatedAt: new Date(),
            };
            this.events[index] = updatedEvent;
            return Ok(updatedEvent);
        } catch {
            return Err(UnexpectedDependencyError("Unable to update the event."));
        }
    }
    async updateStatus(eventId: string, status: EventStatus): Promise<Result<Event | null, EventError>> {
        try {
            const event = this.events.find((e) => e.id === eventId);
            if (!event){
                return Ok(null);
            }
            event.status = status;
            event.updatedAt = new Date();
            return Ok(event);
        } catch {
            return Err(UnexpectedDependencyError("Unable to update the event status."));
        }
    }
}

function CreateInMemoryEventRepository(): IEventRepository {
    return new InMemoryEventRepository([...DEMO_EVENTS]);
}