import { Err, Ok, type Result } from "../lib/result";
import { UnexpectedDependencyError, type EventError } from "./errors";
import type { RSVP } from "./Event";
import type { IRSVPRepository } from "./RSVPRepository";

export const DEMO_RSVPS: RSVP[] = [
    {
        id: "rsvp-1",
        eventId: "event-published-1",
        userId: "user-1",
        status: "going",
        createdAt: new Date("2026-04-05T10:00:00"),
    },
    {
        id: "rsvp-2",
        eventId: "event-published-1",
        userId: "user-2",
        status: "waitlisted",
        createdAt: new Date("2026-04-05T10:05:00"),
    },
    {
        id: "rsvp-3",
        eventId: "event-published-1",
        userId: "user-3",
        status: "going",
        createdAt: new Date("2026-04-05T10:10:00"),
    },
    {
        id: "rsvp-4",
        eventId: "event-published-2",
        userId: "user-4",
        status: "cancelled",
        createdAt: new Date("2026-04-06T09:00:00"),
    },
];

class InMemoryRSVPRepository implements IRSVPRepository {
    constructor(private readonly rsvps: RSVP[]) {}

    async countGoingByEvent(eventId: string): Promise<Result<number, EventError>> {
        try {
            const count = this.rsvps.filter(
            (rsvp) => rsvp.eventId === eventId && rsvp.status === "going"
        ).length;

        return Ok(count);
        } catch {
        return Err(UnexpectedDependencyError("Unable to count attendees for the event."));
        }
    }
    
    async getRSVPByEventAndUser(
        eventId: string,
        userId: string,
    ): Promise<Result<RSVP | null, EventError>> {
        try {
            const match =
            this.rsvps.find(
            (rsvp) => rsvp.eventId === eventId && rsvp.userId === userId
            ) ?? null;

        return Ok(match);
        } catch {
        return Err(UnexpectedDependencyError("Unable to count RSVPs for event."));
        }
    }
}

export function CreateInMemoryRSVPRepository(): IRSVPRepository {
    return new InMemoryRSVPRepository(DEMO_RSVPS);
}