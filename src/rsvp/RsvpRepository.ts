import { Result } from "../lib/result";
import type { RSVP, RSVPWithEvent } from "./RSVP";
import type { Event } from "../events/Event";
import type { RSVPError } from "./errors.ts"

export interface IRSVPRepository {
    findByUser(userId: string): Promise<Result<RSVPWithEvent[], RSVPError>>;
    findByEvent(eventId: string): Promise<Result<RSVP[], RSVPError>>;
    findByUserAndEvent(userId: string, eventId: string): Promise<Result<RSVP | null, RSVPError>>;
    findEventById(eventId: string): Promise<Result<Event | null, RSVPError>>;
    countGoing(eventId: string): Promise<Result<number, RSVPError>>;
    save(rsvp: RSVP): Promise<Result<RSVP, RSVPError>>;
}