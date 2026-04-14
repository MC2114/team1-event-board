import { Ok, Err, type Result } from "../lib/result";
import { IRsvpRepository } from "./RsvpRepository";
import type { RSVP, RSVPWithEvent, Event } from "./RsvpTypes";
import { UnexpectedError, type RsvpError } from "./errors";


export const DEMO_EVENTS: Event[] = [
    {
        id: "event-1",
        title: "React Meetup",
        description: "A meetup for React developers",
        location: "Room 101",
        category: "technology",
        status: "published",
        capacity: 2,
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
        status: "published",
        capacity: 30,
        startDatetime: new Date("2026-03-01T10:00:00"),
        endDatetime: new Date("2026-03-01T14:00:00"),
        organizerId: "user-staff",
        createdAt: new Date("2026-01-02"),
        updatedAt: new Date("2026-01-02"),
    },
]

export const DEMO_RSVPS: RSVP[] = [
    {
        id: "rsvp-1",
        eventId: "event-1",
        userId: "user-reader",
        status: "going",
        createdAt: new Date("2026-01-10"),
    }
]

class InMemoryRsvpRepository implements IRsvpRepository {
    constructor(
        private readonly events: Event[],
        private readonly rsvps: RSVP[]
    ) { }

    async findByUser(userId: string): Promise<Result<RSVPWithEvent[], RsvpError>> {
        try {
            const result = this.rsvps
                .filter((r) => r.userId === userId)
                .flatMap((r) => {
                    const event = this.events.find((e) => e.id === r.eventId)
                    if (!event) return [];
                    return [{ ...r, event }];
                })
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

            return Ok(result);
        } catch {
            return Err(UnexpectedError("Unable to read RSVPs."));
        }
    }

    async findByEvent(eventId: string): Promise<Result<RSVP[], RsvpError>> {
        try {
            const result = this.rsvps
                .filter((r) => r.eventId === eventId)
                .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
            return Ok(result)
        } catch {
            return Err(UnexpectedError("Unable to read RSVPs for event."))
        }
    }

    async findByUserAndEvent(userId: string, eventId: string): Promise<Result<RSVP | undefined, RsvpError>> {
        try {
            const match = this.rsvps.find((r) => r.userId === userId && r.eventId === eventId)
            return Ok(match)
        } catch {
            return Err(UnexpectedError("Unable to look up RSVP."))
        }
    }

    async findEventById(eventId: string): Promise<Result<Event | undefined, RsvpError>> {
        try {
            const match = this.events.find((e) => e.id === eventId);
            return Ok(match);
        } catch {
            return Err(UnexpectedError("Unable to look up event."))
        }
    }

    async countGoing(eventId: string): Promise<Result<number, RsvpError>> {
        try {
            const count = this.rsvps.filter((r) => r.eventId === eventId && r.status === "going").length;
            return Ok(count);
        } catch {
            return Err(UnexpectedError("Unable to count attendees."))
        }
    }

    async save(rsvp: RSVP): Promise<Result<RSVP, RsvpError>> {
        try {
            const index = this.rsvps.findIndex((r) => r.id === rsvp.id);
            if (index !== -1) {
                this.rsvps[index] = rsvp;
            } else {
                this.rsvps.push(rsvp)
            }
            return Ok(rsvp)
        } catch {
            return Err(UnexpectedError("Unable to save RSVP."))
        }
    }
}

export function CreateInMemoryRsvpRepository(): IRsvpRepository {
    return new InMemoryRsvpRepository([...DEMO_EVENTS], [...DEMO_RSVPS])
}