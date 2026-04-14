import { Ok, Err, type Result } from "../lib/result";
import { IRsvpRepository } from "./RsvpRepository";
import type { RSVP, RSVPWithEvent, Event } from "./RsvpTypes";
import type { RsvpError } from "./errors";


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
            return Err({ name: "Unexpected Error"})
        }
    }
}