import { Ok, Err, type Result } from "../lib/result";
import { IRSVPRepository } from "./RsvpRepository";
import type { RSVP, RSVPWithEvent } from "./RSVP";
import { Event } from "../events/Event";
import { UnexpectedError, type RSVPError } from "./errors";
import { DEMO_EVENTS } from "../events/InMemoryEventRepository";

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
    constructor(
        private readonly events: Event[],
        private readonly rsvps: RSVP[]
    ) { }

    async findByUser(userId: string): Promise<Result<RSVPWithEvent[], RSVPError>> {
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

    async findByEvent(eventId: string): Promise<Result<RSVP[], RSVPError>> {
        try {
            const result = this.rsvps
                .filter((r) => r.eventId === eventId)
                .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
            return Ok(result)
        } catch {
            return Err(UnexpectedError("Unable to read RSVPs for event."))
        }
    }

    async findByUserAndEvent(userId: string, eventId: string): Promise<Result<RSVP | null, RSVPError>> {
        try {
            const match = this.rsvps.find((r) => r.userId === userId && r.eventId === eventId)
            return Ok(match ?? null)
        } catch {
            return Err(UnexpectedError("Unable to look up RSVP."))
        }
    }

    async countGoing(eventId: string): Promise<Result<number, RSVPError>> {
        try {
            const count = this.rsvps.filter((r) => r.eventId === eventId && r.status === "going").length;
            return Ok(count);
        } catch {
            return Err(UnexpectedError("Unable to count attendees."))
        }
    }

    async save(rsvp: RSVP): Promise<Result<RSVP, RSVPError>> {
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

export function CreateInMemoryRsvpRepository(): IRSVPRepository {
    return new InMemoryRSVPRepository([...DEMO_EVENTS], [...DEMO_RSVPS])
}