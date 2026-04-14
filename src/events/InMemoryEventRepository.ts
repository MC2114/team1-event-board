import { Err, Result, Ok } from "../lib/result";
import { EventError, UnexpectedError } from "./errors";
import { IEventRepository } from "./EventRepository";
import type { Event } from "./EventTypes";

const DEMO_EVENTS: Event[] = [
    {
        id: "event-1",
        title: "React Meetup",
        description: "A meetup for React developers",
        location: "Room 101",
        category: "technology",
        status: "published",
        capacity: 30,
        startDatetime: new Date("2026-05-10T18:00:00"),
        endDatetime: new Date("2026-05-10T20:00:00"),
        organizerId: "user-staff",
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
    },
    {
        id: "event-2",
        title: "Node Workshop",
        description: "Hands-on Node.js workshop",
        location: "Lab B",
        category: "technology",
        status: "draft",
        capacity: 20,
        startDatetime: new Date("2026-06-01T10:00:00"),
        endDatetime: new Date("2026-06-01T14:00:00"),
        organizerId: "user-staff",
        createdAt: new Date("2026-01-02"),
        updatedAt: new Date("2026-01-02"),
    },
    {
        id: "event-3",
        title: "Design Systems Talk",
        description: "A talk on building design systems",
        location: "Hall A",
        category: "design",
        status: "cancelled",
        capacity: 50,
        startDatetime: new Date("2026-03-15T09:00:00"),
        endDatetime: new Date("2026-03-15T11:00:00"),
        organizerId: "user-staff",
        createdAt: new Date("2026-01-03"),
        updatedAt: new Date("2026-01-03"),
    },
    {
        id: "event-4",
        title: "Admin Summit",
        description: "Cross-org admin event",
        location: "Main Hall",
        category: "leadership",
        status: "published",
        capacity: 100,
        startDatetime: new Date("2026-07-01T09:00:00"),
        endDatetime: new Date("2026-07-01T17:00:00"),
        organizerId: "user-admin",
        createdAt: new Date("2026-01-04"),
        updatedAt: new Date("2026-01-04"),
    },
];

class InMemoryEventRepository implements IEventRepository {
    constructor(private readonly events: Event[]) { }

    async findById(eventId: string): Promise<Result<Event | undefined, EventError>> {
        try {
            const match = this.events.find((e) => e.id === eventId);
            return Ok(match);
        } catch {
            return Err(UnexpectedError("Unable to look up event."))
        }
    }

    async findByOrganizer(organizerId: string): Promise<Result<Event[], EventError>> {
        try {
            const result = this.events
                .filter((e) => e.organizerId === organizerId)
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            return Ok(result);
        } catch {
            return Err(UnexpectedError("Unable to fetch events for organizers."))
        }
    }

    async findAll(): Promise<Result<Event[], EventError>> {
        try {
            const result = [...this.events].sort(
                (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
            );
            return Ok(result);
        } catch {
            return Err(UnexpectedError("Unable to fetch all events."))
        }
    }

    async save(event: Event): Promise<Result<Event, EventError>> {
        try {
            const index = this.events.findIndex((e) => e.id === event.id);
            if (index !== -1) {
                this.events[index] = event;
            } else {
                this.events.push(event);
            }
            return Ok(event);
        } catch {
            return Err(UnexpectedError("Unable to save event."))
        }
    }
}

export function CreateInMemoryEventRepository(): IEventRepository {
    return new InMemoryEventRepository([...DEMO_EVENTS])
}